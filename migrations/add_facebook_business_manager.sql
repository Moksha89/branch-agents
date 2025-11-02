ALTER TABLE whatsapp_config
ADD COLUMN session_token VARCHAR(500) COMMENT 'Session Token (for Web API only)' AFTER is_active,
ADD COLUMN api_type ENUM('web', 'business') DEFAULT 'web' COMMENT 'Authentication method: web or business' AFTER session_token,
ADD COLUMN facebook_app_id VARCHAR(255) COMMENT 'Facebook App ID for Business API' AFTER api_type,
ADD COLUMN facebook_app_secret VARCHAR(255) COMMENT 'Facebook App Secret for Business API' AFTER facebook_app_id;

ALTER TABLE whatsapp_config 
MODIFY COLUMN phone_number_id VARCHAR(255) COMMENT 'WhatsApp Business API Phone Number ID (for Business API only)',
MODIFY COLUMN access_token VARCHAR(500) COMMENT 'Facebook Access Token (for Business API only)';
