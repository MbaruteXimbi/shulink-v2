const pool   = require('../db');
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');

const sid = req => req.user.school_id;

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

exports.dashboard = async (req, res) => {
  try {
    const s = sid(req);
    const [[students]]    = await pool.query(`SELECT COUNT(*) c FROM students WHERE school_id=? AND is_active=1`, [s]);
    const [[trainers]]    = await pool.query(`SELECT COUNT(*) c FROM users WHERE school_id=? AND role='trainer' AND is_active=1`, [s]);
    const [[incidents]]   = await pool.query(`SELECT COUNT(*) c FROM incidents WHERE school_id=? AND status NOT IN ('closed','resolved')`, [s]);
    const [[schemes]]     = await pool.query(`SELECT COUNT(*) c FROM schemes_of_work WHERE school_id=? AND status='submitted'`, [s]);
    const [[chronograms]] = await pool.query(`SELECT COUNT(*) c FROM chronograms WHERE school_id=? AND is_active=1`, [s]);
    const [[classes]]     = await pool.query(`SELECT COUNT(*) c FROM classes WHERE school_id=? AND is_active=1`, [s]);
    const [recentIncidents] = await pool.query(
      `SELECT i.*, st.full_name AS student_name, st.reg_number, cl.name AS class_name,
              u.full_name AS reporter_name
       FROM incidents i
       LEFT JOIN students st ON i.student_id=st.id
       LEFT JOIN classes cl ON st.class_id=cl.id
       LEFT JOIN users u ON i.reported_by=u.id
       WHERE i.school_id=? ORDER BY i.created_at DESC LIMIT 5`, [s]
    );
    const [pendingSchemes] = await pool.query(
      `SELECT sw.*, u.full_name AS trainer_name, m.code AS module_code, m.name AS module_name, c.name AS class_name
       FROM schemes_of_work sw
       LEFT JOIN users u ON sw.trainer_id=u.id
       LEFT JOIN modules m ON sw.module_id=m.id
       LEFT JOIN classes c ON sw.class_id=c.id
       WHERE sw.school_id=? AND sw.status='submitted' LIMIT 5`, [s]
    );
    const [incidentsBySeverity] = await pool.query(
      `SELECT severity, COUNT(*) AS count FROM incidents WHERE school_id=?
       AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY severity`, [s]
    );
    res.json({
      stats: {
        students: students.c, trainers: trainers.c,
        open_incidents: incidents.c, pending_schemes: schemes.c,
        chronograms: chronograms.c, classes: classes.c,
      },
      recent_incidents: recentIncidents,
      pending_schemes: pendingSchemes,
      incidents_by_severity: incidentsBySeverity,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ═══════════════════════════════════════════════════════════════
// USERS / STAFF
// ═══════════════════════════════════════════════════════════════

exports.listUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.phone, u.is_active,
              u.last_login, u.created_at, d.name AS department_name
       FROM users u LEFT JOIN departments d ON u.department_id=d.id
       WHERE u.school_id=? ORDER BY u.full_name`,
      [sid(req)]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createUser = async (req, res) => {
  const { full_name, email, password, role, department_id, phone } = req.body;
  if (!full_name || !email || !password || !role)
    return res.status(400).json({ error: 'full_name, email, password, role required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const id = uuid();
    await pool.query(
      `INSERT INTO users (id,school_id,full_name,email,password_hash,role,department_id,phone)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, sid(req), full_name, email.toLowerCase(), hash, role, department_id||null, phone||null]
    );
    const [[u]] = await pool.query(
      `SELECT id,full_name,email,role,phone,is_active,created_at FROM users WHERE id=?`, [id]
    );
    res.status(201).json(u);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists in this school' });
    res.status(500).json({ error: e.message });
  }
};

exports.updateUser = async (req, res) => {
  const fields = ['full_name','role','department_id','phone','is_active'];
  const updates = []; const vals = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f}=?`); vals.push(req.body[f]); } });
  if (req.body.password) {
    const hash = await bcrypt.hash(req.body.password, 10);
    updates.push('password_hash=?'); vals.push(hash);
  }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(req.params.id, sid(req));
  try {
    await pool.query(`UPDATE users SET ${updates.join(',')} WHERE id=? AND school_id=?`, vals);
    const [[u]] = await pool.query(`SELECT id,full_name,email,role,phone,is_active FROM users WHERE id=?`, [req.params.id]);
    res.json(u);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ═══════════════════════════════════════════════════════════════
// STUDENTS
// ═══════════════════════════════════════════════════════════════

exports.listStudents = async (req, res) => {
  const { class_id, qualification_id, search } = req.query;
  try {
    let q = `SELECT s.*, c.name AS class_name, q.short_title AS qualification_name
             FROM students s
             LEFT JOIN classes c ON s.class_id=c.id
             LEFT JOIN qualifications q ON s.qualification_id=q.id
             WHERE s.school_id=? AND s.is_active=1`;
    const params = [sid(req)];
    if (class_id)         { q += ' AND s.class_id=?';         params.push(class_id); }
    if (qualification_id) { q += ' AND s.qualification_id=?'; params.push(qualification_id); }
    if (search)           { q += ' AND s.full_name LIKE ?';    params.push(`%${search}%`); }
    q += ' ORDER BY s.full_name LIMIT 500';
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createStudent = async (req, res) => {
  const { reg_number, full_name, class_id, qualification_id, gender,
          date_of_birth, boarding, parent_name, parent_phone, parent_email } = req.body;
  if (!reg_number || !full_name) return res.status(400).json({ error: 'reg_number and full_name required' });
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO students (id,school_id,reg_number,full_name,class_id,qualification_id,gender,
        date_of_birth,boarding,parent_name,parent_phone,parent_email)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, sid(req), reg_number, full_name, class_id||null, qualification_id||null,
       gender||null, date_of_birth||null, boarding?1:0, parent_name||null, parent_phone||null, parent_email||null]
    );
    const [[st]] = await pool.query(`SELECT * FROM students WHERE id=?`, [id]);
    res.status(201).json(st);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Registration number already exists' });
    res.status(500).json({ error: e.message });
  }
};

exports.updateStudent = async (req, res) => {
  const fields = ['full_name','class_id','qualification_id','gender','date_of_birth',
                  'boarding','parent_name','parent_phone','parent_email','is_active'];
  const updates = []; const vals = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f}=?`); vals.push(req.body[f]); } });
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(req.params.id, sid(req));
  try {
    await pool.query(`UPDATE students SET ${updates.join(',')} WHERE id=? AND school_id=?`, vals);
    const [[st]] = await pool.query(`SELECT * FROM students WHERE id=?`, [req.params.id]);
    res.json(st);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ═══════════════════════════════════════════════════════════════
// CLASSES & DEPARTMENTS
// ═══════════════════════════════════════════════════════════════

exports.listClasses = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.full_name AS patron_name, q.short_title AS qualification_name,
              d.name AS department_name,
              (SELECT COUNT(*) FROM students s WHERE s.class_id=c.id AND s.is_active=1) AS student_count
       FROM classes c
       LEFT JOIN users u ON c.patron_id=u.id
       LEFT JOIN qualifications q ON c.qualification_id=q.id
       LEFT JOIN departments d ON c.department_id=d.id
       WHERE c.school_id=? AND c.is_active=1
       ORDER BY c.name`,
      [sid(req)]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createClass = async (req, res) => {
  const { name, qualification_id, department_id, level, section, patron_id, academic_year } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO classes (id,school_id,qualification_id,department_id,name,level,section,patron_id,academic_year)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, sid(req), qualification_id||null, department_id||null, name, level||null, section||null, patron_id||null, academic_year||null]
    );
    const [[cl]] = await pool.query(`SELECT * FROM classes WHERE id=?`, [id]);
    res.status(201).json(cl);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updateClass = async (req, res) => {
  const fields = ['name','qualification_id','department_id','level','section','patron_id','academic_year','is_active'];
  const updates = []; const vals = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f}=?`); vals.push(req.body[f]); } });
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(req.params.id, sid(req));
  try {
    await pool.query(`UPDATE classes SET ${updates.join(',')} WHERE id=? AND school_id=?`, vals);
    const [[cl]] = await pool.query(`SELECT * FROM classes WHERE id=?`, [req.params.id]);
    res.json(cl);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.listDepartments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, u.full_name AS hod_name,
              (SELECT COUNT(*) FROM users u2 WHERE u2.department_id=d.id AND u2.is_active=1) AS trainer_count
       FROM departments d LEFT JOIN users u ON d.hod_id=u.id
       WHERE d.school_id=? AND d.is_active=1 ORDER BY d.name`,
      [sid(req)]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createDepartment = async (req, res) => {
  const { name, code, hod_id, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO departments (id,school_id,name,code,hod_id,description) VALUES (?,?,?,?,?,?)`,
      [id, sid(req), name, code||null, hod_id||null, description||null]
    );
    const [[d]] = await pool.query(`SELECT * FROM departments WHERE id=?`, [id]);
    res.status(201).json(d);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ═══════════════════════════════════════════════════════════════
// PEDAGOGY — SCHEMES OF WORK
// ═══════════════════════════════════════════════════════════════

exports.listSchemes = async (req, res) => {
  const { status, trainer_id } = req.query;
  try {
    let q = `SELECT sw.*, u.full_name AS trainer_name, m.code AS module_code,
              m.name AS module_name, c.name AS class_name,
              (SELECT COUNT(*) FROM session_plans sp WHERE sp.scheme_id=sw.id) AS session_count
             FROM schemes_of_work sw
             LEFT JOIN users u ON sw.trainer_id=u.id
             LEFT JOIN modules m ON sw.module_id=m.id
             LEFT JOIN classes c ON sw.class_id=c.id
             WHERE sw.school_id=?`;
    const params = [sid(req)];
    if (status)     { q += ' AND sw.status=?';     params.push(status); }
    if (trainer_id) { q += ' AND sw.trainer_id=?'; params.push(trainer_id); }
    q += ' ORDER BY sw.created_at DESC';
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createScheme = async (req, res) => {
  const { module_id, class_id, term_id, chronogram_id, subject, total_weeks } = req.body;
  if (!subject) return res.status(400).json({ error: 'subject required' });
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO schemes_of_work (id,school_id,trainer_id,module_id,class_id,term_id,chronogram_id,subject,total_weeks)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, sid(req), req.user.id, module_id||null, class_id||null, term_id||null, chronogram_id||null, subject, total_weeks||12]
    );
    const [[s]] = await pool.query(`SELECT * FROM schemes_of_work WHERE id=?`, [id]);
    res.status(201).json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.submitScheme = async (req, res) => {
  try {
    await pool.query(
      `UPDATE schemes_of_work SET status='submitted' WHERE id=? AND school_id=? AND trainer_id=?`,
      [req.params.id, sid(req), req.user.id]
    );
    res.json({ message: 'Scheme submitted for review' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.reviewScheme = async (req, res) => {
  const { decision, dos_notes } = req.body;
  if (!['approved','rejected'].includes(decision))
    return res.status(400).json({ error: 'decision must be approved or rejected' });
  try {
    await pool.query(
      `UPDATE schemes_of_work SET status=?, approved_by=?, approved_at=NOW(), dos_notes=? WHERE id=? AND school_id=?`,
      [decision, req.user.id, dos_notes||null, req.params.id, sid(req)]
    );
    res.json({ message: `Scheme ${decision}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ═══════════════════════════════════════════════════════════════
// PEDAGOGY — LESSON PLANS
// ═══════════════════════════════════════════════════════════════

exports.listSessionPlans = async (req, res) => {
  const { scheme_id, trainer_id } = req.query;
  try {
    let q = `SELECT lp.*, lo.title AS lo_title, lo.number AS lo_number,
              u.full_name AS trainer_name
             FROM session_plans lp
             LEFT JOIN learning_outcomes lo ON lp.learning_outcome_id=lo.id
             LEFT JOIN users u ON lp.trainer_id=u.id
             WHERE lp.school_id=?`;
    const params = [sid(req)];
    if (scheme_id)  { q += ' AND lp.scheme_id=?';  params.push(scheme_id); }
    if (trainer_id) { q += ' AND lp.trainer_id=?'; params.push(trainer_id); }
    q += ' ORDER BY lp.week_number, lp.lesson_date';
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createSessionPlan = async (req, res) => {
  const { scheme_id, learning_outcome_id, week_number, lesson_date, topic, duration_mins,
          objectives, resources, introduction, development, conclusion, assessment_method, references_used } = req.body;
  if (!scheme_id || !week_number || !topic)
    return res.status(400).json({ error: 'scheme_id, week_number and topic required' });
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO session_plans (id,school_id,scheme_id,trainer_id,learning_outcome_id,week_number,
        lesson_date,topic,duration_mins,objectives,resources,introduction,development,conclusion,
        assessment_method,references_used)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, sid(req), scheme_id, req.user.id, learning_outcome_id||null, week_number,
       lesson_date||null, topic, duration_mins||60,
       objectives||null, resources||null, introduction||null, development||null,
       conclusion||null, assessment_method||null, references_used||null]
    );
    const [[lp]] = await pool.query(`SELECT * FROM session_plans WHERE id=?`, [id]);
    res.status(201).json(lp);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updateSessionPlan = async (req, res) => {
  const fields = ['topic','duration_mins','objectives','resources','introduction','development',
                  'conclusion','assessment_method','references_used','self_reflection','status'];
  const updates = []; const vals = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f}=?`); vals.push(req.body[f]); } });
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(req.params.id, sid(req));
  try {
    await pool.query(`UPDATE session_plans SET ${updates.join(',')} WHERE id=? AND school_id=?`, vals);
    const [[lp]] = await pool.query(`SELECT * FROM session_plans WHERE id=?`, [req.params.id]);
    res.json(lp);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ═══════════════════════════════════════════════════════════════
// PEDAGOGY — OBSERVATIONS
// ═══════════════════════════════════════════════════════════════

exports.listObservations = async (req, res) => {
  const { trainer_id } = req.query;
  try {
    let q = `SELECT o.*, obs.full_name AS observer_name, tr.full_name AS trainer_name,
              c.name AS class_name, m.code AS module_code
             FROM observations o
             LEFT JOIN users obs ON o.observer_id=obs.id
             LEFT JOIN users tr  ON o.trainer_id=tr.id
             LEFT JOIN classes c ON o.class_id=c.id
             LEFT JOIN modules m ON o.module_id=m.id
             WHERE o.school_id=?`;
    const params = [sid(req)];
    if (trainer_id) { q += ' AND o.trainer_id=?'; params.push(trainer_id); }
    q += ' ORDER BY o.observation_date DESC';
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createObservation = async (req, res) => {
  const { trainer_id, class_id, module_id, observation_date, subject,
          preparation, delivery, student_engagement, classroom_mgmt, assessment_used,
          strengths, areas_to_improve, recommendations } = req.body;
  if (!trainer_id || !observation_date) return res.status(400).json({ error: 'trainer_id and observation_date required' });
  const overall = Math.round(([preparation,delivery,student_engagement,classroom_mgmt,assessment_used].filter(Boolean).reduce((a,b)=>a+parseInt(b),0)) / 5);
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO observations (id,school_id,observer_id,trainer_id,class_id,module_id,observation_date,
        subject,preparation,delivery,student_engagement,classroom_mgmt,assessment_used,overall_score,
        strengths,areas_to_improve,recommendations)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, sid(req), req.user.id, trainer_id, class_id||null, module_id||null, observation_date,
       subject||null, preparation||0, delivery||0, student_engagement||0, classroom_mgmt||0,
       assessment_used||0, overall, strengths||null, areas_to_improve||null, recommendations||null]
    );
    const [[o]] = await pool.query(`SELECT * FROM observations WHERE id=?`, [id]);
    res.status(201).json(o);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ═══════════════════════════════════════════════════════════════
// DISCIPLINE — INCIDENTS
// ═══════════════════════════════════════════════════════════════

exports.listIncidents = async (req, res) => {
  const { severity, status } = req.query;
  try {
    let q = `SELECT i.*, st.full_name AS student_name, st.reg_number, cl.name AS class_name,
              u.full_name AS reporter_name, u.role AS reporter_role, it.name AS type_name
             FROM incidents i
             LEFT JOIN students st ON i.student_id=st.id
             LEFT JOIN classes cl ON st.class_id=cl.id
             LEFT JOIN users u ON i.reported_by=u.id
             LEFT JOIN incident_types it ON i.incident_type_id=it.id
             WHERE i.school_id=?`;
    const params = [sid(req)];
    if (severity) { q += ' AND i.severity=?'; params.push(severity); }
    if (status)   { q += ' AND i.status=?';   params.push(status); }
    q += ' ORDER BY i.incident_date DESC, i.created_at DESC LIMIT 500';
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getIncident = async (req, res) => {
  try {
    const [[i]] = await pool.query(
      `SELECT i.*, st.full_name AS student_name, st.reg_number, st.boarding,
              st.parent_name, st.parent_phone, cl.name AS class_name,
              u.full_name AS reporter_name, u.role AS reporter_role, it.name AS type_name
       FROM incidents i
       LEFT JOIN students st ON i.student_id=st.id
       LEFT JOIN classes cl ON st.class_id=cl.id
       LEFT JOIN users u ON i.reported_by=u.id
       LEFT JOIN incident_types it ON i.incident_type_id=it.id
       WHERE i.id=? AND i.school_id=?`,
      [req.params.id, sid(req)]
    );
    if (!i) return res.status(404).json({ error: 'Incident not found' });
    const [reviews] = await pool.query(
      `SELECT dr.*, u.full_name AS dod_name FROM dod_reviews dr
       LEFT JOIN users u ON dr.dod_id=u.id WHERE dr.incident_id=? ORDER BY dr.created_at`,
      [i.id]
    );
    const [sanctions] = await pool.query(
      `SELECT s.*, u.full_name AS issued_by_name FROM sanctions s
       LEFT JOIN users u ON s.issued_by=u.id WHERE s.incident_id=? ORDER BY s.created_at`,
      [i.id]
    );
    res.json({ ...i, dod_reviews: reviews, sanctions });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createIncident = async (req, res) => {
  const { student_id, incident_type_id, title, description, location,
          incident_date, incident_time, severity, witnesses } = req.body;
  if (!student_id || !title || !description || !incident_date || !severity)
    return res.status(400).json({ error: 'student_id, title, description, incident_date and severity required' });
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO incidents (id,school_id,student_id,reported_by,incident_type_id,title,
        description,location,incident_date,incident_time,severity,witnesses)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, sid(req), student_id, req.user.id, incident_type_id||null, title, description,
       location||null, incident_date, incident_time||null, severity, witnesses||null]
    );
    const [[inc]] = await pool.query(`SELECT * FROM incidents WHERE id=?`, [id]);
    res.status(201).json(inc);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.reviewIncident = async (req, res) => {
  const { decision, notes, action_taken } = req.body;
  if (!decision) return res.status(400).json({ error: 'decision required' });
  try {
    await pool.query(
      `INSERT INTO dod_reviews (id,school_id,incident_id,dod_id,decision,notes,action_taken)
       VALUES (?,?,?,?,?,?,?)`,
      [uuid(), sid(req), req.params.id, req.user.id, decision, notes||null, action_taken||null]
    );
    const newStatus = decision === 'approve' ? 'reviewed' : decision === 'reject' ? 'closed' : 'pending';
    await pool.query(`UPDATE incidents SET status=? WHERE id=? AND school_id=?`, [newStatus, req.params.id, sid(req)]);
    res.json({ message: 'Review submitted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.deleteIncident = async (req, res) => {
  try {
    await pool.query(`DELETE FROM incidents WHERE id=? AND school_id=?`, [req.params.id, sid(req)]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ═══════════════════════════════════════════════════════════════
// DISCIPLINE — SANCTIONS
// ═══════════════════════════════════════════════════════════════

exports.listSanctions = async (req, res) => {
  const { status, student_id } = req.query;
  try {
    let q = `SELECT san.*, st.full_name AS student_name, st.reg_number, cl.name AS class_name,
              i.title AS incident_title, i.severity,
              u.full_name AS issued_by_name, a.full_name AS approved_by_name
             FROM sanctions san
             LEFT JOIN students st ON san.student_id=st.id
             LEFT JOIN classes cl ON st.class_id=cl.id
             LEFT JOIN incidents i ON san.incident_id=i.id
             LEFT JOIN users u ON san.issued_by=u.id
             LEFT JOIN users a ON san.approved_by=a.id
             WHERE san.school_id=?`;
    const params = [sid(req)];
    if (status)     { q += ' AND san.status=?';     params.push(status); }
    if (student_id) { q += ' AND san.student_id=?'; params.push(student_id); }
    q += ' ORDER BY san.created_at DESC';
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createSanction = async (req, res) => {
  const { incident_id, student_id, sanction_type, description, duration_days, start_date, end_date, notes } = req.body;
  if (!student_id || !sanction_type) return res.status(400).json({ error: 'student_id and sanction_type required' });
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO sanctions (id,school_id,incident_id,student_id,sanction_type,description,
        duration_days,start_date,end_date,issued_by,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, sid(req), incident_id||null, student_id, sanction_type, description||null,
       duration_days||null, start_date||null, end_date||null, req.user.id, notes||null]
    );
    if (incident_id) {
      await pool.query(`UPDATE incidents SET status='sanctioned' WHERE id=? AND school_id=?`, [incident_id, sid(req)]);
    }
    const [[s]] = await pool.query(`SELECT * FROM sanctions WHERE id=?`, [id]);
    res.status(201).json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updateSanctionStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['pending','approved','active','completed','cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
  try {
    const updates = status === 'approved'
      ? `status='approved', approved_by='${req.user.id}'`
      : `status='${status}'`;
    await pool.query(`UPDATE sanctions SET ${updates} WHERE id=? AND school_id=?`, [req.params.id, sid(req)]);
    const [[s]] = await pool.query(`SELECT * FROM sanctions WHERE id=?`, [req.params.id]);
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ═══════════════════════════════════════════════════════════════
// DISCIPLINE — PATRON REPORTS
// ═══════════════════════════════════════════════════════════════

exports.listPatronReports = async (req, res) => {
  const { status } = req.query;
  try {
    let q = `SELECT pr.*, u.full_name AS patron_name, c.name AS class_name, rv.full_name AS reviewer_name
             FROM patron_reports pr
             LEFT JOIN users u ON pr.patron_id=u.id
             LEFT JOIN classes c ON pr.class_id=c.id
             LEFT JOIN users rv ON pr.reviewed_by=rv.id
             WHERE pr.school_id=?`;
    const params = [sid(req)];
    if (req.user.role === 'patron') { q += ' AND pr.patron_id=?'; params.push(req.user.id); }
    if (status) { q += ' AND pr.status=?'; params.push(status); }
    q += ' ORDER BY pr.created_at DESC';
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createPatronReport = async (req, res) => {
  const { class_id, term_id, report_period, summary, incidents_count, recommendations } = req.body;
  if (!summary) return res.status(400).json({ error: 'summary required' });
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO patron_reports (id,school_id,patron_id,class_id,term_id,report_period,summary,incidents_count,recommendations)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, sid(req), req.user.id, class_id||null, term_id||null,
       report_period||null, summary, incidents_count||0, recommendations||null]
    );
    const [[r]] = await pool.query(`SELECT * FROM patron_reports WHERE id=?`, [id]);
    res.status(201).json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.submitPatronReport = async (req, res) => {
  try {
    await pool.query(
      `UPDATE patron_reports SET status='submitted' WHERE id=? AND patron_id=? AND school_id=?`,
      [req.params.id, req.user.id, sid(req)]
    );
    res.json({ message: 'Report submitted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.reviewPatronReport = async (req, res) => {
  const { dod_notes } = req.body;
  try {
    await pool.query(
      `UPDATE patron_reports SET status='reviewed', reviewed_by=?, reviewed_at=NOW(), dod_notes=? WHERE id=? AND school_id=?`,
      [req.user.id, dod_notes||null, req.params.id, sid(req)]
    );
    res.json({ message: 'Report reviewed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ═══════════════════════════════════════════════════════════════
// PORTFOLIO — TRAINEE COMPETENCIES
// ═══════════════════════════════════════════════════════════════

exports.getTraineePortfolio = async (req, res) => {
  const { student_id } = req.params;
  try {
    const [[student]] = await pool.query(
      `SELECT s.*, c.name AS class_name, q.title AS qualification_title
       FROM students s LEFT JOIN classes c ON s.class_id=c.id
       LEFT JOIN qualifications q ON s.qualification_id=q.id
       WHERE s.id=? AND s.school_id=?`,
      [student_id, sid(req)]
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const [competencies] = await pool.query(
      `SELECT tc.*, m.code AS module_code, m.name AS module_name, m.module_type,
              m.passing_line_pct, lo.title AS lo_title, lo.number AS lo_number,
              u.full_name AS trainer_name
       FROM trainee_competencies tc
       JOIN modules m ON tc.module_id=m.id
       LEFT JOIN learning_outcomes lo ON tc.learning_outcome_id=lo.id
       LEFT JOIN users u ON tc.trainer_id=u.id
       WHERE tc.student_id=? AND tc.school_id=?
       ORDER BY m.sequence_order, lo.number`,
      [student_id, sid(req)]
    );
    // Evidence per competency
    for (const comp of competencies) {
      const [evidence] = await pool.query(
        `SELECT * FROM competency_evidence WHERE competency_id=? ORDER BY created_at DESC`,
        [comp.id]
      );
      comp.evidence = evidence;
    }
    res.json({ student, competencies });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.signOffCompetency = async (req, res) => {
  const { student_id, module_id, learning_outcome_id, status, formative_score, summative_score, trainer_notes } = req.body;
  if (!student_id || !module_id || !status) return res.status(400).json({ error: 'student_id, module_id, status required' });
  try {
    const finalScore = formative_score && summative_score
      ? ((parseFloat(formative_score) * 0.5) + (parseFloat(summative_score) * 0.5)).toFixed(2)
      : formative_score || summative_score || null;
    await pool.query(
      `INSERT INTO trainee_competencies (id,school_id,student_id,module_id,learning_outcome_id,trainer_id,
        status,formative_score,summative_score,final_score,signed_off_by,signed_off_at,trainer_notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),?)
       ON DUPLICATE KEY UPDATE status=VALUES(status),formative_score=VALUES(formative_score),
         summative_score=VALUES(summative_score),final_score=VALUES(final_score),
         signed_off_by=VALUES(signed_off_by),signed_off_at=NOW(),trainer_notes=VALUES(trainer_notes)`,
      [uuid(), sid(req), student_id, module_id, learning_outcome_id||null, req.user.id,
       status, formative_score||null, summative_score||null, finalScore, req.user.id, trainer_notes||null]
    );
    res.json({ message: 'Competency recorded' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.addEvidence = async (req, res) => {
  const { competency_id, title, description, evidence_type } = req.body;
  if (!competency_id || !title) return res.status(400).json({ error: 'competency_id and title required' });
  const [[comp]] = await pool.query(`SELECT student_id FROM trainee_competencies WHERE id=?`, [competency_id]);
  if (!comp) return res.status(404).json({ error: 'Competency not found' });
  try {
    const id = uuid();
    const fileUrl = req.file ? `/uploads/${sid(req)}/${req.file.filename}` : null;
    await pool.query(
      `INSERT INTO competency_evidence (id,school_id,competency_id,student_id,title,description,evidence_type,file_url,file_size)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, sid(req), competency_id, comp.student_id, title, description||null,
       evidence_type||'document', fileUrl, req.file?.size||0]
    );
    const [[ev]] = await pool.query(`SELECT * FROM competency_evidence WHERE id=?`, [id]);
    res.status(201).json(ev);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

exports.listNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE school_id=? AND user_id=? ORDER BY created_at DESC LIMIT 50`,
      [sid(req), req.user.id]
    );
    const unread = rows.filter(r => !r.is_read).length;
    res.json({ notifications: rows, unread });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read=1 WHERE school_id=? AND user_id=?`,
      [sid(req), req.user.id]
    );
    res.json({ message: 'All marked as read' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updateDepartment = async (req, res) => {
  const fields = ['name','code','hod_id','description','is_active'];
  const updates = []; const vals = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f}=?`); vals.push(req.body[f]); } });
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(req.params.id, req.user.school_id);
  try {
    await pool.query(`UPDATE departments SET ${updates.join(',')} WHERE id=? AND school_id=?`, vals);
    const [[d]] = await pool.query(`SELECT * FROM departments WHERE id=?`, [req.params.id]);
    res.json(d);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
