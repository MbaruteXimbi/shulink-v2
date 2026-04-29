require('dotenv').config();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log('🌱 Seeding Shulink v2...\n');

    // ── Subscription plans ─────────────────────────────────────
    const plans = [
      { id: uuid(), name: 'Intangiriro', name_rw: 'Intangiriro', price_rwf: 25000, max_trainees: 200,
        features: JSON.stringify(['discipline','pedagogy','portfolio','chronogram','excel_import']) },
      { id: uuid(), name: 'Iterambere',  name_rw: 'Iterambere',  price_rwf: 60000, max_trainees: 800,
        features: JSON.stringify(['discipline','pedagogy','portfolio','chronogram','excel_import','sms','reports']) },
      { id: uuid(), name: 'Inkomoko',   name_rw: 'Inkomoko',   price_rwf: 0,     max_trainees: 99999,
        features: JSON.stringify(['all']) },
    ];
    for (const p of plans) {
      await conn.query(
        `INSERT IGNORE INTO subscription_plans (id,name,name_rw,price_rwf,max_trainees,features)
         VALUES (?,?,?,?,?,?)`,
        [p.id, p.name, p.name_rw, p.price_rwf, p.max_trainees, p.features]
      );
    }
    console.log('✅ Plans seeded');

    // ── RTB Sectors ────────────────────────────────────────────
    const sectors = [
      { id: uuid(), name: 'ICT and Multimedia',       code: 'ICT' },
      { id: uuid(), name: 'Arts and Crafts',          code: 'ART' },
      { id: uuid(), name: 'Construction Technology',  code: 'CON' },
      { id: uuid(), name: 'Electrical Technology',    code: 'ELE' },
      { id: uuid(), name: 'Hospitality and Tourism',  code: 'HOS' },
      { id: uuid(), name: 'Agriculture',              code: 'AGR' },
      { id: uuid(), name: 'Health Sciences',          code: 'HEA' },
      { id: uuid(), name: 'Mechanical Technology',    code: 'MEC' },
    ];
    for (const s of sectors) {
      await conn.query(
        `INSERT IGNORE INTO rtb_sectors (id,name,code) VALUES (?,?,?)`,
        [s.id, s.name, s.code]
      );
    }
    const [[ictRow]] = await conn.query(`SELECT id FROM rtb_sectors WHERE code='ICT' LIMIT 1`);
    const ictId = ictRow.id;
    const [[artRow]] = await conn.query(`SELECT id FROM rtb_sectors WHERE code='ART' LIMIT 1`);
    const artId = artRow.id;
    console.log('✅ RTB sectors seeded');

    // ── Qualifications ─────────────────────────────────────────
    const swdQualId = uuid();
    const fadQualId = uuid();

    await conn.query(
      `INSERT IGNORE INTO qualifications
       (id,sector_id,curriculum_code,title,short_title,rqf_level,total_credits,total_hours,duration_years,entry_requirement)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [swdQualId, ictId, 'ICTSWD3001',
       'TVET Certificate III in Software Development', 'Cert III - Software Dev',
       3, 156, 1400, 3, 'Completed 9 Year Basic Education']
    );
    await conn.query(
      `INSERT IGNORE INTO qualifications
       (id,sector_id,curriculum_code,title,short_title,rqf_level,total_credits,total_hours,duration_years,entry_requirement)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [fadQualId, artId, 'ARTFAD5001',
       'TVET Certificate V in Fashion Design', 'Cert V - Fashion Design',
       5, 120, 1200, 3, 'Completed TVET Certificate IV']
    );
    console.log('✅ Qualifications seeded');

    // ── Modules for Software Development L3 ────────────────────
    const swdModules = [
      // Specific
      { code:'SWDWD301', name:'Develop website',              type:'specific',       hours:140, periods:210, credits:12, theory:30, practical:70, pass:70, seq:1 },
      { code:'SWDJF301', name:'Apply JavaScript',             type:'specific',       hours:120, periods:180, credits:12, theory:30, practical:70, pass:70, seq:2 },
      { code:'SWDVC301', name:'Conduct version control',      type:'specific',       hours:80,  periods:120, credits:8,  theory:15, practical:85, pass:70, seq:3 },
      { code:'SWDPR301', name:'Analyse project requirements', type:'specific',       hours:80,  periods:120, credits:8,  theory:30, practical:70, pass:70, seq:4 },
      { code:'SWDVF301', name:'Develop simple game in Vue',   type:'specific',       hours:130, periods:195, credits:15, theory:30, practical:70, pass:70, seq:5 },
      { code:'SWDUX301', name:'Design UI/UX',                 type:'specific',       hours:120, periods:180, credits:12, theory:30, practical:70, pass:70, seq:6 },
      // General
      { code:'GENGD301', name:'Apply basic graphics design',  type:'general',        hours:100, periods:150, credits:10, theory:30, practical:70, pass:70, seq:7 },
      { code:'GENAM301', name:'Apply algebra and trigonometry',type:'general',       hours:60,  periods:90,  credits:6,  theory:50, practical:50, pass:50, seq:8 },
      // Complementary
      { code:'CCMOL302', name:'Describe occupation and learning process', type:'complementary', hours:30, periods:45, credits:3, theory:30, practical:70, pass:50, seq:9  },
      { code:'CCMCW302', name:'Communicate effectively at workplace',     type:'complementary', hours:30, periods:45, credits:3, theory:30, practical:70, pass:50, seq:10 },
      { code:'CCMHE302', name:'Maintain SHE at workplace',                type:'complementary', hours:30, periods:45, credits:3, theory:30, practical:70, pass:50, seq:11 },
      { code:'CCMEN302', name:'Communicate simply using English',         type:'complementary', hours:30, periods:45, credits:3, theory:30, practical:70, pass:50, seq:12 },
      { code:'CCMCL302', name:'Apply computer literacy',                  type:'complementary', hours:30, periods:45, credits:3, theory:30, practical:70, pass:50, seq:13 },
      { code:'CCMKN302', name:'Gukoresha Ikinyarwanda kiboneye',          type:'complementary', hours:30, periods:45, credits:3, theory:30, practical:70, pass:50, seq:14 },
      { code:'CCMCZ301', name:'Comply with citizenship values',           type:'complementary', hours:30, periods:45, credits:3, theory:30, practical:70, pass:50, seq:15 },
      { code:'CCMFT302', name:'Pratiquer le français dans le métier',     type:'complementary', hours:30, periods:45, credits:3, theory:30, practical:70, pass:50, seq:16 },
      { code:'CCMBC302', name:'Create a business',                        type:'complementary', hours:30, periods:45, credits:3, theory:30, practical:70, pass:50, seq:17 },
      { code:'CCMGP302', name:'Apply general physics',                    type:'complementary', hours:50, periods:75, credits:5, theory:30, practical:70, pass:50, seq:18 },
      { code:'SWIA302',  name:'Integrate at workplace (IAP)',              type:'specific',      hours:200, periods:300, credits:30, theory:0, practical:100, pass:70, seq:19 },
    ];

    const modIdMap = {};
    for (const m of swdModules) {
      const id = uuid();
      modIdMap[m.code] = id;
      await conn.query(
        `INSERT IGNORE INTO modules
         (id,qualification_id,code,name,module_type,learning_hours,learning_periods,credits,
          theory_pct,practical_pct,passing_line_pct,sequence_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, swdQualId, m.code, m.name, m.type,
         m.hours, m.periods, m.credits, m.theory, m.practical, m.pass, m.seq]
      );
    }
    console.log('✅ SWD L3 modules seeded');

    // ── Learning outcomes for SWDVC301 (full detail from RTB doc) ─
    const vcModId = modIdMap['SWDVC301'];
    const vcLOs = [
      {
        num: 1, title: 'Setup repository', hours: 25,
        content: JSON.stringify([
          'Definition of key terms: Version control, Git, GitHub, Terminal',
          'Introduction to version control: types (local, centralized, distributed)',
          'Well-known VCS: Git, CVS, Mercurial, SVN',
          'Benefits and application of version control',
          'Git basic concepts, architecture, workflow',
          'Terminal basic commands, Git installation and configuration',
          'Git init, config, version commands',
          'Configure .gitignore file',
          'Use of GitHub: create account, remote repository, git clone, git remote',
        ]),
        resources: JSON.stringify({ equipment: ['Computer','Projector','Whiteboard'], materials: ['Internet','Electricity','Flipchart','Marker pen'], tools: ['Git','GitHub','VS Code','Terminal (CMD, Gitbash)'] }),
        facilitation: 'Demonstration, individual and group work, practical exercise, trainer guided, group discussion, brainstorming',
        formative: 'Written assessment, performance assessment',
      },
      {
        num: 2, title: 'Manipulate files', hours: 25,
        content: JSON.stringify([
          'Definition: Status, Branch, Commit',
          'Add file changes to git staging area (git status, git add, git reset, rm command)',
          'Commit file changes to git local repository (git commit, git log)',
          'Manage branches: create, list, delete, switch, rename',
        ]),
        resources: JSON.stringify({ equipment: ['Computer','Projector','Whiteboard'], materials: ['Internet','Electricity','Flipchart','Marker pen'], tools: ['Git','GitHub','VS Code','Terminal (CMD, Gitbash)'] }),
        facilitation: 'Demonstration, individual and group work, practical exercise, brainstorming, project based',
        formative: 'Written assessment, performance assessment, presentation, project based assessment',
      },
      {
        num: 3, title: 'Ship codes', hours: 30,
        content: JSON.stringify([
          'Definition: pull, fetch, push, pull request, merge',
          'Fetch file from GitHub repository (git fetch, git pull)',
          'Push files to remote branch (git push and variants)',
          'Merge branches on remote repository (git rebase, pull request, git merge)',
        ]),
        resources: JSON.stringify({ equipment: ['Computer','Projector','Whiteboard'], materials: ['Internet','Electricity','Flipchart','Marker pen'], tools: ['Git','GitHub','VS Code','Terminal (CMD, Gitbash)'] }),
        facilitation: 'Demonstration, individual and group work, practical exercise, brainstorming',
        formative: 'Written assessment, performance assessment, presentation, project based assessment',
      },
    ];
    for (const lo of vcLOs) {
      const loId = uuid();
      await conn.query(
        `INSERT IGNORE INTO learning_outcomes
         (id,module_id,number,title,learning_hours,indicative_content,resources,facilitation_techniques,formative_methods,sequence_order)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [loId, vcModId, lo.num, lo.title, lo.hours,
         lo.content, lo.resources, lo.facilitation, lo.formative, lo.num]
      );
      // Performance criteria for LO1
      if (lo.num === 1) {
        const criteria = [
          { element: 'Setup repository', text: 'Git is introduced based on version control', indicators: JSON.stringify(['Git setup is installed','Git is configured']) },
          { element: 'Setup repository', text: 'Git is properly initiated based on Git commands', indicators: JSON.stringify(['git init runs successfully']) },
          { element: 'Setup repository', text: 'Repository is properly created based on the project', indicators: JSON.stringify(['GitHub account is created','Remote repository is created']) },
          { element: 'Setup repository', text: 'Remote URL is properly set in accordance with Git commands', indicators: JSON.stringify(['Remote URL is generated','URL is configured']) },
        ];
        for (let i = 0; i < criteria.length; i++) {
          const c = criteria[i];
          await conn.query(
            `INSERT IGNORE INTO performance_criteria
             (id,learning_outcome_id,element_of_competency,criteria_text,indicators,sequence_order)
             VALUES (?,?,?,?,?,?)`,
            [uuid(), loId, c.element, c.text, c.indicators, i + 1]
          );
        }
      }
    }
    console.log('✅ SWDVC301 learning outcomes + criteria seeded');

    // ── Demo school ────────────────────────────────────────────
    const schoolId = uuid();
    await conn.query(
      `INSERT IGNORE INTO schools
       (id,name,short_name,school_type,governing_body,country,district,slug,email,phone)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [schoolId, 'St. Martin Gisenyi TSS', 'ST MARTIN', 'TSS', 'RTB',
       'Rwanda', 'Rubavu', 'st-martin-gisenyi',
       'info@stmartin.ac.rw', '+250788000001']
    );

    // Link school to SWD qualification
    await conn.query(
      `INSERT IGNORE INTO school_qualifications (id,school_id,qualification_id,started_year)
       VALUES (?,?,?,?)`,
      [uuid(), schoolId, swdQualId, '2022-2023']
    );

    // Link school to subscription
    const [[planRow]] = await conn.query(`SELECT id FROM subscription_plans WHERE name='Iterambere' LIMIT 1`);
    await conn.query(
      `INSERT IGNORE INTO school_subscriptions (id,school_id,plan_id,status,expires_at)
       VALUES (?,?,?,?,DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
      [uuid(), schoolId, planRow.id, 'active']
    );

    // Seed users
    const hash = await bcrypt.hash('Admin@2025', 10);
    const superAdminId = uuid();
    const demoSchoolId = uuid();

    // Create a platform-level "admin school"
    await conn.query(
      `INSERT IGNORE INTO schools (id,name,short_name,slug,email) VALUES (?,?,?,?,?)`,
      [demoSchoolId, 'Shulink Platform', 'PLATFORM', 'shulink-platform', 'admin@shulink.rw']
    );
    await conn.query(
      `INSERT IGNORE INTO users (id,school_id,full_name,email,password_hash,role)
       VALUES (?,?,?,?,?,?)`,
      [superAdminId, demoSchoolId, 'Platform Admin', 'admin@shulink.rw', hash, 'super_admin']
    );

    // School admin for demo school
    await conn.query(
      `INSERT IGNORE INTO users (id,school_id,full_name,email,password_hash,role)
       VALUES (?,?,?,?,?,?)`,
      [uuid(), schoolId, 'School Administrator', 'admin@stmartin.ac.rw', hash, 'school_admin']
    );

    // Seed a department and class
    const deptId = uuid();
    await conn.query(
      `INSERT IGNORE INTO departments (id,school_id,name,code) VALUES (?,?,?,?)`,
      [deptId, schoolId, 'ICT and Multimedia', 'ICT']
    );
    await conn.query(
      `INSERT IGNORE INTO classes (id,school_id,qualification_id,department_id,name,level,academic_year)
       VALUES (?,?,?,?,?,?,?)`,
      [uuid(), schoolId, swdQualId, deptId, 'S4 A - Software Dev', 'Senior 4', '2024-2025']
    );

    console.log('\n──────────────────────────────────────────');
    console.log('🎉 Shulink v2 seeded successfully!\n');
    console.log('   Super admin : admin@shulink.rw      / Admin@2025');
    console.log('   School admin: admin@stmartin.ac.rw  / Admin@2025');
    console.log('   Demo school : St. Martin Gisenyi TSS');
    console.log('   Qualification: TVET Cert III - Software Development (19 modules, 3 LOs seeded for SWDVC301)');
    console.log('──────────────────────────────────────────\n');

  } catch (e) {
    console.error('❌ Seed error:', e.message);
    throw e;
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
