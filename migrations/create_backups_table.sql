
CREATE TABLE IF NOT EXISTS backups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp INT NOT NULL COMMENT 'Unix timestamp when backup was created',
    file_url VARCHAR(255) NOT NULL COMMENT 'Backup filename',
    created_by INT COMMENT 'Admin ID who created the backup',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
