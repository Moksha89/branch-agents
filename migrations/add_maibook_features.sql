
ALTER TABLE sites ADD COLUMN IF NOT EXISTS site_uuid VARCHAR(50) UNIQUE AFTER id;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS still_active TINYINT(1) DEFAULT 1 AFTER name;

UPDATE sites SET site_uuid = UUID() WHERE site_uuid IS NULL;

ALTER TABLE agents ADD COLUMN IF NOT EXISTS uuid VARCHAR(36) UNIQUE AFTER id;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS still_active TINYINT(1) DEFAULT 1 AFTER status;

UPDATE agents SET uuid = UUID() WHERE uuid IS NULL;
UPDATE agents SET still_active = IF(status = 'active', 1, 0) WHERE still_active IS NULL;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_code VARCHAR(50) UNIQUE AFTER id;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS coins DECIMAL(15,2) AFTER amount;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS rate DECIMAL(10,5) DEFAULT 1.0 AFTER coins;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_opening_balance DECIMAL(15,2) AFTER rate;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_closing_balance DECIMAL(15,2) AFTER sender_opening_balance;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receiver_opening_balance DECIMAL(15,2) AFTER sender_closing_balance;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receiver_closing_balance DECIMAL(15,2) AFTER receiver_opening_balance;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS modified TINYINT(1) DEFAULT 0 AFTER remarks;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0 AFTER modified;

UPDATE transactions SET 
  transaction_code = CONCAT('TXN', LPAD(id, 8, '0')),
  coins = amount,
  rate = 1.0,
  sender_opening_balance = 0,
  sender_closing_balance = 0,
  receiver_opening_balance = 0,
  receiver_closing_balance = 0
WHERE transaction_code IS NULL;

ALTER TABLE admins ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE AFTER mobile;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_manager TINYINT(1) DEFAULT 0 AFTER password;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_employee TINYINT(1) DEFAULT 0 AFTER is_manager;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS otp_auth_enabled TINYINT(1) DEFAULT 0 AFTER is_employee;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS has_admin_privileges TINYINT(1) DEFAULT 1 AFTER otp_auth_enabled;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS employee_tab TINYINT(1) DEFAULT 0 AFTER has_admin_privileges;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS backup_tab TINYINT(1) DEFAULT 0 AFTER employee_tab;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS device_limit INT DEFAULT 1 AFTER backup_tab;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS first_device_id VARCHAR(255) AFTER device_limit;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS expiry_date DATE AFTER first_device_id;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS country VARCHAR(100) AFTER expiry_date;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) AFTER country;

UPDATE admins SET username = mobile WHERE username IS NULL;

CREATE TABLE IF NOT EXISTS user_company_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  site_id INT NOT NULL,
  access_level ENUM('full', 'read') DEFAULT 'read',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES admins(id) ON DELETE CASCADE,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_site (user_id, site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS backup_emails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  attempts INT DEFAULT 0,
  used TINYINT(1) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS website_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  logo_path VARCHAR(255),
  website_title VARCHAR(255) DEFAULT 'Hisaab Portal',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO website_settings (website_title) 
SELECT 'Hisaab Portal' 
WHERE NOT EXISTS (SELECT 1 FROM website_settings LIMIT 1);

SELECT 'Maibook features migration completed successfully!' as message;
