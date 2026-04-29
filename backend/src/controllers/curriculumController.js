const pool = require('../db');
const { v4: uuid } = require('uuid');

const sid = req => req.user.school_id;

// ── QUALIFICATIONS ────────────────────────────────────────────

exports.listQualifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT q.*, s.name AS sector_name, s.code AS sector_code,
              (SELECT COUNT(*) FROM modules m WHERE m.qualification_id = q.id) AS module_count
       FROM qualifications q
       LEFT JOIN rtb_sectors s ON q.sector_id = s.id
       ORDER BY q.rqf_level, q.title`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getSchoolQualifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT q.*, s.name AS sector_name, s.code AS sector_code,
              sq.started_year, sq.id AS link_id,
              (SELECT COUNT(*) FROM modules m WHERE m.qualification_id = q.id) AS module_count
       FROM school_qualifications sq
       JOIN qualifications q ON sq.qualification_id = q.id
       LEFT JOIN rtb_sectors s ON q.sector_id = s.id
       WHERE sq.school_id = ? AND sq.is_active = 1
       ORDER BY q.rqf_level, q.title`,
      [sid(req)]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.linkQualification = async (req, res) => {
  const { qualification_id, started_year } = req.body;
  if (!qualification_id) return res.status(400).json({ error: 'qualification_id required' });
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO school_qualifications (id,school_id,qualification_id,started_year)
       VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE is_active=1, started_year=VALUES(started_year)`,
      [id, sid(req), qualification_id, started_year || null]
    );
    res.status(201).json({ message: 'Qualification linked to school' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createQualification = async (req, res) => {
  const { sector_id, curriculum_code, title, short_title, rqf_level,
          total_credits, total_hours, duration_years, entry_requirement } = req.body;
  if (!curriculum_code || !title || !rqf_level)
    return res.status(400).json({ error: 'curriculum_code, title and rqf_level required' });
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO qualifications
       (id,sector_id,curriculum_code,title,short_title,rqf_level,total_credits,total_hours,duration_years,entry_requirement)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, sector_id||null, curriculum_code, title, short_title||null,
       rqf_level, total_credits||0, total_hours||0, duration_years||3, entry_requirement||null]
    );
    const [[qual]] = await pool.query(`SELECT * FROM qualifications WHERE id=?`, [id]);
    res.status(201).json(qual);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Qualification code already exists' });
    res.status(500).json({ error: e.message });
  }
};

// ── MODULES ───────────────────────────────────────────────────

exports.getModules = async (req, res) => {
  const { qualification_id } = req.query;
  try {
    let q = `SELECT m.*,
              (SELECT COUNT(*) FROM learning_outcomes lo WHERE lo.module_id=m.id) AS lo_count
             FROM modules m WHERE m.is_active=1`;
    const params = [];
    if (qualification_id) { q += ' AND m.qualification_id=?'; params.push(qualification_id); }
    q += ' ORDER BY m.sequence_order, m.module_type, m.code';
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getModule = async (req, res) => {
  try {
    const [[m]] = await pool.query(`SELECT * FROM modules WHERE id=?`, [req.params.id]);
    if (!m) return res.status(404).json({ error: 'Module not found' });
    const [los] = await pool.query(
      `SELECT lo.*,
        (SELECT COUNT(*) FROM performance_criteria pc WHERE pc.learning_outcome_id=lo.id) AS criteria_count
       FROM learning_outcomes lo WHERE lo.module_id=? ORDER BY lo.sequence_order`,
      [m.id]
    );
    res.json({ ...m, learning_outcomes: los });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createModule = async (req, res) => {
  const { qualification_id, code, name, module_type, learning_hours, learning_periods,
          credits, theory_pct, practical_pct, passing_line_pct, sequence_order, description } = req.body;
  if (!qualification_id || !code || !name || !module_type)
    return res.status(400).json({ error: 'qualification_id, code, name, module_type required' });
  try {
    const id = uuid();
    const pass = passing_line_pct || (module_type === 'specific' ? 70 : 50);
    await pool.query(
      `INSERT INTO modules
       (id,qualification_id,code,name,module_type,learning_hours,learning_periods,
        credits,theory_pct,practical_pct,passing_line_pct,sequence_order,description)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, qualification_id, code.toUpperCase(), name, module_type,
       learning_hours||0, learning_periods||0, credits||0,
       theory_pct||30, practical_pct||70, pass, sequence_order||0, description||null]
    );
    const [[mod]] = await pool.query(`SELECT * FROM modules WHERE id=?`, [id]);
    res.status(201).json(mod);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Module code already exists for this qualification' });
    res.status(500).json({ error: e.message });
  }
};

exports.updateModule = async (req, res) => {
  const fields = ['name','module_type','learning_hours','learning_periods','credits',
                  'theory_pct','practical_pct','passing_line_pct','sequence_order','description','is_active'];
  const updates = []; const vals = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f}=?`); vals.push(req.body[f]); } });
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  vals.push(req.params.id);
  try {
    await pool.query(`UPDATE modules SET ${updates.join(',')} WHERE id=?`, vals);
    const [[mod]] = await pool.query(`SELECT * FROM modules WHERE id=?`, [req.params.id]);
    res.json(mod);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── LEARNING OUTCOMES ─────────────────────────────────────────

exports.getLearningOutcomes = async (req, res) => {
  const { module_id } = req.query;
  if (!module_id) return res.status(400).json({ error: 'module_id required' });
  try {
    const [rows] = await pool.query(
      `SELECT lo.*,
        (SELECT COUNT(*) FROM performance_criteria pc WHERE pc.learning_outcome_id=lo.id) AS criteria_count
       FROM learning_outcomes lo WHERE lo.module_id=? ORDER BY lo.sequence_order`,
      [module_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getLearningOutcome = async (req, res) => {
  try {
    const [[lo]] = await pool.query(`SELECT * FROM learning_outcomes WHERE id=?`, [req.params.id]);
    if (!lo) return res.status(404).json({ error: 'Learning outcome not found' });
    const [criteria] = await pool.query(
      `SELECT * FROM performance_criteria WHERE learning_outcome_id=? ORDER BY sequence_order`,
      [lo.id]
    );
    res.json({ ...lo, performance_criteria: criteria });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createLearningOutcome = async (req, res) => {
  const { module_id, number, title, learning_hours,
          indicative_content, resources, facilitation_techniques, formative_methods } = req.body;
  if (!module_id || !number || !title) return res.status(400).json({ error: 'module_id, number, title required' });
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO learning_outcomes
       (id,module_id,number,title,learning_hours,indicative_content,resources,
        facilitation_techniques,formative_methods,sequence_order)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, module_id, number, title, learning_hours||0,
       JSON.stringify(indicative_content||[]),
       JSON.stringify(resources||{}),
       facilitation_techniques||null, formative_methods||null, number]
    );
    const [[lo]] = await pool.query(`SELECT * FROM learning_outcomes WHERE id=?`, [id]);
    res.status(201).json(lo);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updateLearningOutcome = async (req, res) => {
  const fields = ['title','learning_hours','indicative_content','resources',
                  'facilitation_techniques','formative_methods','sequence_order'];
  const updates = []; const vals = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f}=?`);
      vals.push(['indicative_content','resources'].includes(f) ? JSON.stringify(req.body[f]) : req.body[f]);
    }
  });
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  vals.push(req.params.id);
  try {
    await pool.query(`UPDATE learning_outcomes SET ${updates.join(',')} WHERE id=?`, vals);
    const [[lo]] = await pool.query(`SELECT * FROM learning_outcomes WHERE id=?`, [req.params.id]);
    res.json(lo);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── PERFORMANCE CRITERIA ──────────────────────────────────────

exports.getCriteria = async (req, res) => {
  const { learning_outcome_id } = req.query;
  if (!learning_outcome_id) return res.status(400).json({ error: 'learning_outcome_id required' });
  try {
    const [rows] = await pool.query(
      `SELECT * FROM performance_criteria WHERE learning_outcome_id=? ORDER BY sequence_order`,
      [learning_outcome_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createCriteria = async (req, res) => {
  const { learning_outcome_id, element_of_competency, criteria_text, indicators, sequence_order } = req.body;
  if (!learning_outcome_id || !criteria_text) return res.status(400).json({ error: 'learning_outcome_id and criteria_text required' });
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO performance_criteria (id,learning_outcome_id,element_of_competency,criteria_text,indicators,sequence_order)
       VALUES (?,?,?,?,?,?)`,
      [id, learning_outcome_id, element_of_competency||null, criteria_text,
       JSON.stringify(indicators||[]), sequence_order||0]
    );
    const [[c]] = await pool.query(`SELECT * FROM performance_criteria WHERE id=?`, [id]);
    res.status(201).json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.deleteCriteria = async (req, res) => {
  try {
    await pool.query(`DELETE FROM performance_criteria WHERE id=?`, [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── SECTORS ───────────────────────────────────────────────────

exports.getSectors = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM rtb_sectors ORDER BY name`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── INTEGRATED ASSESSMENTS ────────────────────────────────────

exports.getIntegratedAssessments = async (req, res) => {
  const { module_id } = req.query;
  try {
    let q = `SELECT ia.*, m.code AS module_code, m.name AS module_name,
              u.full_name AS created_by_name
             FROM integrated_assessments ia
             JOIN modules m ON ia.module_id=m.id
             LEFT JOIN users u ON ia.created_by=u.id
             WHERE ia.school_id=?`;
    const params = [sid(req)];
    if (module_id) { q += ' AND ia.module_id=?'; params.push(module_id); }
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getIntegratedAssessment = async (req, res) => {
  try {
    const [[ia]] = await pool.query(
      `SELECT ia.*, m.code AS module_code, m.name AS module_name
       FROM integrated_assessments ia
       JOIN modules m ON ia.module_id=m.id
       WHERE ia.id=? AND ia.school_id=?`,
      [req.params.id, sid(req)]
    );
    if (!ia) return res.status(404).json({ error: 'Not found' });
    const [outcomes] = await pool.query(
      `SELECT * FROM assessment_outcomes WHERE integrated_assessment_id=? ORDER BY sequence_order`,
      [ia.id]
    );
    res.json({ ...ia, outcomes });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createIntegratedAssessment = async (req, res) => {
  const { module_id, title, situation, context, time_allowed_hrs, resources, min_assessors, outcomes } = req.body;
  if (!module_id || !title || !situation) return res.status(400).json({ error: 'module_id, title and situation required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const id = uuid();
    await conn.query(
      `INSERT INTO integrated_assessments
       (id,module_id,school_id,title,situation,context,time_allowed_hrs,resources,min_assessors,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, module_id, sid(req), title, situation, context||null,
       time_allowed_hrs||4, JSON.stringify(resources||{}), min_assessors||3, req.user.id]
    );
    if (outcomes?.length) {
      for (let i = 0; i < outcomes.length; i++) {
        const o = outcomes[i];
        await conn.query(
          `INSERT INTO assessment_outcomes (id,integrated_assessment_id,outcome_title,weight_pct,criteria_indicators,sequence_order)
           VALUES (?,?,?,?,?,?)`,
          [uuid(), id, o.outcome_title, o.weight_pct||0, JSON.stringify(o.criteria_indicators||[]), i]
        );
      }
    }
    await conn.commit();
    const [[ia]] = await conn.query(`SELECT * FROM integrated_assessments WHERE id=?`, [id]);
    res.status(201).json(ia);
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
};
