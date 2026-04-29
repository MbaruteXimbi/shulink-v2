const pool    = require('../db');
const { v4: uuid } = require('uuid');
const ExcelJS = require('exceljs');
const bcrypt  = require('bcryptjs');
const path    = require('path');

const sid = req => req.user.school_id;

function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  const s = String(val).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

function cellStr(row, col) {
  return String(row.getCell(col).value ?? '').trim();
}

// ── STUDENTS IMPORT ───────────────────────────────────────────

exports.importStudents = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const conn = await pool.getConnection();
  const errors = []; let success = 0; let total = 0;

  try {
    await conn.beginTransaction();

    // Build class name → id map for this school
    const [classes] = await conn.query(
      `SELECT id, name FROM classes WHERE school_id=?`, [sid(req)]
    );
    const classMap = {};
    classes.forEach(c => { classMap[c.name.toLowerCase().trim()] = c.id; });

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(req.file.path);
    const ws = wb.getWorksheet('Students') || wb.worksheets[0];

    ws.eachRow((row, rowNum) => {
      if (rowNum <= 3) return; // skip header rows
      const reg  = cellStr(row, 1);
      const name = cellStr(row, 2);
      if (!reg && !name) return; // blank row
      total++;

      if (!reg)  { errors.push({ row: rowNum, error: 'Reg number missing' }); return; }
      if (!name) { errors.push({ row: rowNum, error: 'Full name missing' }); return; }

      const className = cellStr(row, 3).toLowerCase().trim();
      const classId   = classMap[className] || null;
      if (className && !classId)
        errors.push({ row: rowNum, error: `Class "${cellStr(row,3)}" not found — student added without class` });

      const gender   = cellStr(row, 4) || null;
      const dob      = parseDate(row.getCell(5).value);
      const boarding = ['yes','1','true'].includes(cellStr(row,6).toLowerCase()) ? 1 : 0;
      const pname    = cellStr(row, 7) || null;
      const pphone   = cellStr(row, 8) || null;
      const pemail   = cellStr(row, 9) || null;

      conn.query(
        `INSERT INTO students (id,school_id,reg_number,full_name,class_id,gender,date_of_birth,
          boarding,parent_name,parent_phone,parent_email)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), class_id=VALUES(class_id),
           gender=VALUES(gender), parent_phone=VALUES(parent_phone)`,
        [uuid(), sid(req), reg, name, classId, gender, dob, boarding, pname, pphone, pemail]
      );
      success++;
    });

    await conn.commit();

    await pool.query(
      `INSERT INTO import_logs (id,school_id,import_type,file_name,total_rows,success_rows,error_rows,errors,imported_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [uuid(), sid(req), 'students', req.file.originalname,
       total, success, errors.filter(e=>e.error&&!e.error.includes('not found')).length,
       JSON.stringify(errors), req.user.id]
    );

    res.json({
      message: `Import complete: ${success} of ${total} students processed.`,
      success, total, errors: errors.slice(0, 50),
    });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
};

// ── TRAINERS IMPORT ───────────────────────────────────────────

exports.importTrainers = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const conn = await pool.getConnection();
  const errors = []; let success = 0; let total = 0;
  const defaultPassword = 'Shulink@2025';

  try {
    await conn.beginTransaction();

    const [depts] = await conn.query(
      `SELECT id, name FROM departments WHERE school_id=?`, [sid(req)]
    );
    const deptMap = {};
    depts.forEach(d => { deptMap[d.name.toLowerCase().trim()] = d.id; });

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(req.file.path);
    const ws = wb.getWorksheet('Trainers') || wb.worksheets[0];

    const validRoles = ['headmaster','dos','dod','hod','patron','metron','trainer','school_admin'];

    const rows = [];
    ws.eachRow((row, rowNum) => {
      if (rowNum <= 3) return;
      const name  = cellStr(row, 1);
      const email = cellStr(row, 2).toLowerCase();
      if (!name && !email) return;
      total++;

      if (!name)  { errors.push({ row: rowNum, error: 'Name missing' }); return; }
      if (!email) { errors.push({ row: rowNum, error: 'Email missing' }); return; }

      const role  = cellStr(row, 3).toLowerCase().trim() || 'trainer';
      if (!validRoles.includes(role)) {
        errors.push({ row: rowNum, error: `Invalid role "${role}"` }); return;
      }
      const phone    = cellStr(row, 4) || null;
      const deptName = cellStr(row, 5).toLowerCase().trim();
      const deptId   = deptMap[deptName] || null;
      const natId    = cellStr(row, 6) || null;
      const pwd      = cellStr(row, 7) || defaultPassword;
      rows.push({ name, email, role, phone, deptId, natId, pwd });
    });

    for (const r of rows) {
      const hash = await bcrypt.hash(r.pwd, 10);
      await conn.query(
        `INSERT INTO users (id,school_id,full_name,email,password_hash,role,department_id,phone,national_id)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), role=VALUES(role),
           department_id=VALUES(department_id), phone=VALUES(phone)`,
        [uuid(), sid(req), r.name, r.email, hash, r.role, r.deptId, r.phone, r.natId]
      );
      success++;
    }

    await conn.commit();

    await pool.query(
      `INSERT INTO import_logs (id,school_id,import_type,file_name,total_rows,success_rows,error_rows,errors,imported_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [uuid(), sid(req), 'trainers', req.file.originalname,
       total, success, errors.length, JSON.stringify(errors), req.user.id]
    );

    res.json({
      message: `Import complete: ${success} of ${total} staff processed.`,
      success, total,
      default_password: defaultPassword,
      errors: errors.slice(0, 50),
    });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
};

// ── MODULES IMPORT ────────────────────────────────────────────

exports.importModules = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { qualification_id } = req.body;
  if (!qualification_id) return res.status(400).json({ error: 'qualification_id required' });

  const conn = await pool.getConnection();
  const errors = []; let success = 0; let total = 0;

  try {
    await conn.beginTransaction();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(req.file.path);
    const ws = wb.getWorksheet('Modules') || wb.worksheets[0];
    const validTypes = ['specific','general','complementary'];

    ws.eachRow((row, rowNum) => {
      if (rowNum <= 3) return;
      const code = cellStr(row, 1).toUpperCase();
      const name = cellStr(row, 2);
      if (!code && !name) return;
      total++;

      if (!code) { errors.push({ row: rowNum, error: 'Module code missing' }); return; }
      if (!name) { errors.push({ row: rowNum, error: 'Module name missing' }); return; }
      const type = cellStr(row, 3).toLowerCase().trim();
      if (!validTypes.includes(type)) { errors.push({ row: rowNum, error: `Invalid type "${type}" (use specific/general/complementary)` }); return; }

      const hours  = parseInt(cellStr(row, 4)) || 0;
      const periods= parseInt(cellStr(row, 5)) || 0;
      const credits= parseInt(cellStr(row, 6)) || 0;
      const theory = parseInt(cellStr(row, 7)) || 30;
      const prac   = parseInt(cellStr(row, 8)) || 70;
      const pass   = parseInt(cellStr(row, 9)) || (type === 'specific' ? 70 : 50);
      const seq    = parseInt(cellStr(row, 10)) || 0;

      conn.query(
        `INSERT INTO modules (id,qualification_id,code,name,module_type,learning_hours,learning_periods,
          credits,theory_pct,practical_pct,passing_line_pct,sequence_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), learning_hours=VALUES(learning_hours),
           learning_periods=VALUES(learning_periods), credits=VALUES(credits),
           theory_pct=VALUES(theory_pct), practical_pct=VALUES(practical_pct)`,
        [uuid(), qualification_id, code, name, type, hours, periods, credits, theory, prac, pass, seq]
      );
      success++;
    });

    await conn.commit();

    await pool.query(
      `INSERT INTO import_logs (id,school_id,import_type,file_name,total_rows,success_rows,error_rows,errors,imported_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [uuid(), sid(req), 'modules', req.file.originalname,
       total, success, errors.length, JSON.stringify(errors), req.user.id]
    );

    res.json({ message: `Import complete: ${success} of ${total} modules processed.`, success, total, errors: errors.slice(0, 50) });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
};

// ── GET IMPORT LOGS ───────────────────────────────────────────

exports.getImportLogs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT il.*, u.full_name AS imported_by_name
       FROM import_logs il LEFT JOIN users u ON il.imported_by=u.id
       WHERE il.school_id=? ORDER BY il.created_at DESC LIMIT 50`,
      [sid(req)]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
