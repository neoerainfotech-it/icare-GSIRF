CREATE DATABASE IF NOT EXISTS u846163676_icare_GSIRF;
USE u846163676_icare_GSIRF;

-- 1. INSTITUTES TABLE
-- Maps perfectly to loadInstitutes() tracking columns
CREATE TABLE IF NOT EXISTS institutes (
    id VARCHAR(36) PRIMARY KEY, -- Supports text UUID checks used by the frontend
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. OVERALL SUBMISSIONS TABLE
-- Maps perfectly to loadSubmissions() and Excel structural exports
CREATE TABLE IF NOT EXISTS gsirf_submissions (
    id VARCHAR(36) PRIMARY KEY,
    institute_id VARCHAR(36) NOT NULL,
    institute_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    gsirf_id VARCHAR(50) DEFAULT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'draft') DEFAULT 'pending',
    form_data JSON NOT NULL, -- Stores all changing form response inputs effortlessly
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
);

-- 3. CATEGORY SUBMISSIONS TABLE
-- Maps to window._catMap array structures and dynamic category filters
CREATE TABLE IF NOT EXISTS gsirf_category_submissions (
    id VARCHAR(36) PRIMARY KEY,
    institute_id VARCHAR(36) NOT NULL,
    category VARCHAR(50) NOT NULL,
    data JSON NOT NULL, -- Houses the array key configuration: {"_faculty_ids": ["uuid1", "uuid2"]}
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
);

-- 4. FACULTY SYSTEM REFERENCE TABLE
-- Relies on the SheetJS loop engine mapping structural outputs
CREATE TABLE IF NOT EXISTS gsirf_faculty (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    designation VARCHAR(100),
    highest_degree VARCHAR(100),
    teaching_exp INT DEFAULT 0, -- Tracked in integer months
    industry_exp INT DEFAULT 0,  -- Tracked in integer months
    working VARCHAR(10) DEFAULT 'Yes',
    association VARCHAR(50),
    date_of_joining DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. INSERT SEED MASTER RECORDS
-- Inserts a fallback safeguard entity to avoid account removal errors
INSERT INTO institutes (id, name, username, password, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'System Master Administrator', 'superadmin', 'securemaster2026', 1)
ON DUPLICATE KEY UPDATE name=name;