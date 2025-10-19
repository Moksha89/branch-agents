

ALTER TABLE sites ADD COLUMN IF NOT EXISTS company_id VARCHAR(255) UNIQUE AFTER id;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS still_active INT(5) DEFAULT 1 AFTER name;
UPDATE sites SET company_id = UUID() WHERE company_id IS NULL;

ALTER TABLE agents ADD COLUMN IF NOT EXISTS uuid VARCHAR(200) UNIQUE AFTER id;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS still_active INT(5) DEFAULT 1 AFTER balance;
UPDATE agents SET uuid = UUID() WHERE uuid IS NULL;
UPDATE agents SET still_active = 1 WHERE still_active IS NULL;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(200) AFTER id;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS name_id VARCHAR(200) COMMENT 'sender partner uuid' AFTER sender_id;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS product_id VARCHAR(200) COMMENT 'receiver partner uuid' AFTER receiver_id;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS coins VARCHAR(50) AFTER amount;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS rate VARCHAR(50) DEFAULT '1' AFTER coins;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS name_opening_balance VARCHAR(50) DEFAULT '0' AFTER rate;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS name_closing_balance VARCHAR(50) DEFAULT '0' AFTER name_opening_balance;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS product_opening_balance VARCHAR(50) DEFAULT '0' AFTER name_closing_balance;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS product_closing_balance VARCHAR(50) DEFAULT '0' AFTER product_opening_balance;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS timestamp VARCHAR(50) AFTER transaction_date;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS modified INT(5) DEFAULT 0 AFTER remarks;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted INT(5) DEFAULT 0 AFTER modified;

UPDATE transactions t
LEFT JOIN agents sender ON t.sender_id = sender.id
LEFT JOIN agents receiver ON t.receiver_id = receiver.id
SET 
  t.transaction_id = CONCAT('txn_', UNIX_TIMESTAMP(), '_', t.id),
  t.name_id = COALESCE(sender.uuid, ''),
  t.product_id = COALESCE(receiver.uuid, ''),
  t.coins = CAST(COALESCE(t.amount, 0) AS CHAR),
  t.rate = '1',
  t.timestamp = CAST(UNIX_TIMESTAMP(t.transaction_date) AS CHAR),
  t.name_opening_balance = '0',
  t.name_closing_balance = '0',
  t.product_opening_balance = '0',
  t.product_closing_balance = '0'
WHERE t.transaction_id IS NULL OR t.transaction_id = '';

ALTER TABLE admins ADD COLUMN IF NOT EXISTS user_id VARCHAR(200) AFTER id;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS username VARCHAR(200) AFTER email;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'India' AFTER password;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS country_code VARCHAR(6) DEFAULT '+91' AFTER country;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS otp_auth_enabled INT(5) DEFAULT 0 AFTER country_code;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS has_admin_priviledges INT(5) DEFAULT 1 AFTER otp_auth_enabled;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(255) AFTER has_admin_priviledges;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_admin INT(5) DEFAULT 1 AFTER profile_photo;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_employee INT(5) DEFAULT 0 AFTER is_admin;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_manager INT(11) DEFAULT 0 AFTER is_employee;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS companies_acess TEXT AFTER is_manager;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS employee_tab INT(11) DEFAULT 0 AFTER companies_acess;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS backup_tab INT(11) DEFAULT 0 AFTER employee_tab;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_superadmin INT(11) DEFAULT 0 AFTER backup_tab;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS first_device_id TEXT AFTER is_superadmin;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS divice_limit INT(11) DEFAULT 0 AFTER first_device_id;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS expiry_date DATE AFTER divice_limit;

UPDATE admins SET 
  username = COALESCE(username, mobile),
  user_id = COALESCE(user_id, CONCAT('user_', id)),
  is_admin = COALESCE(is_admin, 1),
  has_admin_priviledges = COALESCE(has_admin_priviledges, 1)
WHERE user_id IS NULL OR username IS NULL;

CREATE TABLE IF NOT EXISTS user_company_access (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  user_id INT(5) NOT NULL,
  company_id INT(5) NOT NULL,
  access_level ENUM('read', 'full') NOT NULL DEFAULT 'read',
  KEY user_id (user_id),
  KEY company_id (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS backup_emails (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  email TEXT NOT NULL,
  date_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS otp (
  id INT(50) AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(200) NOT NULL,
  otp INT(10) NOT NULL,
  timestamp INT(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS logo (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  logo TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS website_title (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  title TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

INSERT INTO website_title (title) 
SELECT 'Hisaab Portal' 
WHERE NOT EXISTS (SELECT 1 FROM website_title LIMIT 1);

CREATE INDEX IF NOT EXISTS idx_transactions_name_id ON transactions(name_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted ON transactions(deleted);
CREATE INDEX IF NOT EXISTS idx_agents_uuid ON agents(uuid);
CREATE INDEX IF NOT EXISTS idx_sites_company_id ON sites(company_id);

SELECT 'Maibook database integration completed successfully!' as message;
