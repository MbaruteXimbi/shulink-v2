const pool    = require('../db');
const { v4: uuid } = require('uuid');
const ExcelJS = require('exceljs');
const path    = require('path');

const sid = req => req.user.school_id;

// ── LIST & GET ─────────────────────────────────────────────────

exports.list = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ch.*, q.title AS qualification_title, q.curriculum_code,
              q.rqf_level, s.name AS sector_name,
              u.full_name AS imported_by_name,
              (SELECT COUNT(*) FROM chronogram_weeks cw WHERE cw.chronogram_id=ch.id) AS week_count
       FROM chronograms ch
       JOIN qualifications q ON ch.qualification_id=q.id
       LEFT JOIN rtb_sectors s ON q.sector_id=s.id
       LEFT JOIN users u ON ch.imported_by=u.id
       WHERE ch.school_id=? AND ch.is_active=1
       ORDER BY ch.academic_year DESC`,
      [sid(req)]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.get = async (req, res) => {
  try {
    const [[ch]] = await pool.query(
      `SELECT ch.*, q.title AS qualification_title, q.curriculum_code, q.rqf_level
       FROM chronograms ch
       JOIN qualifications q ON ch.qualification_id=q.id
       WHERE ch.id=? AND ch.school_id=?`,
      [req.params.id, sid(req)]
    );
    if (!ch) return res.status(404).json({ error: 'Chronogram not found' });

    const [terms] = await pool.query(
      `SELECT * FROM chronogram_terms WHERE chronogram_id=? ORDER BY term_number`,
      [ch.id]
    );
    for (const term of terms) {
      const [weeks] = await pool.query(
        `SELECT cw.*,
          JSON_OBJECTAGG(m.code, ca.periods) AS allocations
         FROM chronogram_weeks cw
         LEFT JOIN chronogram_allocations ca ON ca.week_id=cw.id
         LEFT JOIN modules m ON ca.module_id=m.id
         WHERE cw.term_id=?
         GROUP BY cw.id
         ORDER BY cw.week_number`,
        [term.id]
      );
      term.weeks = weeks;
    }
    res.json({ ...ch, terms });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── CREATE MANUALLY ────────────────────────────────────────────

exports.create = async (req, res) => {
  const { qualification_id, academic_year, notes } = req.body;
  if (!qualification_id || !academic_year)
    return res.status(400).json({ error: 'qualification_id and academic_year required' });
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO chronograms (id,school_id,qualification_id,academic_year,import_source,imported_by,notes)
       VALUES (?,?,?,?,?,?,?)`,
      [id, sid(req), qualification_id, academic_year, 'manual', req.user.id, notes||null]
    );
    const [[ch]] = await pool.query(`SELECT * FROM chronograms WHERE id=?`, [id]);
    res.status(201).json(ch);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'A chronogram already exists for this qualification and year' });
    res.status(500).json({ error: e.message });
  }
};

// ── IMPORT FROM EXCEL ─────────────────────────────────────────

exports.importExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No Excel file uploaded' });
  const { qualification_id, academic_year } = req.body;
  if (!qualification_id || !academic_year)
    return res.status(400).json({ error: 'qualification_id and academic_year required' });

  const conn = await pool.getConnection();
  const errors = [];
  let success_rows = 0;

  try {
    await conn.beginTransaction();

    // Load workbook
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(req.file.path);
    const ws = wb.getWorksheet('Chronogram');
    if (!ws) throw new Error('Sheet "Chronogram" not found in uploaded file. Use the Shulink template.');

    // Row 9 has module codes — find which columns they are in
    const moduleCodeRow = ws.getRow(9);
    const moduleColMap = {}; // code → column index
    moduleCodeRow.eachCell({ includeEmpty: false }, (cell, colNum) => {
      const val = String(cell.value || '').trim().toUpperCase();
      if (val && colNum > 6) moduleColMap[val] = colNum;
    });

    if (!Object.keys(moduleColMap).length)
      throw new Error('No module codes found in row 9. Fill in module codes before importing.');

    // Verify module codes exist in DB
    const codes = Object.keys(moduleColMap);
    const [dbModules] = await conn.query(
      `SELECT id, code FROM modules WHERE qualification_id=? AND code IN (${codes.map(() => '?').join(',')})`,
      [qualification_id, ...codes]
    );
    const moduleIdMap = {}; // code → id
    dbModules.forEach(m => { moduleIdMap[m.code] = m.id; });
    const missingCodes = codes.filter(c => !moduleIdMap[c]);
    if (missingCodes.length)
      throw new Error(`Module codes not found in Shulink for this qualification: ${missingCodes.join(', ')}`);

    // Delete existing chronogram for this school/qual/year if any
    await conn.query(
      `DELETE FROM chronograms WHERE school_id=? AND qualification_id=? AND academic_year=?`,
      [sid(req), qualification_id, academic_year]
    );

    // Create chronogram header
    const chronoId = uuid();
    await conn.query(
      `INSERT INTO chronograms (id,school_id,qualification_id,academic_year,import_source,imported_by)
       VALUES (?,?,?,?,?,?)`,
      [chronoId, sid(req), qualification_id, academic_year, 'excel', req.user.id]
    );

    // Parse rows 10+ — identify terms by orange header rows
    let currentTermId = null;
    let currentTermNum = 0;
    let totalPeriods = 0;

    ws.eachRow((row, rowNum) => {
      if (rowNum < 10) return;
      const firstCell = String(row.getCell(1).value || '').trim();

      // Term header rows: "TERM 1", "TERM 2", "TERM 3"
      if (firstCell.startsWith('TERM ')) {
        currentTermNum++;
        const termId = uuid();
        currentTermId = termId;
        // We'll update dates later from week rows
        conn.query(
          `INSERT INTO chronogram_terms (id,chronogram_id,term_number,name) VALUES (?,?,?,?)`,
          [termId, chronoId, currentTermNum, firstCell]
        );
        return;
      }

      // Week rows: first cell should be a number
      const weekNum = parseInt(firstCell);
      if (!weekNum || !currentTermId) return;

      // Parse dates
      const dateStart = parseDate(row.getCell(3).value);
      const dateEnd   = parseDate(row.getCell(4).value);
      const weekType  = String(row.getCell(5).value || 'teaching').trim().toLowerCase();
      const notes     = String(row.getCell(6).value || '').trim() || null;

      const weekId = uuid();
      let weekTotal = 0;
      const allocs = [];

      // Module allocations
      for (const [code, colNum] of Object.entries(moduleColMap)) {
        const val = parseInt(row.getCell(colNum).value) || 0;
        if (val > 0) {
          allocs.push({ module_id: moduleIdMap[code], periods: val });
          weekTotal += val;
        }
      }
      totalPeriods += weekTotal;
      success_rows++;

      conn.query(
        `INSERT INTO chronogram_weeks (id,chronogram_id,term_id,week_number,date_start,date_end,total_periods,week_type,notes)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [weekId, chronoId, currentTermId, weekNum,
         dateStart, dateEnd, weekTotal,
         VALID_WEEK_TYPES.includes(weekType) ? weekType : 'teaching',
         notes]
      );

      allocs.forEach(a => {
        conn.query(
          `INSERT INTO chronogram_allocations (id,week_id,module_id,periods) VALUES (?,?,?,?)`,
          [uuid(), weekId, a.module_id, a.periods]
        );
      });
    });

    // Update total periods
    await conn.query(`UPDATE chronograms SET total_periods=? WHERE id=?`, [totalPeriods, chronoId]);

    await conn.commit();

    // Log import
    await pool.query(
      `INSERT INTO import_logs (id,school_id,import_type,file_name,total_rows,success_rows,error_rows,errors,imported_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [uuid(), sid(req), 'chronogram', req.file.originalname,
       success_rows, success_rows, errors.length, JSON.stringify(errors), req.user.id]
    );

    res.json({
      message: `Chronogram imported successfully. ${success_rows} weeks, ${totalPeriods} total periods.`,
      chronogram_id: chronoId,
      weeks: success_rows,
      total_periods: totalPeriods,
      modules: Object.keys(moduleColMap),
    });

  } catch (e) {
    await conn.rollback();
    res.status(400).json({ error: e.message, errors });
  } finally {
    conn.release();
  }
};

// ── WEEK OPERATIONS ───────────────────────────────────────────

exports.addWeek = async (req, res) => {
  const { chronogram_id, term_id, week_number, date_start, date_end,
          week_type, notes, allocations } = req.body;
  if (!chronogram_id || !term_id || !week_number)
    return res.status(400).json({ error: 'chronogram_id, term_id, week_number required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const weekId = uuid();
    const total = (allocations || []).reduce((s, a) => s + (a.periods || 0), 0);
    await conn.query(
      `INSERT INTO chronogram_weeks (id,chronogram_id,term_id,week_number,date_start,date_end,total_periods,week_type,notes)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [weekId, chronogram_id, term_id, week_number, date_start||null, date_end||null,
       total, week_type||'teaching', notes||null]
    );
    for (const a of (allocations || [])) {
      if (a.module_id && a.periods > 0) {
        await conn.query(
          `INSERT INTO chronogram_allocations (id,week_id,module_id,periods) VALUES (?,?,?,?)
           ON DUPLICATE KEY UPDATE periods=VALUES(periods)`,
          [uuid(), weekId, a.module_id, a.periods]
        );
      }
    }
    await conn.query(
      `UPDATE chronograms SET total_periods=total_periods+? WHERE id=?`,
      [total, chronogram_id]
    );
    await conn.commit();
    const [[week]] = await conn.query(`SELECT * FROM chronogram_weeks WHERE id=?`, [weekId]);
    res.status(201).json(week);
  } catch (e) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
};

exports.updateWeek = async (req, res) => {
  const { date_start, date_end, week_type, notes, allocations } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const weekId = req.params.weekId;
    await conn.query(
      `UPDATE chronogram_weeks SET date_start=?, date_end=?, week_type=?, notes=? WHERE id=?`,
      [date_start||null, date_end||null, week_type||'teaching', notes||null, weekId]
    );
    if (allocations) {
      await conn.query(`DELETE FROM chronogram_allocations WHERE week_id=?`, [weekId]);
      let total = 0;
      for (const a of allocations) {
        if (a.module_id && a.periods > 0) {
          await conn.query(
            `INSERT INTO chronogram_allocations (id,week_id,module_id,periods) VALUES (?,?,?,?)`,
            [uuid(), weekId, a.module_id, a.periods]
          );
          total += a.periods;
        }
      }
      await conn.query(`UPDATE chronogram_weeks SET total_periods=? WHERE id=?`, [total, weekId]);
    }
    await conn.commit();
    const [[week]] = await conn.query(`SELECT * FROM chronogram_weeks WHERE id=?`, [weekId]);
    res.json(week);
  } catch (e) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
};

exports.deleteChronogram = async (req, res) => {
  try {
    await pool.query(`DELETE FROM chronograms WHERE id=? AND school_id=?`, [req.params.id, sid(req)]);
    res.json({ message: 'Chronogram deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── HELPERS ───────────────────────────────────────────────────

const VALID_WEEK_TYPES = ['teaching','assessment_school','assessment_district','assessment_national','iap','holiday','other'];

function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  const s = String(val).trim();
  // DD/MM/YYYY
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}
