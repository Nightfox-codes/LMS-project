-- ===============================================
-- LearnSphere LMS Database Schema
-- ===============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('student', 'instructor', 'admin')) DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    course_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(100),
    status VARCHAR(50) CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
    course_type VARCHAR(50) DEFAULT 'manual' CHECK (course_type IN ('manual', 'scorm')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modules Table (Course Sections)
CREATE TABLE IF NOT EXISTS modules (
    module_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
    lesson_id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text' CHECK (content_type IN ('text', 'video', 'pdf', 'quiz', 'link', 'scorm')),
    scorm_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materials Table (Lesson Resources)
CREATE TABLE IF NOT EXISTS materials (
    material_id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('pdf', 'text', 'video', 'link')),
    url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SCORM Packages Table
CREATE TABLE IF NOT EXISTS scorm_packages (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    entry_point VARCHAR(255) NOT NULL,
    version VARCHAR(50) DEFAULT 'scorm_1.2',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, lesson_id)
);

-- SCORM Progress Table (Current Status)
CREATE TABLE IF NOT EXISTS scorm_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    completion_status VARCHAR(50) DEFAULT 'incomplete',
    score NUMERIC(5,2) DEFAULT 0,
    suspend_data TEXT,
    last_accessed TIMESTAMP,
    last_attempt_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SCORM Attempts Table (All Attempts History)
CREATE TABLE IF NOT EXISTS scorm_attempts (
    attempt_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    score NUMERIC(5,2),
    completion_status VARCHAR(50) DEFAULT 'incomplete',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed TIMESTAMP,
    suspend_data TEXT,
    lesson_location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SCORM Settings Table (Rules & Grading)
CREATE TABLE IF NOT EXISTS scorm_settings (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    max_attempts INTEGER,
    force_new_attempt BOOLEAN DEFAULT FALSE,
    lock_after_final BOOLEAN DEFAULT FALSE,
    grading_method VARCHAR(50) DEFAULT 'highest' CHECK (grading_method IN ('highest', 'average', 'first', 'last')),
    passing_score NUMERIC(5,2) DEFAULT 40.0,
    time_limit INTEGER,  -- in minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, lesson_id)
);

-- Instructor Data Table
CREATE TABLE IF NOT EXISTS instructor_dt (
    id SERIAL PRIMARY KEY,
    temp_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- Indexes for Better Performance
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_scorm_progress_user_id ON scorm_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_scorm_progress_course_id ON scorm_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_scorm_attempts_user_id ON scorm_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_scorm_attempts_course_id ON scorm_attempts(course_id);
