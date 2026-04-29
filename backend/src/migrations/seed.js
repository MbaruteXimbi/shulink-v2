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
      { id: uuid(), name: 'Intangiriro', price_rwf: 25000, max_trainees: 200, features: JSON.stringify(['discipline','pedagogy','portfolio','chronogram','excel_import']) },
      { id: uuid(), name: 'Iterambere',  price_rwf: 60000, max_trainees: 800, features: JSON.stringify(['discipline','pedagogy','portfolio','chronogram','excel_import','sms','reports']) },
      { id: uuid(), name: 'Inkomoko',   price_rwf: 0,     max_trainees: 99999, features: JSON.stringify(['all']) },
    ];
    for (const p of plans) {
      await conn.query(`INSERT IGNORE INTO subscription_plans (id,name,name_rw,price_rwf,max_trainees,features) VALUES (?,?,?,?,?,?)`, [p.id,p.name,p.name,p.price_rwf,p.max_trainees,p.features]);
    }
    console.log('✅ Plans seeded');

    // ── RTB Sectors ────────────────────────────────────────────
    const sectors = [
      { id: uuid(), name: 'ICT and Multimedia',      code: 'ICT' },
      { id: uuid(), name: 'Arts and Crafts',         code: 'ART' },
      { id: uuid(), name: 'Construction Technology', code: 'CON' },
      { id: uuid(), name: 'Electrical Technology',   code: 'ELE' },
      { id: uuid(), name: 'Hospitality and Tourism', code: 'HOS' },
      { id: uuid(), name: 'Agriculture',             code: 'AGR' },
      { id: uuid(), name: 'Health Sciences',         code: 'HEA' },
      { id: uuid(), name: 'Mechanical Technology',   code: 'MEC' },
    ];
    for (const s of sectors) {
      await conn.query(`INSERT IGNORE INTO rtb_sectors (id,name,code) VALUES (?,?,?)`, [s.id,s.name,s.code]);
    }
    const [[ictRow]] = await conn.query(`SELECT id FROM rtb_sectors WHERE code='ICT' LIMIT 1`);
    const ictId = ictRow.id;
    console.log('✅ RTB sectors seeded');

    // ── Qualifications ─────────────────────────────────────────
    const swdQualId = uuid();
    await conn.query(
      `INSERT IGNORE INTO qualifications (id,sector_id,curriculum_code,title,short_title,rqf_level,total_credits,total_hours,duration_years,entry_requirement) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [swdQualId,ictId,'ICTSWD3001','TVET Certificate III in Software Development','Cert III - Software Dev',3,156,1400,3,'Completed 9 Year Basic Education (9YBE)']
    );
    console.log('✅ Qualifications seeded');

    // ── Modules ────────────────────────────────────────────────
    const swdModules = [
      { code:'SWDWD301', name:'Develop website',               type:'specific',       hours:140, periods:210, credits:12, theory:30, practical:70, pass:70, seq:1 },
      { code:'SWDJF301', name:'Apply JavaScript',              type:'specific',       hours:120, periods:180, credits:12, theory:30, practical:70, pass:70, seq:2 },
      { code:'SWDVC301', name:'Conduct version control',       type:'specific',       hours:80,  periods:120, credits:8,  theory:15, practical:85, pass:70, seq:3 },
      { code:'SWDPR301', name:'Analyse project requirements',  type:'specific',       hours:80,  periods:120, credits:8,  theory:30, practical:70, pass:70, seq:4 },
      { code:'SWDVF301', name:'Develop simple game in Vue',    type:'specific',       hours:130, periods:195, credits:15, theory:30, practical:70, pass:70, seq:5 },
      { code:'SWDUX301', name:'Design UI/UX',                  type:'specific',       hours:120, periods:180, credits:12, theory:30, practical:70, pass:70, seq:6 },
      { code:'GENGD301', name:'Apply basic graphics design',   type:'general',        hours:100, periods:150, credits:10, theory:30, practical:70, pass:70, seq:7 },
      { code:'GENAM301', name:'Apply algebra and trigonometry',type:'general',        hours:60,  periods:90,  credits:6,  theory:50, practical:50, pass:50, seq:8 },
      { code:'CCMOL302', name:'Describe occupation and learning process',type:'complementary',hours:30,periods:45,credits:3,theory:30,practical:70,pass:50,seq:9  },
      { code:'CCMCW302', name:'Communicate effectively at workplace',    type:'complementary',hours:30,periods:45,credits:3,theory:30,practical:70,pass:50,seq:10 },
      { code:'CCMHE302', name:'Maintain SHE at workplace',               type:'complementary',hours:30,periods:45,credits:3,theory:30,practical:70,pass:50,seq:11 },
      { code:'CCMEN302', name:'Communicate simply using English',        type:'complementary',hours:30,periods:45,credits:3,theory:30,practical:70,pass:50,seq:12 },
      { code:'CCMCL302', name:'Apply computer literacy',                 type:'complementary',hours:30,periods:45,credits:3,theory:30,practical:70,pass:50,seq:13 },
      { code:'CCMKN302', name:'Gukoresha Ikinyarwanda kiboneye',         type:'complementary',hours:30,periods:45,credits:3,theory:30,practical:70,pass:50,seq:14 },
      { code:'CCMCZ301', name:'Comply with citizenship values',          type:'complementary',hours:30,periods:45,credits:3,theory:30,practical:70,pass:50,seq:15 },
      { code:'CCMFT302', name:'Pratiquer le français dans le métier',    type:'complementary',hours:30,periods:45,credits:3,theory:30,practical:70,pass:50,seq:16 },
      { code:'CCMBC302', name:'Create a business',                       type:'complementary',hours:30,periods:45,credits:3,theory:30,practical:70,pass:50,seq:17 },
      { code:'CCMGP302', name:'Apply general physics',                   type:'complementary',hours:50,periods:75,credits:5,theory:30,practical:70,pass:50,seq:18 },
      { code:'SWIA302',  name:'Integrate at workplace (IAP)',             type:'specific',     hours:200,periods:300,credits:30,theory:0,practical:100,pass:70,seq:19 },
    ];
    const modIdMap = {};
    for (const m of swdModules) {
      const id = uuid(); modIdMap[m.code] = id;
      await conn.query(
        `INSERT IGNORE INTO modules (id,qualification_id,code,name,module_type,learning_hours,learning_periods,credits,theory_pct,practical_pct,passing_line_pct,sequence_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id,swdQualId,m.code,m.name,m.type,m.hours,m.periods,m.credits,m.theory,m.practical,m.pass,m.seq]
      );
    }
    console.log('✅ SWD L3 modules seeded');

    // ── Learning outcomes for SWDVC301 ─────────────────────────
    const vcModId = modIdMap['SWDVC301'];
    const loIdMap = {};
    const vcLOs = [
      { num:1, title:'Setup repository', hours:25,
        content: JSON.stringify(['Definition: Version control, Git, GitHub, Terminal','Types of VCS: local, centralized, distributed','Well-known VCS: Git, CVS, Mercurial, SVN','Benefits and application of version control','Git basic concepts, architecture, workflow','Terminal commands, Git installation and configuration','Git init, config, version','Configure .gitignore file','GitHub: create account, remote repository, git clone, git remote']),
        resources: JSON.stringify({ equipment:['Computer','Projector','Whiteboard'], materials:['Internet','Electricity','Flipchart','Marker pen'], tools:['Git','GitHub','VS Code','Terminal (CMD, Gitbash)'] }),
        facilitation:'Demonstration, individual and group work, practical exercise, group discussion, brainstorming',
        formative:'Written assessment, performance assessment' },
      { num:2, title:'Manipulate files', hours:25,
        content: JSON.stringify(['Definition: Status, Branch, Commit','git status, git add, git reset, rm command','git commit, git log','Manage branches: create, list, delete, switch, rename']),
        resources: JSON.stringify({ equipment:['Computer','Projector','Whiteboard'], materials:['Internet','Electricity'], tools:['Git','GitHub','VS Code','Terminal'] }),
        facilitation:'Demonstration, practical exercise, brainstorming, project based',
        formative:'Written assessment, performance assessment, project based assessment' },
      { num:3, title:'Ship codes', hours:30,
        content: JSON.stringify(['Definition: pull, fetch, push, pull request, merge','git fetch, git pull','git push and variants','git rebase, pull request, git merge']),
        resources: JSON.stringify({ equipment:['Computer','Projector','Whiteboard'], materials:['Internet','Electricity'], tools:['Git','GitHub','VS Code','Terminal'] }),
        facilitation:'Demonstration, individual and group work, practical exercise',
        formative:'Written assessment, performance assessment, project based assessment' },
    ];
    for (const lo of vcLOs) {
      const loId = uuid(); loIdMap[lo.num] = loId;
      await conn.query(
        `INSERT IGNORE INTO learning_outcomes (id,module_id,number,title,learning_hours,indicative_content,resources,facilitation_techniques,formative_methods,sequence_order) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [loId,vcModId,lo.num,lo.title,lo.hours,lo.content,lo.resources,lo.facilitation,lo.formative,lo.num]
      );
    }
    console.log('✅ SWDVC301 learning outcomes seeded');

    // ── Demo school ────────────────────────────────────────────
    const schoolId = uuid();
    await conn.query(
      `INSERT IGNORE INTO schools (id,name,short_name,school_type,governing_body,country,district,slug,email,phone) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [schoolId,'St. Martin Gisenyi TSS','ST MARTIN','TSS','RTB','Rwanda','Rubavu','st-martin-gisenyi','info@stmartin.ac.rw','+250788000001']
    );
    await conn.query(`INSERT IGNORE INTO school_qualifications (id,school_id,qualification_id,started_year) VALUES (?,?,?,?)`, [uuid(),schoolId,swdQualId,'2022-2023']);
    const [[planRow]] = await conn.query(`SELECT id FROM subscription_plans WHERE name='Iterambere' LIMIT 1`);
    await conn.query(`INSERT IGNORE INTO school_subscriptions (id,school_id,plan_id,status,expires_at) VALUES (?,?,?,?,DATE_ADD(NOW(), INTERVAL 1 YEAR))`, [uuid(),schoolId,planRow.id,'active']);

    const platformSchoolId = uuid();
    await conn.query(`INSERT IGNORE INTO schools (id,name,short_name,slug,email) VALUES (?,?,?,?,?)`, [platformSchoolId,'Shulink Platform','PLATFORM','shulink-platform','admin@shulink.rw']);

    // ── Users ─────────────────────────────────────────────────
    const hash = await bcrypt.hash('Admin@2025', 10);
    const trHash = await bcrypt.hash('Trainer@2025', 10);

    const superAdminId = uuid();
    await conn.query(`INSERT IGNORE INTO users (id,school_id,full_name,email,password_hash,role) VALUES (?,?,?,?,?,?)`, [superAdminId,platformSchoolId,'Platform Admin','admin@shulink.rw',hash,'super_admin']);
    const schoolAdminId = uuid();
    await conn.query(`INSERT IGNORE INTO users (id,school_id,full_name,email,password_hash,role) VALUES (?,?,?,?,?,?)`, [schoolAdminId,schoolId,'School Administrator','admin@stmartin.ac.rw',hash,'school_admin']);
    const headmasterId = uuid();
    await conn.query(`INSERT IGNORE INTO users (id,school_id,full_name,email,password_hash,role) VALUES (?,?,?,?,?,?)`, [headmasterId,schoolId,'Dr. Emmanuel Habimana','headmaster@stmartin.ac.rw',hash,'headmaster']);
    const dosId = uuid();
    await conn.query(`INSERT IGNORE INTO users (id,school_id,full_name,email,password_hash,role) VALUES (?,?,?,?,?,?)`, [dosId,schoolId,'Marie Claire Uwimana','dos@stmartin.ac.rw',hash,'dos']);
    const dodId = uuid();
    await conn.query(`INSERT IGNORE INTO users (id,school_id,full_name,email,password_hash,role) VALUES (?,?,?,?,?,?)`, [dodId,schoolId,'Jean Paul Nkurunziza','dod@stmartin.ac.rw',hash,'dod']);
    const patronId = uuid();
    await conn.query(`INSERT IGNORE INTO users (id,school_id,full_name,email,password_hash,role) VALUES (?,?,?,?,?,?)`, [patronId,schoolId,'Eric Gahima','e.gahima@stmartin.ac.rw',hash,'patron']);

    const deptId = uuid();
    await conn.query(`INSERT IGNORE INTO departments (id,school_id,name,code,description) VALUES (?,?,?,?,?)`, [deptId,schoolId,'ICT and Multimedia','ICT','Software development, graphics design, and multimedia production']);

    const hodId = uuid();
    await conn.query(`INSERT IGNORE INTO users (id,school_id,full_name,email,password_hash,role,department_id) VALUES (?,?,?,?,?,?,?)`, [hodId,schoolId,'Alexis Muhire','hod.ict@stmartin.ac.rw',hash,'hod',deptId]);
    const trainer1Id = uuid();
    await conn.query(`INSERT IGNORE INTO users (id,school_id,full_name,email,password_hash,role,department_id) VALUES (?,?,?,?,?,?,?)`, [trainer1Id,schoolId,'Jean Baptiste Nsengiyumva','jb.nsengiyumva@stmartin.ac.rw',trHash,'trainer',deptId]);
    const trainer2Id = uuid();
    await conn.query(`INSERT IGNORE INTO users (id,school_id,full_name,email,password_hash,role,department_id) VALUES (?,?,?,?,?,?,?)`, [trainer2Id,schoolId,'Claudine Mukamana','c.mukamana@stmartin.ac.rw',trHash,'trainer',deptId]);

    console.log('✅ Users seeded');

    // ── Classes ────────────────────────────────────────────────
    const class1Id = uuid();
    await conn.query(`INSERT IGNORE INTO classes (id,school_id,qualification_id,department_id,name,level,section,patron_id,academic_year) VALUES (?,?,?,?,?,?,?,?,?)`, [class1Id,schoolId,swdQualId,deptId,'S4 A — Software Dev','Senior 4','A',patronId,'2024-2025']);
    const class2Id = uuid();
    await conn.query(`INSERT IGNORE INTO classes (id,school_id,qualification_id,department_id,name,level,section,patron_id,academic_year) VALUES (?,?,?,?,?,?,?,?,?)`, [class2Id,schoolId,swdQualId,deptId,'S5 B — Software Dev','Senior 5','B',patronId,'2024-2025']);
    console.log('✅ Classes seeded');

    // ── Students ───────────────────────────────────────────────
    const students = [
      {reg:'STM2024001',name:'Mugisha Eric',        gender:'Male',   cls:class1Id,parent:'Nkusi Robert',   phone:'+250788001001'},
      {reg:'STM2024002',name:'Uwase Divine',        gender:'Female', cls:class1Id,parent:'Uwase Josephine',phone:'+250788001002'},
      {reg:'STM2024003',name:'Habimana Patrick',    gender:'Male',   cls:class1Id,parent:'Habimana Andre', phone:'+250788001003'},
      {reg:'STM2024004',name:'Mukamana Solange',    gender:'Female', cls:class1Id,parent:'Mukamana Alice', phone:'+250788001004'},
      {reg:'STM2024005',name:'Nshimiyimana Joel',   gender:'Male',   cls:class1Id,parent:'Nshimiye Pierre',phone:'+250788001005'},
      {reg:'STM2024006',name:'Umutoniwase Grace',   gender:'Female', cls:class1Id,parent:'Umutoniwase Marie',phone:'+250788001006'},
      {reg:'STM2024007',name:'Bizimana Claude',     gender:'Male',   cls:class1Id,parent:'Bizimana Jean',  phone:'+250788001007'},
      {reg:'STM2024008',name:'Uwimana Claudine',    gender:'Female', cls:class1Id,parent:'Uwimana Paul',   phone:'+250788001008'},
      {reg:'STM2025001',name:'Niyonzima Samuel',    gender:'Male',   cls:class2Id,parent:'Niyonzima Fred', phone:'+250788002001'},
      {reg:'STM2025002',name:'Mukandayisenga Rose', gender:'Female', cls:class2Id,parent:'Mukanda Pierre',  phone:'+250788002002'},
    ];
    for (const st of students) {
      await conn.query(`INSERT IGNORE INTO students (id,school_id,reg_number,full_name,class_id,qualification_id,gender,parent_name,parent_phone) VALUES (?,?,?,?,?,?,?,?,?)`, [uuid(),schoolId,st.reg,st.name,st.cls,swdQualId,st.gender,st.parent,st.phone]);
    }
    console.log('✅ Students seeded');

    // ── Incident Types ─────────────────────────────────────────
    const incidentTypes = [
      {name:'Late arrival',           severity:'minor',    desc:'Trainee arrives late to class or school'},
      {name:'Missing uniform',        severity:'minor',    desc:'Trainee not in proper school uniform'},
      {name:'Disruptive behaviour',   severity:'moderate', desc:'Disrupting class or other trainees'},
      {name:'Absenteeism',           severity:'moderate', desc:'Unauthorized absence from school or class'},
      {name:'Disrespect to staff',    severity:'serious',  desc:'Verbal disrespect or insubordination to a trainer'},
      {name:'Fighting',               severity:'serious',  desc:'Physical altercation between trainees'},
      {name:'Cheating in assessment', severity:'serious',  desc:'Academic dishonesty during tests or exams'},
      {name:'Bullying',               severity:'serious',  desc:'Repeated intimidation or harassment of a trainee'},
      {name:'Theft',                  severity:'critical', desc:'Stealing school or personal property'},
      {name:'Vandalism',              severity:'critical', desc:'Deliberate damage to school property'},
      {name:'Substance abuse',        severity:'critical', desc:'Use or possession of alcohol or drugs on school premises'},
    ];
    for (const it of incidentTypes) {
      await conn.query(`INSERT IGNORE INTO incident_types (id,school_id,name,severity,description,is_global) VALUES (?,?,?,?,?,1)`, [uuid(),schoolId,it.name,it.severity,it.desc]);
    }
    console.log('✅ Incident types seeded');

    // ── Schemes of Work ────────────────────────────────────────
    const scheme1Id = uuid();
    await conn.query(`INSERT IGNORE INTO schemes_of_work (id,school_id,trainer_id,module_id,class_id,subject,total_weeks,status,approved_by,approved_at) VALUES (?,?,?,?,?,?,?,?,?,NOW())`,
      [scheme1Id,schoolId,trainer1Id,modIdMap['SWDVC301'],class1Id,'Conduct Version Control — Term 1 2024-2025',13,'approved',dosId]);
    const scheme2Id = uuid();
    await conn.query(`INSERT IGNORE INTO schemes_of_work (id,school_id,trainer_id,module_id,class_id,subject,total_weeks,status) VALUES (?,?,?,?,?,?,?,?)`,
      [scheme2Id,schoolId,trainer2Id,modIdMap['SWDWD301'],class1Id,'Develop Website — Term 1 2024-2025',13,'submitted']);
    console.log('✅ Schemes of work seeded');

    // ── Session Plans ──────────────────────────────────────────
    const sessionPlans = [
      { scheme_id:scheme1Id, trainer_id:trainer1Id, lo_id:loIdMap[1], week:1, date:'2024-09-09',
        topic:'Introduction to Version Control and Git', duration:90,
        objectives:'1. Define version control and explain its importance in software development\n2. Identify at least 3 types of version control systems\n3. Install and configure Git on their computer',
        resources:'Computer, projector, internet connection, Git installer',
        introduction:'Trainer: Ask trainees — "Have you ever lost important work? How did it feel?"\nTrainees: Share experiences (3 min)\nTrainer: Connect to the need for version control — the problem it solves',
        development:'Trainer: Present the 3 types of VCS (local, centralized, distributed) with diagrams\nTrainees: Note key differences (5 min)\nTrainer: Demonstrate Git installation step by step on projector\nTrainees: Follow along — install Git on their computers (15 min)\nTrainer: Show git config --global commands\nTrainees: Configure their name and email\nTrainees: Individual exercise — verify installation with git --version',
        conclusion:'Trainer: Ask 3 trainees to explain what version control is and why we use it\nTrainer: Summarise: VCS types, Git as distributed VCS, basic configuration\nFormative: Quick quiz — 3 questions on types of VCS\nNext session: We will create our first repository',
        assessment:'Quick quiz — 3 multiple choice questions on VCS types. Observation of successful Git installation.',
        references:'Chacon, S. & Straub, B. (2014). Pro Git (2nd ed.). Apress. https://git-scm.com/book\nRTB (2022). SWDVC301 Module Document. Rwanda TVET Board.',
        trainee_notes:'Before next session:\n1. Make sure Git is installed and configured on your laptop\n2. Create a free GitHub account at github.com\n3. Watch: "Git in 100 Seconds" on YouTube',
        status:'reviewed' },
      { scheme_id:scheme1Id, trainer_id:trainer1Id, lo_id:loIdMap[1], week:2, date:'2024-09-16',
        topic:'Creating and Managing Local Repositories', duration:90,
        objectives:'1. Create a local Git repository using git init\n2. Stage and commit files using git add and git commit\n3. View commit history using git log',
        resources:'Computer, internet, VS Code, terminal/command prompt',
        introduction:'Trainer: Review last session — ask trainees to recall the git config commands\nTrainees: Demonstrate their GitHub accounts (2 min each, 3 volunteers)\nTrainer: Today\'s goal — our first repository and first commit',
        development:'Trainer: Demonstrate git init in a new folder\nTrainees: Create a folder "my-first-repo" and run git init\nTrainer: Create index.html, demonstrate git status\nTrainees: Create their own index.html, observe git status\nTrainer: Demonstrate git add . then git status again\nTrainees: Stage their files\nTrainer: Demonstrate git commit -m "Initial commit"\nTrainees: Make their first commit\nTrainer: Show git log and explain the output\nTrainees: View their commit history',
        conclusion:'Trainer: Walk the room — check each trainee has a successful commit\nTrainer: Summarise: init → add → commit → log workflow\nFormative: Performance check — each trainee shows git log with at least 1 commit\nNext session: Branching',
        assessment:'Performance assessment — trainee demonstrates: git init, git add, git commit, git log',
        references:'Chacon, S. & Straub, B. (2014). Pro Git (2nd ed.). Chapter 2. Apress.\nRTB (2022). SWDVC301 LO1: Setup Repository.',
        trainee_notes:'Before next session:\n1. Make 3 more commits to your repository\n2. Research: What is a Git branch? Write 2 sentences\n3. Bring your laptop fully charged',
        status:'submitted' },
      { scheme_id:scheme1Id, trainer_id:trainer1Id, lo_id:loIdMap[2], week:3, date:'2024-09-23',
        topic:'Git Branching — Working on Features Safely', duration:90,
        objectives:'1. Create and switch between branches using git branch and git checkout\n2. Explain the purpose of branches in collaborative development\n3. Merge a feature branch into main using git merge',
        resources:'Computer, internet, terminal, VS Code, Git',
        introduction:'Trainer: Show a real GitHub repo with multiple branches\nTrainees: Discuss — "Why would a team need separate branches?" (3 min)\nTrainer: Connect to experience — like a separate draft before the final version',
        development:'Trainer: Demonstrate git branch (list), git branch feature-login (create)\nTrainees: Create a branch "feature-navbar"\nTrainer: git checkout feature-login, make a commit\nTrainees: Switch to their branch, add a navigation file, commit\nTrainer: Switch back to main, show the file is gone\nTrainees: Observe the isolation\nTrainer: Demonstrate git merge feature-login\nTrainees: Merge their feature-navbar into main',
        conclusion:'Trainer: Ask — "What happens if you commit on the wrong branch?"\nFormative: Each trainee shows branches list and successful merge in git log\nNext session: Working with remote repositories on GitHub',
        assessment:'Performance assessment — create branch, switch, commit, merge, verify in log',
        references:'Chacon, S. & Straub, B. (2014). Pro Git (2nd ed.). Chapter 3. Apress.\nAtlassian (2024). Git Branching Tutorial. https://www.atlassian.com/git/tutorials/using-branches',
        trainee_notes:'Before next session:\n1. Create 2 branches: "feature-header" and "feature-footer"\n2. Add content to each, merge both into main\n3. Watch: "Git Branches Tutorial" — Traversy Media on YouTube',
        status:'draft' },
    ];
    for (const sp of sessionPlans) {
      await conn.query(
        `INSERT IGNORE INTO session_plans (id,school_id,scheme_id,trainer_id,learning_outcome_id,week_number,lesson_date,topic,duration_mins,objectives,resources,introduction,development,conclusion,assessment_method,references_used,trainee_notes,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [uuid(),schoolId,sp.scheme_id,sp.trainer_id,sp.lo_id,sp.week,sp.date,sp.topic,sp.duration,sp.objectives,sp.resources,sp.introduction,sp.development,sp.conclusion,sp.assessment,sp.references,sp.trainee_notes,sp.status]
      );
    }
    console.log('✅ Session plans seeded');

    // ── Observations ───────────────────────────────────────────
    const observations = [
      { observer_id:dosId, trainer_id:trainer1Id, class_id:class1Id, module_id:modIdMap['SWDVC301'], date:'2024-09-09',
        subject:'Introduction to Version Control and Git',
        preparation:5,delivery:4,engagement:4,mgmt:4,assessment:4,overall:4,
        strengths:'Excellent use of real-world examples. Trainees were engaged from the start. Step-by-step Git installation was well-paced — all trainees successfully installed Git by end of session.',
        areas:'The quiz at the end felt rushed — some trainees did not have time to complete it. Consider allowing 5 minutes rather than 3.',
        recommendations:'Prepare quiz as a printed handout or Google Form. Consider a "park and revisit" board for questions during practical work.' },
      { observer_id:hodId, trainer_id:trainer2Id, class_id:class1Id, module_id:modIdMap['SWDWD301'], date:'2024-09-12',
        subject:'HTML Document Structure',
        preparation:3,delivery:3,engagement:3,mgmt:4,assessment:2,overall:3,
        strengths:'Good classroom management — trainees were attentive and orderly. Clear voice projection. Strong content knowledge.',
        areas:'The session lacked structured trainee activities — trainer talked for 40 minutes without a practical exercise. No formative assessment was conducted. Objectives were not written on the board.',
        recommendations:'Follow the 3-phase structure: intro (15%), development (70%), conclusion (15%). Include at least one practical exercise per session. Write objectives on the board at the start of every session.' },
    ];
    for (const obs of observations) {
      await conn.query(
        `INSERT IGNORE INTO observations (id,school_id,observer_id,trainer_id,class_id,module_id,observation_date,subject,preparation,delivery,student_engagement,classroom_mgmt,assessment_used,overall_score,strengths,areas_to_improve,recommendations,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'shared')`,
        [uuid(),schoolId,obs.observer_id,obs.trainer_id,obs.class_id,obs.module_id,obs.date,obs.subject,obs.preparation,obs.delivery,obs.engagement,obs.mgmt,obs.assessment,obs.overall,obs.strengths,obs.areas,obs.recommendations]
      );
    }
    console.log('✅ Observations seeded');

    // ── Sample incidents ────────────────────────────────────────
    const [[itLate]] = await conn.query(`SELECT id FROM incident_types WHERE school_id=? AND name='Late arrival' LIMIT 1`,[schoolId]);
    const [[itFight]] = await conn.query(`SELECT id FROM incident_types WHERE school_id=? AND name='Fighting' LIMIT 1`,[schoolId]);
    const [[st1]] = await conn.query(`SELECT id FROM students WHERE school_id=? AND reg_number='STM2024001' LIMIT 1`,[schoolId]);
    const [[st2]] = await conn.query(`SELECT id FROM students WHERE school_id=? AND reg_number='STM2024003' LIMIT 1`,[schoolId]);
    if (st1&&itLate) await conn.query(`INSERT IGNORE INTO incidents (id,school_id,student_id,reported_by,incident_type_id,title,description,location,incident_date,severity,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [uuid(),schoolId,st1.id,patronId,itLate.id,'Late arrival — 45 minutes','Mugisha Eric arrived 45 minutes late without a valid reason. Second time this week.','Main gate','2024-09-10','minor','reviewed']);
    if (st2&&itFight) await conn.query(`INSERT IGNORE INTO incidents (id,school_id,student_id,reported_by,incident_type_id,title,description,location,incident_date,severity,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [uuid(),schoolId,st2.id,trainer1Id,itFight.id,'Physical altercation during break','Habimana Patrick was involved in a physical fight during lunch break. Witnesses: Mukamana Solange, Nshimiyimana Joel.','Workshop area','2024-09-11','serious','pending']);
    console.log('✅ Sample incidents seeded');

    // ── Academic terms ─────────────────────────────────────────
    const terms = [
      {name:'Term 1 2024-2025',year:'2024-2025',start:'2024-09-02',end:'2024-12-13',current:1},
      {name:'Term 2 2024-2025',year:'2024-2025',start:'2025-01-13',end:'2025-04-11',current:0},
      {name:'Term 3 2024-2025',year:'2024-2025',start:'2025-05-05',end:'2025-07-25',current:0},
    ];
    for (const t of terms) {
      await conn.query(`INSERT IGNORE INTO academic_terms (id,school_id,name,academic_year,starts_at,ends_at,is_current) VALUES (?,?,?,?,?,?,?)`, [uuid(),schoolId,t.name,t.year,t.start,t.end,t.current]);
    }
    console.log('✅ Academic terms seeded');

    console.log('\n─────────────────────────────────────────────────────────');
    console.log('🎉 Shulink v2 seeded!\n');
    console.log('   PLATFORM:   admin@shulink.rw              / Admin@2025');
    console.log('   SCHOOL ADMIN: admin@stmartin.ac.rw        / Admin@2025');
    console.log('   HEADMASTER:   headmaster@stmartin.ac.rw   / Admin@2025');
    console.log('   DOS:          dos@stmartin.ac.rw           / Admin@2025');
    console.log('   DOD:          dod@stmartin.ac.rw           / Admin@2025');
    console.log('   HOD ICT:      hod.ict@stmartin.ac.rw      / Admin@2025');
    console.log('   PATRON:       e.gahima@stmartin.ac.rw     / Admin@2025');
    console.log('   TRAINER 1:    jb.nsengiyumva@stmartin.ac.rw / Trainer@2025');
    console.log('   TRAINER 2:    c.mukamana@stmartin.ac.rw   / Trainer@2025');
    console.log('\n   DATA: 2 classes · 10 trainees · 2 schemes');
    console.log('   3 session plans (with full RTB content)');
    console.log('   2 observations · 2 incidents · 11 incident types');
    console.log('   3 academic terms · 19 modules · 3 LOs for SWDVC301');
    console.log('─────────────────────────────────────────────────────────\n');

  } catch (e) {
    console.error('❌ Seed error:', e.message);
    throw e;
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
