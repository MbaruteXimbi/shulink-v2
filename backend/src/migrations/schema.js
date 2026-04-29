const pool = require('../db');

const schema = [

  // ── PLATFORM ────────────────────────────────────────────────────

  `CREATE TABLE IF NOT EXISTS schools (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name          VARCHAR(200) NOT NULL,
    short_name    VARCHAR(60),
    school_type   ENUM('TSS','VTC','IPRC','polytechnic','other') DEFAULT 'TSS',
    governing_body ENUM('RTB','RP','MINEDUC') DEFAULT 'RTB',
    country       VARCHAR(60) DEFAULT 'Rwanda',
    province      VARCHAR(60),
    district      VARCHAR(100),
    sector        VARCHAR(100),
    address       TEXT,
    phone         VARCHAR(30),
    email         VARCHAR(150),
    website       VARCHAR(200),
    logo_url      TEXT,
    primary_color VARCHAR(10) DEFAULT '#3b82f6',
    slug          VARCHAR(80) NOT NULL UNIQUE,
    is_active     TINYINT(1) DEFAULT 1,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS subscription_plans (
    id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name         VARCHAR(80) NOT NULL,
    name_rw      VARCHAR(80),
    price_rwf    INT NOT NULL DEFAULT 0,
    max_trainees INT DEFAULT 200,
    features     JSON,
    is_active    TINYINT(1) DEFAULT 1,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS school_subscriptions (
    id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id   CHAR(36) NOT NULL,
    plan_id     CHAR(36) NOT NULL,
    status      ENUM('trial','active','expired','suspended') DEFAULT 'trial',
    starts_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at  DATETIME,
    billed_rwf  INT DEFAULT 0,
    payment_ref VARCHAR(100),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id)   REFERENCES subscription_plans(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ── USERS ───────────────────────────────────────────────────────

  `CREATE TABLE IF NOT EXISTS users (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id       CHAR(36) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    password_hash   TEXT NOT NULL,
    role            ENUM('super_admin','school_admin','headmaster','dos','dod','hod','patron','metron','trainer','trainee','parent') NOT NULL,
    department_id   CHAR(36) DEFAULT NULL,
    class_assigned  VARCHAR(50) DEFAULT NULL,
    phone           VARCHAR(30) DEFAULT NULL,
    national_id     VARCHAR(30) DEFAULT NULL,
    photo_url       TEXT DEFAULT NULL,
    is_active       TINYINT(1) DEFAULT 1,
    last_login      DATETIME DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_school_email (school_id, email),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ── RTB CURRICULUM STRUCTURE ────────────────────────────────────

  `CREATE TABLE IF NOT EXISTS rtb_sectors (
    id         CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name       VARCHAR(100) NOT NULL,
    code       VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS qualifications (
    id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sector_id        CHAR(36) DEFAULT NULL,
    curriculum_code  VARCHAR(30) NOT NULL UNIQUE,
    title            VARCHAR(200) NOT NULL,
    short_title      VARCHAR(100),
    rqf_level        TINYINT NOT NULL,
    total_credits    SMALLINT DEFAULT 0,
    total_hours      SMALLINT DEFAULT 0,
    duration_years   TINYINT DEFAULT 3,
    entry_requirement TEXT,
    graduate_profile TEXT,
    is_active        TINYINT(1) DEFAULT 1,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sector_id) REFERENCES rtb_sectors(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS school_qualifications (
    id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id        CHAR(36) NOT NULL,
    qualification_id CHAR(36) NOT NULL,
    is_active        TINYINT(1) DEFAULT 1,
    started_year     VARCHAR(10),
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_school_qual (school_id, qualification_id),
    FOREIGN KEY (school_id)        REFERENCES schools(id)        ON DELETE CASCADE,
    FOREIGN KEY (qualification_id) REFERENCES qualifications(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS modules (
    id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    qualification_id CHAR(36) NOT NULL,
    code             VARCHAR(20) NOT NULL,
    name             VARCHAR(200) NOT NULL,
    module_type      ENUM('specific','general','complementary') NOT NULL,
    sub_type         ENUM('core','elective') DEFAULT 'core',
    learning_hours   SMALLINT DEFAULT 0,
    learning_periods SMALLINT DEFAULT 0,
    credits          TINYINT DEFAULT 0,
    theory_pct       TINYINT DEFAULT 30,
    practical_pct    TINYINT DEFAULT 70,
    passing_line_pct TINYINT DEFAULT 70,
    sequence_order   TINYINT DEFAULT 0,
    description      TEXT,
    is_active        TINYINT(1) DEFAULT 1,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_qual_code (qualification_id, code),
    FOREIGN KEY (qualification_id) REFERENCES qualifications(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS learning_outcomes (
    id                CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    module_id         CHAR(36) NOT NULL,
    number            TINYINT NOT NULL,
    title             VARCHAR(200) NOT NULL,
    learning_hours    SMALLINT DEFAULT 0,
    indicative_content JSON,
    resources         JSON,
    facilitation_techniques TEXT,
    formative_methods TEXT,
    sequence_order    TINYINT DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS performance_criteria (
    id                   CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    learning_outcome_id  CHAR(36) NOT NULL,
    element_of_competency VARCHAR(200),
    criteria_text        TEXT NOT NULL,
    indicators           JSON,
    sequence_order       TINYINT DEFAULT 0,
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (learning_outcome_id) REFERENCES learning_outcomes(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS integrated_assessments (
    id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    module_id        CHAR(36) NOT NULL,
    school_id        CHAR(36) NOT NULL,
    title            VARCHAR(200) NOT NULL,
    situation        TEXT NOT NULL,
    context          TEXT,
    time_allowed_hrs DECIMAL(4,1) DEFAULT 4.0,
    resources        JSON,
    min_assessors    TINYINT DEFAULT 3,
    created_by       CHAR(36) DEFAULT NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id)  REFERENCES modules(id)  ON DELETE CASCADE,
    FOREIGN KEY (school_id)  REFERENCES schools(id)  ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS assessment_outcomes (
    id                      CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    integrated_assessment_id CHAR(36) NOT NULL,
    outcome_title           VARCHAR(200) NOT NULL,
    weight_pct              TINYINT DEFAULT 0,
    criteria_indicators     JSON,
    sequence_order          TINYINT DEFAULT 0,
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (integrated_assessment_id) REFERENCES integrated_assessments(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ── DEPARTMENTS & CLASSES ───────────────────────────────────────

  `CREATE TABLE IF NOT EXISTS departments (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id     CHAR(36) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    code          VARCHAR(20),
    hod_id        CHAR(36) DEFAULT NULL,
    description   TEXT,
    is_active     TINYINT(1) DEFAULT 1,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS classes (
    id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id        CHAR(36) NOT NULL,
    qualification_id CHAR(36) DEFAULT NULL,
    department_id    CHAR(36) DEFAULT NULL,
    name             VARCHAR(80) NOT NULL,
    level            VARCHAR(20),
    section          VARCHAR(20),
    patron_id        CHAR(36) DEFAULT NULL,
    academic_year    VARCHAR(20),
    is_active        TINYINT(1) DEFAULT 1,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id)        REFERENCES schools(id)        ON DELETE CASCADE,
    FOREIGN KEY (qualification_id) REFERENCES qualifications(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id)    REFERENCES departments(id)    ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ── STUDENTS ────────────────────────────────────────────────────

  `CREATE TABLE IF NOT EXISTS students (
    id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id        CHAR(36) NOT NULL,
    user_id          CHAR(36) DEFAULT NULL,
    reg_number       VARCHAR(50) NOT NULL,
    full_name        VARCHAR(150) NOT NULL,
    class_id         CHAR(36) DEFAULT NULL,
    qualification_id CHAR(36) DEFAULT NULL,
    gender           ENUM('Male','Female') DEFAULT NULL,
    date_of_birth    DATE DEFAULT NULL,
    parent_name      VARCHAR(150) DEFAULT NULL,
    parent_phone     VARCHAR(30) DEFAULT NULL,
    parent_email     VARCHAR(150) DEFAULT NULL,
    boarding         TINYINT(1) DEFAULT 0,
    photo_url        TEXT DEFAULT NULL,
    is_active        TINYINT(1) DEFAULT 1,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_school_reg (school_id, reg_number),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id)  REFERENCES classes(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ── CHRONOGRAM ──────────────────────────────────────────────────

  `CREATE TABLE IF NOT EXISTS chronograms (
    id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id        CHAR(36) NOT NULL,
    qualification_id CHAR(36) NOT NULL,
    academic_year    VARCHAR(20) NOT NULL,
    total_periods    SMALLINT DEFAULT 0,
    import_source    ENUM('excel','manual') DEFAULT 'excel',
    imported_by      CHAR(36) DEFAULT NULL,
    notes            TEXT,
    is_active        TINYINT(1) DEFAULT 1,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_school_qual_year (school_id, qualification_id, academic_year),
    FOREIGN KEY (school_id)        REFERENCES schools(id)        ON DELETE CASCADE,
    FOREIGN KEY (qualification_id) REFERENCES qualifications(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS chronogram_terms (
    id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    chronogram_id  CHAR(36) NOT NULL,
    term_number    TINYINT NOT NULL,
    name           VARCHAR(80),
    starts_at      DATE NOT NULL,
    ends_at        DATE NOT NULL,
    total_weeks    TINYINT DEFAULT 0,
    total_periods  SMALLINT DEFAULT 0,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chronogram_id) REFERENCES chronograms(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS chronogram_weeks (
    id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    chronogram_id  CHAR(36) NOT NULL,
    term_id        CHAR(36) NOT NULL,
    week_number    TINYINT NOT NULL,
    date_start     DATE NOT NULL,
    date_end       DATE NOT NULL,
    total_periods  TINYINT DEFAULT 0,
    week_type      ENUM('teaching','assessment_school','assessment_district','assessment_national','iap','holiday','other') DEFAULT 'teaching',
    notes          VARCHAR(200),
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chronogram_id) REFERENCES chronograms(id)      ON DELETE CASCADE,
    FOREIGN KEY (term_id)       REFERENCES chronogram_terms(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS chronogram_allocations (
    id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    week_id     CHAR(36) NOT NULL,
    module_id   CHAR(36) NOT NULL,
    periods     TINYINT DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_week_module (week_id, module_id),
    FOREIGN KEY (week_id)   REFERENCES chronogram_weeks(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id)          ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ── PEDAGOGY ────────────────────────────────────────────────────

  `CREATE TABLE IF NOT EXISTS academic_terms (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id     CHAR(36) NOT NULL,
    name          VARCHAR(80) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    starts_at     DATE NOT NULL,
    ends_at       DATE NOT NULL,
    is_current    TINYINT(1) DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS schemes_of_work (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id     CHAR(36) NOT NULL,
    trainer_id    CHAR(36) NOT NULL,
    module_id     CHAR(36) DEFAULT NULL,
    class_id      CHAR(36) DEFAULT NULL,
    term_id       CHAR(36) DEFAULT NULL,
    chronogram_id CHAR(36) DEFAULT NULL,
    subject       VARCHAR(200) NOT NULL,
    total_weeks   TINYINT DEFAULT 12,
    status        ENUM('draft','submitted','approved','rejected') DEFAULT 'draft',
    approved_by   CHAR(36) DEFAULT NULL,
    approved_at   DATETIME DEFAULT NULL,
    dos_notes     TEXT DEFAULT NULL,
    file_url      TEXT DEFAULT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id)    REFERENCES schools(id)    ON DELETE CASCADE,
    FOREIGN KEY (trainer_id)   REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (module_id)    REFERENCES modules(id)    ON DELETE SET NULL,
    FOREIGN KEY (class_id)     REFERENCES classes(id)    ON DELETE SET NULL,
    FOREIGN KEY (chronogram_id)REFERENCES chronograms(id)ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS session_plans (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id           CHAR(36) NOT NULL,
    scheme_id           CHAR(36) NOT NULL,
    trainer_id          CHAR(36) NOT NULL,
    learning_outcome_id CHAR(36) DEFAULT NULL,
    week_number         TINYINT NOT NULL,
    lesson_date         DATE DEFAULT NULL,
    topic               VARCHAR(200) NOT NULL,
    duration_mins       SMALLINT DEFAULT 60,
    objectives          TEXT,
    resources           TEXT,
    introduction        TEXT,
    development         TEXT,
    conclusion          TEXT,
    assessment_method   TEXT,
    references_used     TEXT,
    self_reflection     TEXT,
    status              ENUM('draft','submitted','reviewed') DEFAULT 'draft',
    dos_feedback        TEXT DEFAULT NULL,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id)           REFERENCES schools(id)           ON DELETE CASCADE,
    FOREIGN KEY (scheme_id)           REFERENCES schemes_of_work(id)   ON DELETE CASCADE,
    FOREIGN KEY (trainer_id)          REFERENCES users(id)             ON DELETE CASCADE,
    FOREIGN KEY (learning_outcome_id) REFERENCES learning_outcomes(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS observations (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id           CHAR(36) NOT NULL,
    observer_id         CHAR(36) NOT NULL,
    trainer_id          CHAR(36) NOT NULL,
    class_id            CHAR(36) DEFAULT NULL,
    module_id           CHAR(36) DEFAULT NULL,
    observation_date    DATE NOT NULL,
    subject             VARCHAR(150),
    preparation         TINYINT DEFAULT 0,
    delivery            TINYINT DEFAULT 0,
    student_engagement  TINYINT DEFAULT 0,
    classroom_mgmt      TINYINT DEFAULT 0,
    assessment_used     TINYINT DEFAULT 0,
    overall_score       TINYINT DEFAULT 0,
    strengths           TEXT,
    areas_to_improve    TEXT,
    recommendations     TEXT,
    trainer_response    TEXT,
    status              ENUM('draft','shared','acknowledged') DEFAULT 'draft',
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id)  REFERENCES schools(id)  ON DELETE CASCADE,
    FOREIGN KEY (observer_id)REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (module_id)  REFERENCES modules(id)  ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ── TRAINEE PORTFOLIO (CBC) ─────────────────────────────────────

  `CREATE TABLE IF NOT EXISTS trainee_competencies (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id           CHAR(36) NOT NULL,
    student_id          CHAR(36) NOT NULL,
    module_id           CHAR(36) NOT NULL,
    learning_outcome_id CHAR(36) DEFAULT NULL,
    trainer_id          CHAR(36) DEFAULT NULL,
    status              ENUM('not_started','in_progress','submitted','competent','not_yet_competent') DEFAULT 'not_started',
    formative_score     DECIMAL(5,2) DEFAULT NULL,
    summative_score     DECIMAL(5,2) DEFAULT NULL,
    final_score         DECIMAL(5,2) DEFAULT NULL,
    attempt_count       TINYINT DEFAULT 0,
    signed_off_by       CHAR(36) DEFAULT NULL,
    signed_off_at       DATETIME DEFAULT NULL,
    trainer_notes       TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_module_lo (student_id, module_id, learning_outcome_id),
    FOREIGN KEY (school_id)           REFERENCES schools(id)           ON DELETE CASCADE,
    FOREIGN KEY (student_id)          REFERENCES students(id)          ON DELETE CASCADE,
    FOREIGN KEY (module_id)           REFERENCES modules(id)           ON DELETE CASCADE,
    FOREIGN KEY (learning_outcome_id) REFERENCES learning_outcomes(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS competency_evidence (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id       CHAR(36) NOT NULL,
    competency_id   CHAR(36) NOT NULL,
    student_id      CHAR(36) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    evidence_type   ENUM('document','photo','video','written_assessment','performance','observation','other') DEFAULT 'document',
    file_url        TEXT,
    file_type       VARCHAR(30),
    file_size       INT DEFAULT 0,
    status          ENUM('draft','submitted','approved','rejected') DEFAULT 'draft',
    reviewed_by     CHAR(36) DEFAULT NULL,
    reviewed_at     DATETIME DEFAULT NULL,
    reviewer_notes  TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id)     REFERENCES schools(id)               ON DELETE CASCADE,
    FOREIGN KEY (competency_id) REFERENCES trainee_competencies(id)  ON DELETE CASCADE,
    FOREIGN KEY (student_id)    REFERENCES students(id)              ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS formative_checklists (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id           CHAR(36) NOT NULL,
    student_id          CHAR(36) NOT NULL,
    learning_outcome_id CHAR(36) NOT NULL,
    trainer_id          CHAR(36) NOT NULL,
    assessment_date     DATE NOT NULL,
    responses           JSON,
    total_score         DECIMAL(5,2) DEFAULT NULL,
    is_competent        TINYINT(1) DEFAULT NULL,
    notes               TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id)           REFERENCES schools(id)           ON DELETE CASCADE,
    FOREIGN KEY (student_id)          REFERENCES students(id)          ON DELETE CASCADE,
    FOREIGN KEY (learning_outcome_id) REFERENCES learning_outcomes(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS iap_plans (
    id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id        CHAR(36) NOT NULL,
    student_id       CHAR(36) NOT NULL,
    chronogram_id    CHAR(36) DEFAULT NULL,
    company_name     VARCHAR(200) NOT NULL,
    company_address  TEXT,
    supervisor_name  VARCHAR(150),
    supervisor_phone VARCHAR(30),
    supervisor_email VARCHAR(150),
    start_date       DATE,
    end_date         DATE,
    total_periods    SMALLINT DEFAULT 0,
    wpl_focal_person VARCHAR(150),
    objectives       TEXT,
    activities       JSON,
    status           ENUM('draft','submitted','approved','ongoing','completed') DEFAULT 'draft',
    school_comments  TEXT,
    final_report_url TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id)  REFERENCES schools(id)   ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id)  ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ── DISCIPLINE ──────────────────────────────────────────────────

  `CREATE TABLE IF NOT EXISTS incident_types (
    id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id   CHAR(36) DEFAULT NULL,
    name        VARCHAR(100) NOT NULL,
    severity    ENUM('minor','moderate','serious','critical') NOT NULL,
    description TEXT DEFAULT NULL,
    is_global   TINYINT(1) DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS incidents (
    id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id        CHAR(36) NOT NULL,
    student_id       CHAR(36) DEFAULT NULL,
    reported_by      CHAR(36) DEFAULT NULL,
    incident_type_id CHAR(36) DEFAULT NULL,
    title            VARCHAR(200) NOT NULL,
    description      TEXT NOT NULL,
    location         VARCHAR(100) DEFAULT NULL,
    incident_date    DATE NOT NULL,
    incident_time    TIME DEFAULT NULL,
    severity         ENUM('minor','moderate','serious','critical') NOT NULL,
    witnesses        TEXT DEFAULT NULL,
    status           ENUM('pending','reviewed','sanctioned','resolved','closed') DEFAULT 'pending',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id)  REFERENCES schools(id)  ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS sanctions (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id     CHAR(36) NOT NULL,
    incident_id   CHAR(36) DEFAULT NULL,
    student_id    CHAR(36) NOT NULL,
    sanction_type ENUM('verbal_warning','written_warning','detention','suspension','parent_summon','community_service','expulsion','other') NOT NULL,
    description   TEXT DEFAULT NULL,
    duration_days INT DEFAULT NULL,
    start_date    DATE DEFAULT NULL,
    end_date      DATE DEFAULT NULL,
    issued_by     CHAR(36) DEFAULT NULL,
    approved_by   CHAR(36) DEFAULT NULL,
    status        ENUM('pending','approved','active','completed','cancelled') DEFAULT 'pending',
    notes         TEXT DEFAULT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id)  REFERENCES schools(id)   ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id)  ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS dod_reviews (
    id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id    CHAR(36) NOT NULL,
    incident_id  CHAR(36) NOT NULL,
    dod_id       CHAR(36) DEFAULT NULL,
    decision     ENUM('approve','modify','reject','escalate') NOT NULL,
    notes        TEXT DEFAULT NULL,
    action_taken TEXT DEFAULT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id)  REFERENCES schools(id)   ON DELETE CASCADE,
    FOREIGN KEY (incident_id)REFERENCES incidents(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS patron_reports (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id       CHAR(36) NOT NULL,
    patron_id       CHAR(36) DEFAULT NULL,
    class_id        CHAR(36) DEFAULT NULL,
    term_id         CHAR(36) DEFAULT NULL,
    report_period   VARCHAR(80) DEFAULT NULL,
    summary         TEXT NOT NULL,
    incidents_count INT DEFAULT 0,
    recommendations TEXT DEFAULT NULL,
    status          ENUM('draft','submitted','reviewed') DEFAULT 'draft',
    reviewed_by     CHAR(36) DEFAULT NULL,
    reviewed_at     DATETIME DEFAULT NULL,
    dod_notes       TEXT DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ── NOTIFICATIONS ───────────────────────────────────────────────

  `CREATE TABLE IF NOT EXISTS notifications (
    id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id    CHAR(36) NOT NULL,
    user_id      CHAR(36) NOT NULL,
    title        VARCHAR(200) NOT NULL,
    message      TEXT NOT NULL,
    type         VARCHAR(40) DEFAULT 'info',
    is_read      TINYINT(1) DEFAULT 0,
    related_id   CHAR(36) DEFAULT NULL,
    related_type VARCHAR(60) DEFAULT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS notification_logs (
    id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id   CHAR(36) NOT NULL,
    channel     ENUM('sms','email','whatsapp','push','in_app') NOT NULL,
    recipient   VARCHAR(200) NOT NULL,
    subject     VARCHAR(200) DEFAULT NULL,
    message     TEXT NOT NULL,
    status      ENUM('pending','sent','failed','delivered') DEFAULT 'pending',
    error       TEXT DEFAULT NULL,
    sent_at     DATETIME DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ── EXCEL IMPORT LOGS ───────────────────────────────────────────

  `CREATE TABLE IF NOT EXISTS import_logs (
    id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id    CHAR(36) NOT NULL,
    import_type  VARCHAR(60) NOT NULL,
    file_name    VARCHAR(200),
    total_rows   INT DEFAULT 0,
    success_rows INT DEFAULT 0,
    error_rows   INT DEFAULT 0,
    errors       JSON,
    imported_by  CHAR(36) DEFAULT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

async function runMigrations() {
  const conn = await pool.getConnection();
  try {
    console.log('🔄 Running Shulink v2 migrations...');
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    for (const sql of schema) {
      await conn.query(sql);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS=1');
    console.log(`✅ ${schema.length} tables ready.`);
  } catch (e) {
    console.error('❌ Migration error:', e.message);
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = { runMigrations };
