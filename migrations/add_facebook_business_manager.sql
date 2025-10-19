ALTER TABLE whatsapp_config
ADD COLUMN IF NOT EXISTS api_type ENUM('web', 'business') DEFAULT 'web' AFTER session_token,
ADD COLUMN IF NOT EXISTS facebook_app_id VARCHAR(255) AFTER api_type,
ADD COLUMN IF NOT EXISTS facebook_app_secret VARCHAR(255) AFTER facebook_app_id;

ALTER TABLE whatsapp_config 
MODIFY COLUMN phone_number_id VARCHAR(255) COMMENT 'WhatsApp Business API Phone Number ID (for Business API only)',
MODIFY COLUMN access_token VARCHAR(500) COMMENT 'Facebook Access Token (for Business API only)',
MODIFY COLUMN session_token VARCHAR(500) COMMENT 'Session Token (for Web API only)';
