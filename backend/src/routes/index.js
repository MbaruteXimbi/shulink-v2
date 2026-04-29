const express = require('express');
const r = express.Router();
const { auth, roles, checkSubscription } = require('../middleware/auth');
const { excelUpload, docUpload } = require('../middleware/upload');
const auth_c = require('../controllers/authController');
const curr_c = require('../controllers/curriculumController');
const chron_c = require('../controllers/chronogramController');
const imp_c  = require('../controllers/importController');
const main_c = require('../controllers/mainController');

// ── AUTH (public) ─────────────────────────────────────────────
r.post('/auth/lookup', auth_c.lookup);
r.post('/auth/login',  auth_c.login);
r.get ('/auth/me',     auth, auth_c.me);
r.post('/auth/change-password', auth, auth_c.changePassword);

// All routes below require auth
r.use(auth, checkSubscription);

// ── DASHBOARD ─────────────────────────────────────────────────
r.get('/dashboard', main_c.dashboard);

// ── USERS / STAFF ─────────────────────────────────────────────
r.get('/users',      main_c.listUsers);
r.post('/users',     roles('school_admin','headmaster','super_admin'), main_c.createUser);
r.patch('/users/:id',roles('school_admin','headmaster','super_admin'), main_c.updateUser);

// ── STUDENTS ──────────────────────────────────────────────────
r.get ('/students',      main_c.listStudents);
r.post('/students',      roles('school_admin','headmaster','dod','dos','patron'), main_c.createStudent);
r.patch('/students/:id', roles('school_admin','headmaster','dod','dos','patron'), main_c.updateStudent);

// ── CLASSES ───────────────────────────────────────────────────
r.get ('/classes',      main_c.listClasses);
r.post('/classes',      roles('school_admin','headmaster','dod','dos'), main_c.createClass);
r.patch('/classes/:id', roles('school_admin','headmaster','dod','dos'), main_c.updateClass);

// ── DEPARTMENTS ───────────────────────────────────────────────
r.get ('/departments',      main_c.listDepartments);
r.post('/departments',      roles('school_admin','headmaster'), main_c.createDepartment);
r.patch('/departments/:id',  roles('school_admin','headmaster'), main_c.updateDepartment);

// ── CURRICULUM — SECTORS ──────────────────────────────────────
r.get('/sectors', curr_c.getSectors);

// ── CURRICULUM — QUALIFICATIONS ───────────────────────────────
r.get ('/qualifications',                  curr_c.listQualifications);
r.post('/qualifications',                  roles('super_admin'), curr_c.createQualification);
r.get ('/school/qualifications',           curr_c.getSchoolQualifications);
r.post('/school/qualifications/link',      roles('school_admin','headmaster','super_admin'), curr_c.linkQualification);

// ── CURRICULUM — MODULES ──────────────────────────────────────
r.get ('/modules',      curr_c.getModules);
r.get ('/modules/:id',  curr_c.getModule);
r.post('/modules',      roles('school_admin','headmaster','super_admin','dos'), curr_c.createModule);
r.patch('/modules/:id', roles('school_admin','headmaster','super_admin','dos'), curr_c.updateModule);

// ── CURRICULUM — LEARNING OUTCOMES ───────────────────────────
r.get ('/learning-outcomes',      curr_c.getLearningOutcomes);
r.get ('/learning-outcomes/:id',  curr_c.getLearningOutcome);
r.post('/learning-outcomes',      roles('school_admin','headmaster','super_admin','dos','trainer'), curr_c.createLearningOutcome);
r.patch('/learning-outcomes/:id', roles('school_admin','headmaster','super_admin','dos','trainer'), curr_c.updateLearningOutcome);

// ── CURRICULUM — PERFORMANCE CRITERIA ────────────────────────
r.get ('/performance-criteria',      curr_c.getCriteria);
r.post('/performance-criteria',      roles('school_admin','headmaster','super_admin','dos','trainer'), curr_c.createCriteria);
r.delete('/performance-criteria/:id',roles('school_admin','headmaster','super_admin'), curr_c.deleteCriteria);

// ── CURRICULUM — INTEGRATED ASSESSMENTS ──────────────────────
r.get ('/integrated-assessments',      curr_c.getIntegratedAssessments);
r.get ('/integrated-assessments/:id',  curr_c.getIntegratedAssessment);
r.post('/integrated-assessments',      roles('school_admin','headmaster','dos','trainer'), curr_c.createIntegratedAssessment);

// ── CHRONOGRAM ────────────────────────────────────────────────
r.get ('/chronograms',             chron_c.list);
r.get ('/chronograms/:id',         chron_c.get);
r.post('/chronograms',             roles('school_admin','headmaster','dos'), chron_c.create);
r.delete('/chronograms/:id',       roles('school_admin','headmaster'), chron_c.deleteChronogram);
r.post('/chronograms/:id/weeks',   roles('school_admin','headmaster','dos'), chron_c.addWeek);
r.patch('/chronograms/weeks/:weekId', roles('school_admin','headmaster','dos'), chron_c.updateWeek);
r.post('/chronograms/import/excel',
  roles('school_admin','headmaster','dos'),
  excelUpload.single('file'),
  chron_c.importExcel
);

// ── EXCEL IMPORTS ─────────────────────────────────────────────
r.post('/import/students', roles('school_admin','headmaster','dos','dod'), excelUpload.single('file'), imp_c.importStudents);
r.post('/import/trainers', roles('school_admin','headmaster'), excelUpload.single('file'), imp_c.importTrainers);
r.post('/import/modules',  roles('school_admin','headmaster','super_admin'), excelUpload.single('file'), imp_c.importModules);
r.get ('/import/logs',     imp_c.getImportLogs);

// ── PEDAGOGY — SCHEMES OF WORK ────────────────────────────────
r.get ('/schemes',             main_c.listSchemes);
r.post('/schemes',             main_c.createScheme);
r.post('/schemes/:id/submit',  main_c.submitScheme);
r.post('/schemes/:id/review',  roles('school_admin','headmaster','dos'), main_c.reviewScheme);

// ── PEDAGOGY — LESSON PLANS ───────────────────────────────────
r.get ('/session-plans',      main_c.listSessionPlans);
r.post('/session-plans',      main_c.createSessionPlan);
r.patch('/session-plans/:id', main_c.updateSessionPlan);

// ── PEDAGOGY — OBSERVATIONS ───────────────────────────────────
r.get ('/observations',      main_c.listObservations);
r.post('/observations',      roles('school_admin','headmaster','dos','hod'), main_c.createObservation);

// ── DISCIPLINE — INCIDENTS ────────────────────────────────────
r.get ('/incidents',              main_c.listIncidents);
r.get ('/incidents/:id',          main_c.getIncident);
r.post('/incidents',              main_c.createIncident);
r.post('/incidents/:id/review',   roles('dod','headmaster','school_admin'), main_c.reviewIncident);
r.delete('/incidents/:id',        roles('school_admin','headmaster','dod'), main_c.deleteIncident);

// ── DISCIPLINE — SANCTIONS ────────────────────────────────────
r.get ('/sanctions',                  main_c.listSanctions);
r.post('/sanctions',                  roles('dod','headmaster','school_admin'), main_c.createSanction);
r.patch('/sanctions/:id/status',      roles('dod','headmaster','school_admin'), main_c.updateSanctionStatus);

// ── DISCIPLINE — PATRON REPORTS ───────────────────────────────
r.get ('/patron-reports',              main_c.listPatronReports);
r.post('/patron-reports',              roles('patron','dos','dod','school_admin'), main_c.createPatronReport);
r.post('/patron-reports/:id/submit',   roles('patron'), main_c.submitPatronReport);
r.post('/patron-reports/:id/review',   roles('dod','headmaster','school_admin'), main_c.reviewPatronReport);

// ── PORTFOLIO ─────────────────────────────────────────────────
r.get ('/portfolio/:student_id',  main_c.getTraineePortfolio);
r.post('/portfolio/sign-off',     main_c.signOffCompetency);
r.post('/portfolio/evidence',     docUpload.single('file'), main_c.addEvidence);

// ── NOTIFICATIONS ─────────────────────────────────────────────
r.get ('/notifications',      main_c.listNotifications);
r.post('/notifications/read', main_c.markNotificationsRead);

// ── TEMPLATES DOWNLOAD ────────────────────────────────────────
const path = require('path');
const fs   = require('fs');
r.get('/templates/:name', (req, res) => {
  const allowed = ['chronogram','students','modules','trainers'];
  const name = req.params.name.replace(/[^a-z_]/g, '');
  if (!allowed.includes(name)) return res.status(404).json({ error: 'Template not found' });
  const file = path.join(__dirname, '../../templates', `shulink_${name}_template.xlsx`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Template not generated yet. Run: npm run templates' });
  res.download(file, `shulink_${name}_template.xlsx`);
});

module.exports = r;
