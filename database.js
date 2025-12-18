// database.js - SQLite Database Initialization for Online School/Academy
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Configuration
const DB_PATH = path.join(__dirname, 'DBppacad.db');
const BACKUP_DIR = path.join(__dirname, 'backups');

class DatabaseInitializer {
  constructor(dbPath = DB_PATH) {
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * Initialize the database - check if exists, create if not
   */
  async initialize() {
    try {
      console.log('🔍 Checking database...');
      
      const dbExists = fs.existsSync(this.dbPath);
      
      if (dbExists) {
        console.log('✅ Database file found. Verifying tables...');
        await this.connectDatabase();
        await this.verifyTables();
      } else {
        console.log('📝 Database not found. Creating new database...');
        await this.connectDatabase();
        await this.createSchema();
        await this.insertDefaultData();
        console.log('✅ Database created successfully!');
      }
      
      return this.db;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Connect to SQLite database
   */
  connectDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('🔗 Connected to database');
          // Enable foreign keys
          this.db.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) reject(err);
            else resolve();
          });
        }
      });
    });
  }

  /**
   * Verify all required tables exist
   */
  async verifyTables() {
    const requiredTables = [
      'users', 'grade', 'subject', 'lessons', 'assessments', 'questions',
      'results', 'responses', 'course_progress', 'student_instructors',
      'certificates', 'payments', 'subscriptions', 'coupons', 'coupon_usage',
      'activity_logs', 'notifications', 'notifications_settings', 'settings',
      'sessions', 'user_achievements', 'badges', 'user_badges', 'enrollment',
      'feedback', 'messages', 'forums', 'forum_posts', 'forum_comments',
      'tags', 'lesson_tags'
    ];

    const existingTables = await this.getExistingTables();
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    if (missingTables.length > 0) {
      console.log(`⚠️  Missing tables: ${missingTables.join(', ')}`);
      console.log('🔧 Creating missing tables...');
      await this.createSchema();
    } else {
      console.log('✅ All tables verified');
    }
  }

  /**
   * Get list of existing tables
   */
  getExistingTables() {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT name FROM sqlite_master WHERE type='table'",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(r => r.name));
        }
      );
    });
  }

  /**
   * Create complete optimized database schema
   */
  async createSchema() {
    const schema = this.getSchemaSQL();
    
    for (const statement of schema) {
      await this.runQuery(statement);
    }
    
    console.log('✅ Schema created successfully');
  }

  /**
   * Get optimized SQL schema
   */
  getSchemaSQL() {
    return [
      // 1. GRADE TABLE (must be first - referenced by others)
      `CREATE TABLE IF NOT EXISTS grade (
        idGrade INTEGER PRIMARY KEY AUTOINCREMENT,
        grade_level INTEGER NOT NULL UNIQUE,
        grade_name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 2. USERS TABLE
      `CREATE TABLE IF NOT EXISTS users (
        idUser INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        user_role TEXT NOT NULL DEFAULT 'student' CHECK(user_role IN ('student', 'instructor', 'admin', 'parent')),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended', 'deleted')),
        idGrade INTEGER,
        profile_image TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        FOREIGN KEY (idGrade) REFERENCES grade(idGrade) ON DELETE SET NULL
      )`,

      // 3. SUBJECT TABLE
      `CREATE TABLE IF NOT EXISTS subject (
        idSubject INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_name TEXT NOT NULL UNIQUE,
        subject_code TEXT UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 4. ENROLLMENT TABLE (NEW - tracks student-subject enrollment)
      `CREATE TABLE IF NOT EXISTS enrollment (
        idEnrollment INTEGER PRIMARY KEY AUTOINCREMENT,
        idUser INTEGER NOT NULL,
        idSubject INTEGER NOT NULL,
        enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completion_date TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'dropped', 'paused')),
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE,
        FOREIGN KEY (idSubject) REFERENCES subject(idSubject) ON DELETE CASCADE,
        UNIQUE(idUser, idSubject)
      )`,

      // 5. LESSONS TABLE
      `CREATE TABLE IF NOT EXISTS lessons (
        idLesson INTEGER PRIMARY KEY AUTOINCREMENT,
        idSubject INTEGER NOT NULL,
        idGrade INTEGER NOT NULL,
        lesson_title TEXT NOT NULL,
        lesson_content TEXT NOT NULL,
        lesson_order INTEGER DEFAULT 0,
        duration_minutes INTEGER,
        url TEXT,
        video_url TEXT,
        uploaded_by INTEGER NOT NULL,
        status TEXT DEFAULT 'published' CHECK(status IN ('draft', 'published', 'archived')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idSubject) REFERENCES subject(idSubject) ON DELETE CASCADE,
        FOREIGN KEY (idGrade) REFERENCES grade(idGrade) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(idUser) ON DELETE RESTRICT
      )`,

      // 6. ASSESSMENTS TABLE
      `CREATE TABLE IF NOT EXISTS assessments (
        idAssessment INTEGER PRIMARY KEY AUTOINCREMENT,
        idLesson INTEGER NOT NULL,
        assessment_title TEXT NOT NULL,
        assessment_type TEXT DEFAULT 'quiz' CHECK(assessment_type IN ('quiz', 'exam', 'assignment', 'practice')),
        total_marks INTEGER NOT NULL,
        pass_marks INTEGER NOT NULL,
        duration_minutes INTEGER,
        url TEXT,
        uploaded_by INTEGER NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('draft', 'active', 'archived')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idLesson) REFERENCES lessons(idLesson) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(idUser) ON DELETE RESTRICT
      )`,

      // 7. QUESTIONS TABLE
      `CREATE TABLE IF NOT EXISTS questions (
        idQuestion INTEGER PRIMARY KEY AUTOINCREMENT,
        idAssessment INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL CHECK(question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank')),
        options TEXT,
        correct_answer TEXT NOT NULL,
        marks INTEGER NOT NULL DEFAULT 1,
        explanation TEXT,
        question_order INTEGER DEFAULT 0,
        FOREIGN KEY (idAssessment) REFERENCES assessments(idAssessment) ON DELETE CASCADE
      )`,

      // 8. RESULTS TABLE
      `CREATE TABLE IF NOT EXISTS results (
        idResult INTEGER PRIMARY KEY AUTOINCREMENT,
        idAssessment INTEGER NOT NULL,
        idUser INTEGER NOT NULL,
        marks_obtained INTEGER NOT NULL,
        total_marks INTEGER NOT NULL,
        percentage REAL GENERATED ALWAYS AS (CAST(marks_obtained AS REAL) / total_marks * 100) STORED,
        status TEXT NOT NULL CHECK(status IN ('pass', 'fail', 'pending')),
        attempt_number INTEGER DEFAULT 1,
        taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idAssessment) REFERENCES assessments(idAssessment) ON DELETE CASCADE,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
      )`,

      // 9. RESPONSES TABLE
      `CREATE TABLE IF NOT EXISTS responses (
        idResponse INTEGER PRIMARY KEY AUTOINCREMENT,
        idQuestion INTEGER NOT NULL,
        idUser INTEGER NOT NULL,
        idResult INTEGER,
        given_answer TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL,
        marks_awarded INTEGER DEFAULT 0,
        answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idQuestion) REFERENCES questions(idQuestion) ON DELETE CASCADE,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE,
        FOREIGN KEY (idResult) REFERENCES results(idResult) ON DELETE CASCADE
      )`,

      // 10. COURSE_PROGRESS TABLE
      `CREATE TABLE IF NOT EXISTS course_progress (
        idProgress INTEGER PRIMARY KEY AUTOINCREMENT,
        idUser INTEGER NOT NULL,
        idLesson INTEGER NOT NULL,
        progress_percentage REAL NOT NULL DEFAULT 0 CHECK(progress_percentage >= 0 AND progress_percentage <= 100),
        is_completed BOOLEAN DEFAULT 0,
        last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE,
        FOREIGN KEY (idLesson) REFERENCES lessons(idLesson) ON DELETE CASCADE,
        UNIQUE(idUser, idLesson)
      )`,

      // 11. STUDENT_INSTRUCTORS TABLE (renamed from user_instructors)
      `CREATE TABLE IF NOT EXISTS student_instructors (
        idStudentInstructor INTEGER PRIMARY KEY AUTOINCREMENT,
        idStudent INTEGER NOT NULL,
        idInstructor INTEGER NOT NULL,
        idSubject INTEGER,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idStudent) REFERENCES users(idUser) ON DELETE CASCADE,
        FOREIGN KEY (idInstructor) REFERENCES users(idUser) ON DELETE CASCADE,
        FOREIGN KEY (idSubject) REFERENCES subject(idSubject) ON DELETE CASCADE,
        CHECK (idStudent != idInstructor),
        UNIQUE(idStudent, idInstructor, idSubject)
      )`,

      // 12. CERTIFICATES TABLE
      `CREATE TABLE IF NOT EXISTS certificates (
        idCertificate INTEGER PRIMARY KEY AUTOINCREMENT,
        idUser INTEGER NOT NULL,
        idSubject INTEGER,
        certificate_title TEXT NOT NULL,
        certificate_number TEXT UNIQUE NOT NULL,
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        url TEXT NOT NULL,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE,
        FOREIGN KEY (idSubject) REFERENCES subject(idSubject) ON DELETE SET NULL
      )`,

      // 13. SUBSCRIPTIONS TABLE
      `CREATE TABLE IF NOT EXISTS subscriptions (
        idSubscription INTEGER PRIMARY KEY AUTOINCREMENT,
        idUser INTEGER NOT NULL,
        subscription_type TEXT NOT NULL CHECK(subscription_type IN ('free', 'basic', 'premium', 'enterprise')),
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'expired', 'cancelled', 'paused')),
        auto_renew BOOLEAN DEFAULT 1,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
      )`,

      // 14. PAYMENTS TABLE
      `CREATE TABLE IF NOT EXISTS payments (
        idPayment INTEGER PRIMARY KEY AUTOINCREMENT,
        idUser INTEGER NOT NULL,
        idSubscription INTEGER,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method TEXT NOT NULL CHECK(payment_method IN ('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'crypto')),
        transaction_id TEXT UNIQUE,
        status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE,
        FOREIGN KEY (idSubscription) REFERENCES subscriptions(idSubscription) ON DELETE SET NULL
      )`,

      // 15. COUPONS TABLE
      `CREATE TABLE IF NOT EXISTS coupons (
        idCoupon INTEGER PRIMARY KEY AUTOINCREMENT,
        coupon_code TEXT UNIQUE NOT NULL,
        discount_percentage REAL CHECK(discount_percentage >= 0 AND discount_percentage <= 100),
        discount_amount REAL,
        valid_from TIMESTAMP NOT NULL,
        valid_to TIMESTAMP NOT NULL,
        usage_limit INTEGER,
        times_used INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'expired')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 16. COUPON_USAGE TABLE
      `CREATE TABLE IF NOT EXISTS coupon_usage (
        idCouponUsage INTEGER PRIMARY KEY AUTOINCREMENT,
        idCoupon INTEGER NOT NULL,
        idUser INTEGER NOT NULL,
        idPayment INTEGER,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idCoupon) REFERENCES coupons(idCoupon) ON DELETE CASCADE,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE,
        FOREIGN KEY (idPayment) REFERENCES payments(idPayment) ON DELETE SET NULL
      )`,

      // 17. ACTIVITY_LOGS TABLE (consolidated from logs, audit_logs, activity_logs)
      `CREATE TABLE IF NOT EXISTS activity_logs (
        idActivityLog INTEGER PRIMARY KEY AUTOINCREMENT,
        idUser INTEGER,
        activity_type TEXT NOT NULL,
        activity_category TEXT CHECK(activity_category IN ('security', 'academic', 'system', 'payment', 'communication')),
        activity_details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE SET NULL
      )`,

      // 18. NOTIFICATIONS TABLE
      `CREATE TABLE IF NOT EXISTS notifications (
        idNotification INTEGER PRIMARY KEY AUTOINCREMENT,
        idUser INTEGER NOT NULL,
        notification_type TEXT CHECK(notification_type IN ('info', 'warning', 'success', 'error')),
        notification_title TEXT,
        notification_text TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT 0,
        action_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
      )`,

      // 19. NOTIFICATIONS_SETTINGS TABLE
      `CREATE TABLE IF NOT EXISTS notifications_settings (
        idNotificationSetting INTEGER PRIMARY KEY AUTOINCREMENT,
        idUser INTEGER NOT NULL UNIQUE,
        email_notifications BOOLEAN NOT NULL DEFAULT 1,
        sms_notifications BOOLEAN NOT NULL DEFAULT 0,
        push_notifications BOOLEAN NOT NULL DEFAULT 1,
        marketing_emails BOOLEAN DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
      )`,

      // 20. SETTINGS TABLE (system-wide settings only)
      `CREATE TABLE IF NOT EXISTS settings (
        idSetting INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        setting_type TEXT CHECK(setting_type IN ('string', 'number', 'boolean', 'json')),
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 21. SESSIONS TABLE
      `CREATE TABLE IF NOT EXISTS sessions (
        idSession INTEGER PRIMARY KEY AUTOINCREMENT,
        idUser INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
      )`,

      // 22. BADGES TABLE
      `CREATE TABLE IF NOT EXISTS badges (
        idBadge INTEGER PRIMARY KEY AUTOINCREMENT,
        badge_name TEXT NOT NULL UNIQUE,
        badge_description TEXT,
        badge_icon TEXT,
        badge_criteria TEXT,
        points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 23. USER_BADGES TABLE
      `CREATE TABLE IF NOT EXISTS user_badges (
        idUserBadge INTEGER PRIMARY KEY AUTOINCREMENT,
        idUser INTEGER NOT NULL,
        idBadge INTEGER NOT NULL,
        awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE,
        FOREIGN KEY (idBadge) REFERENCES badges(idBadge) ON DELETE CASCADE,
        UNIQUE(idUser, idBadge)
      )`,

      // 24. USER_ACHIEVEMENTS TABLE (renamed from achievements)
      `CREATE TABLE IF NOT EXISTS user_achievements (
        idAchievement INTEGER PRIMARY KEY AUTOINCREMENT,
        idUser INTEGER NOT NULL,
        achievement_title TEXT NOT NULL,
        achievement_description TEXT,
        achievement_type TEXT CHECK(achievement_type IN ('milestone', 'streak', 'completion', 'excellence')),
        points INTEGER DEFAULT 0,
        awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
      )`,

      // 25. FEEDBACK TABLE
      `CREATE TABLE IF NOT EXISTS feedback (
        idFeedback INTEGER PRIMARY KEY AUTOINCREMENT,
        idUser INTEGER NOT NULL,
        feedback_type TEXT CHECK(feedback_type IN ('bug', 'feature', 'improvement', 'complaint', 'praise')),
        feedback_text TEXT NOT NULL,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'resolved', 'closed')),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
      )`,

      // 26. MESSAGES TABLE
      `CREATE TABLE IF NOT EXISTS messages (
        idMessage INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        subject TEXT,
        message_text TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN NOT NULL DEFAULT 0,
        read_at TIMESTAMP,
        parent_message_id INTEGER,
        FOREIGN KEY (sender_id) REFERENCES users(idUser) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(idUser) ON DELETE CASCADE,
        FOREIGN KEY (parent_message_id) REFERENCES messages(idMessage) ON DELETE CASCADE
      )`,

      // 27. FORUMS TABLE
      `CREATE TABLE IF NOT EXISTS forums (
        idForum INTEGER PRIMARY KEY AUTOINCREMENT,
        forum_name TEXT NOT NULL UNIQUE,
        description TEXT,
        idSubject INTEGER,
        created_by INTEGER,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'locked')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idSubject) REFERENCES subject(idSubject) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(idUser) ON DELETE SET NULL
      )`,

      // 28. FORUM_POSTS TABLE
      `CREATE TABLE IF NOT EXISTS forum_posts (
        idPost INTEGER PRIMARY KEY AUTOINCREMENT,
        idForum INTEGER NOT NULL,
        idUser INTEGER NOT NULL,
        post_title TEXT NOT NULL,
        post_content TEXT NOT NULL,
        is_pinned BOOLEAN DEFAULT 0,
        is_locked BOOLEAN DEFAULT 0,
        views_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idForum) REFERENCES forums(idForum) ON DELETE CASCADE,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
      )`,

      // 29. FORUM_COMMENTS TABLE
      `CREATE TABLE IF NOT EXISTS forum_comments (
        idComment INTEGER PRIMARY KEY AUTOINCREMENT,
        idPost INTEGER NOT NULL,
        idUser INTEGER NOT NULL,
        comment_content TEXT NOT NULL,
        parent_comment_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idPost) REFERENCES forum_posts(idPost) ON DELETE CASCADE,
        FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE,
        FOREIGN KEY (parent_comment_id) REFERENCES forum_comments(idComment) ON DELETE CASCADE
      )`,

      // 30. TAGS TABLE
      `CREATE TABLE IF NOT EXISTS tags (
        idTag INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_name TEXT UNIQUE NOT NULL,
        tag_color TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 31. LESSON_TAGS TABLE
      `CREATE TABLE IF NOT EXISTS lesson_tags (
        idLessonTag INTEGER PRIMARY KEY AUTOINCREMENT,
        idLesson INTEGER NOT NULL,
        idTag INTEGER NOT NULL,
        tagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idLesson) REFERENCES lessons(idLesson) ON DELETE CASCADE,
        FOREIGN KEY (idTag) REFERENCES tags(idTag) ON DELETE CASCADE,
        UNIQUE(idLesson, idTag)
      )`,

      // CREATE INDEXES for better performance
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
      `CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role)`,
      `CREATE INDEX IF NOT EXISTS idx_lessons_subject ON lessons(idSubject)`,
      `CREATE INDEX IF NOT EXISTS idx_lessons_grade ON lessons(idGrade)`,
      `CREATE INDEX IF NOT EXISTS idx_assessments_lesson ON assessments(idLesson)`,
      `CREATE INDEX IF NOT EXISTS idx_results_user ON results(idUser)`,
      `CREATE INDEX IF NOT EXISTS idx_results_assessment ON results(idAssessment)`,
      `CREATE INDEX IF NOT EXISTS idx_enrollment_user ON enrollment(idUser)`,
      `CREATE INDEX IF NOT EXISTS idx_enrollment_subject ON enrollment(idSubject)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(idUser)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(idUser)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(idUser)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_posts_forum ON forum_posts(idForum)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON forum_comments(idPost)`
    ];
  }

  /**
   * Insert default/seed data
   */
  async insertDefaultData() {
    console.log('📝 Inserting default data...');

    // Default grades
    const grades = [
      [1, 'Grade 1', 'First Grade - Ages 6-7'],
      [2, 'Grade 2', 'Second Grade - Ages 7-8'],
      [3, 'Grade 3', 'Third Grade - Ages 8-9'],
      [4, 'Grade 4', 'Fourth Grade - Ages 9-10'],
      [5, 'Grade 5', 'Fifth Grade - Ages 10-11'],
      [6, 'Grade 6', 'Sixth Grade - Ages 11-12'],
      [7, 'Grade 7', 'Seventh Grade - Ages 12-13'],
      [8, 'Grade 8', 'Eighth Grade - Ages 13-14'],
      [9, 'Grade 9', 'Ninth Grade - Ages 14-15'],
      [10, 'Grade 10', 'Tenth Grade - Ages 15-16'],
      [11, 'Grade 11', 'Eleventh Grade - Ages 16-17'],
      [12, 'Grade 12', 'Twelfth Grade - Ages 17-18']
    ];

    for (const [level, name, desc] of grades) {
      await this.runQuery(
        'INSERT OR IGNORE INTO grade (grade_level, grade_name, description) VALUES (?, ?, ?)',
        [level, name, desc]
      );
    }

    // Default admin user (password should be hashed in production)
    await this.runQuery(
      `INSERT OR IGNORE INTO users (username, email, password, first_name, last_name, user_role, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['admin', 'admin@school.com', 'admin123', 'System', 'Administrator', 'admin', 'active']
    );

    // Default subjects
    const subjects = [
      ['Mathematics', 'MATH', 'Core mathematics curriculum'],
      ['English Language', 'ENG', 'English language and literature'],
      ['Science', 'SCI', 'General science curriculum'],
      ['History', 'HIST', 'World and local history'],
      ['Geography', 'GEO', 'Physical and human geography'],
      ['Computer Science', 'CS', 'Programming and computer fundamentals']
    ];

    for (const [name, code, desc] of subjects) {
      await this.runQuery(
        'INSERT OR IGNORE INTO subject (subject_name, subject_code, description) VALUES (?, ?, ?)',
        [name, code, desc]
      );
    }

    // Default system settings
    const settings = [
      ['app_name', 'Online School Academy', 'string', 'Application name'],
      ['app_version', '1.0.0', 'string', 'Current version'],
      ['maintenance_mode', 'false', 'boolean', 'Maintenance mode flag'],
      ['max_login_attempts', '5', 'number', 'Maximum failed login attempts'],
      ['session_timeout', '3600', 'number', 'Session timeout in seconds']
    ];

    for (const [key, value, type, desc] of settings) {
      await this.runQuery(
        'INSERT OR IGNORE INTO settings (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, ?)',
        [key, value, type, desc]
      );
    }

    // Default badges
    const badges = [
      ['First Steps', 'Completed your first lesson', '🎯', 10],
      ['Quick Learner', 'Completed 10 lessons', '⚡', 50],
      ['Assessment Master', 'Scored 100% on 5 assessments', '🏆', 100],
      ['Streak Keeper', 'Logged in for 7 consecutive days', '🔥', 75],
      ['Perfect Score', 'Achieved perfect score on first attempt', '💯', 150]
    ];

    for (const [name, desc, icon, points] of badges) {
      await this.runQuery(
        'INSERT OR IGNORE INTO badges (badge_name, badge_description, badge_icon, points) VALUES (?, ?, ?, ?)',
        [name, desc, icon, points]
      );
    }

    console.log('✅ Default data inserted');
  }

  /**
   * Helper method to run SQL queries
   */
  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Query error:', err.message);
          console.error('SQL:', sql);
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  /**
   * Close database connection
   */
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else {
            console.log('🔒 Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Backup database
   */
  async backup() {
    try {
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}.db`);
      
      fs.copyFileSync(this.dbPath, backupPath);
      console.log(`✅ Database backed up to: ${backupPath}`);
      
      return backupPath;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  /**
   * Generate schema documentation
   */
  async generateSchemaDocs() {
    const tables = await this.getExistingTables();
    const docs = ['# Database Schema Documentation\n'];

    for (const table of tables) {
      if (table === 'sqlite_sequence') continue;

      const columns = await new Promise((resolve, reject) => {
        this.db.all(`PRAGMA table_info(${table})`, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      docs.push(`## ${table}`);
      docs.push('| Column | Type | Constraints |');
      docs.push('|--------|------|-------------|');

      for (const col of columns) {
        const constraints = [
          col.pk ? 'PRIMARY KEY' : '',
          col.notnull ? 'NOT NULL' : '',
          col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''
        ].filter(Boolean).join(', ');

        docs.push(`| ${col.name} | ${col.type} | ${constraints} |`);
      }

      docs.push('\n');
    }

    return docs.join('\n');
  }
}

// Export