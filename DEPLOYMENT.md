# Hisaab Portal - GoDaddy Deployment Guide

This guide will walk you through deploying the Hisaab Portal on GoDaddy cPanel hosting.

## Prerequisites

- GoDaddy cPanel hosting account with:
  - PHP 7.4 or higher
  - MySQL 5.7 or higher
  - At least 100MB disk space
- FTP client (FileZilla recommended) or use cPanel File Manager
- Text editor for configuration files

## Step-by-Step Deployment

### Step 1: Prepare Your Files

1. Download all files from the repository
2. Open `config/database.php` in a text editor
3. Keep it handy - you'll update it with database credentials later

### Step 2: Create MySQL Database

1. Log in to your GoDaddy cPanel
2. Navigate to **Databases** → **MySQL Databases**
3. Create a new database:
   - Database Name: `hisaab_db` (Note: GoDaddy may prefix this with your username)
   - Click "Create Database"
4. Create a database user:
   - Username: `hisaab_user`
   - Password: Generate a strong password (save this!)
   - Click "Create User"
5. Add user to database:
   - Select the database you created
   - Select the user you created
   - Check "ALL PRIVILEGES"
   - Click "Add"
6. **Write down** your complete database name, username, and password

### Step 3: Upload Files

#### Option A: Using cPanel File Manager (Easier)

1. In cPanel, go to **Files** → **File Manager**
2. Navigate to `public_html` directory
3. If you want the portal at the root domain:
   - Upload all files directly to `public_html`
4. If you want it in a subdirectory (e.g., yourdomain.com/hisaab):
   - Create a folder named `hisaab` in `public_html`
   - Upload all files to this folder
5. Click "Upload" and select all portal files
6. Wait for upload to complete

#### Option B: Using FTP Client

1. Open FileZilla or your FTP client
2. Connect using your cPanel FTP credentials:
   - Host: ftp.yourdomain.com (or IP address)
   - Username: Your cPanel username
   - Password: Your cPanel password
   - Port: 21
3. Navigate to `public_html` directory
4. Upload all portal files to the appropriate location

### Step 4: Configure Database Connection

1. In File Manager, navigate to your uploaded files
2. Open `config/database.php`
3. Click "Edit" (right-click → Edit)
4. Update the following lines with your database info:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'yourusername_hisaab_db');  // Your actual database name
   define('DB_USER', 'yourusername_hisaab_user'); // Your actual username
   define('DB_PASS', 'your_password_here');       // Your database password
   ```
5. Save the file

### Step 5: Update Site URL

1. Open `config/config.php`
2. Update the SITE_URL:
   ```php
   define('SITE_URL', 'https://yourdomain.com');
   // OR if in subdirectory:
   define('SITE_URL', 'https://yourdomain.com/hisaab');
   ```
3. Save the file

### Step 6: Set Correct File Permissions

1. In File Manager, select all PHP files
2. Right-click → "Change Permissions"
3. Set to 644 (rw-r--r--)
4. For directories, set to 755 (rwxr-xr-x)
5. Ensure `config` directory and files are NOT publicly accessible (already handled by .htaccess)

### Step 7: Run Installation

1. Open your web browser
2. Navigate to: `https://yourdomain.com/install.php`
   (or `https://yourdomain.com/hisaab/install.php` if in subdirectory)
3. The installation script will:
   - Create all necessary database tables
   - Set up the default admin account
   - Initialize WhatsApp configuration
4. You should see "Installation Successful" message
5. **IMPORTANT**: Delete `install.php` immediately after successful installation for security

### Step 8: First Login

1. Navigate to: `https://yourdomain.com/login.php`
2. Default credentials:
   - Mobile: `9999999999`
   - Password: `admin123`
3. **IMMEDIATELY change the password** (feature to be added) or update directly in database:
   ```sql
   UPDATE admins SET password = PASSWORD_HASH('your_new_password', PASSWORD_DEFAULT) WHERE mobile = '9999999999';
   ```

### Step 9: Configure WhatsApp Integration (Optional)

1. Sign up for WhatsApp Business API:
   - Visit https://business.whatsapp.com
   - Create a Facebook Business account
   - Set up WhatsApp Business API
   - Get your Phone Number ID and Access Token

2. In the portal, navigate to **WhatsApp Settings**
3. Enter your credentials:
   - Phone Number ID
   - Access Token
4. Enable WhatsApp Integration
5. Send a test message to verify

## Post-Deployment Checklist

- [ ] Database connection working
- [ ] Can log in successfully
- [ ] Changed default admin password
- [ ] Deleted `install.php`
- [ ] Verified HTTPS is working
- [ ] Created first site
- [ ] Created first branch
- [ ] Created first agent
- [ ] Tested balance editing
- [ ] Tested WhatsApp integration (if configured)
- [ ] Set up regular database backups

## Security Best Practices

### 1. Enable HTTPS

GoDaddy usually provides free SSL certificates:
1. In cPanel, go to **Security** → **SSL/TLS Status**
2. Find your domain and click "Run AutoSSL"
3. Wait for certificate to be issued
4. Force HTTPS by uncommenting these lines in `.htaccess`:
   ```apache
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

### 2. Change Admin Password

Run this SQL in cPanel → phpMyAdmin:
```sql
UPDATE admins 
SET password = '$2y$10$YourNewHashedPasswordHere' 
WHERE mobile = '9999999999';
```

Or create a new password change page (recommended).

### 3. Database Backups

Set up automatic backups in cPanel:
1. Go to **Files** → **Backup**
2. Enable automatic backups
3. Schedule weekly database backups
4. Download and store backups securely

### 4. File Permissions

Ensure these are set correctly:
- `.htaccess`: 644
- `config/*.php`: 644 (but not directly accessible via .htaccess rules)
- All `.php` files: 644
- All directories: 755

### 5. Hide Error Messages

In production, hide PHP errors:
1. In cPanel, go to **Software** → **Select PHP Version**
2. Click "Options"
3. Set `display_errors` to "Off"
4. Set `log_errors` to "On"

## Troubleshooting

### Database Connection Errors

**Error**: "Database connection failed"

**Solution**:
1. Verify database credentials in `config/database.php`
2. Check database name includes username prefix
3. Ensure database user has ALL PRIVILEGES
4. Verify MySQL is running in cPanel

### 500 Internal Server Error

**Solution**:
1. Check `.htaccess` syntax
2. Verify PHP version is 7.4+
3. Check file permissions (644 for files, 755 for directories)
4. Review error logs in cPanel → Metrics → Errors

### Page Not Found / 404 Errors

**Solution**:
1. Verify `SITE_URL` in `config/config.php` matches your actual URL
2. Check `.htaccess` is uploaded and active
3. Ensure mod_rewrite is enabled (usually default on GoDaddy)

### WhatsApp Messages Not Sending

**Solution**:
1. Verify WhatsApp Business API credentials
2. Check phone numbers are in correct format (include country code)
3. Ensure access token has messaging permissions
4. Review API error messages in browser console
5. Check WhatsApp Business account status

### Session Errors

**Solution**:
1. Ensure `session_start()` is working
2. Check PHP session configuration in cPanel
3. Verify `/tmp` directory has write permissions

## Performance Optimization

### 1. Enable Caching

Add to `.htaccess`:
```apache
# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
</IfModule>
```

### 2. Enable Compression

Add to `.htaccess`:
```apache
# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript
</IfModule>
```

### 3. Database Optimization

1. In phpMyAdmin, run "Optimize table" monthly
2. Add indexes to frequently queried columns
3. Clean up old test data regularly

## Updating the Application

1. **Backup first**: Download current files and database
2. Upload new files via FTP/File Manager
3. Overwrite existing files
4. Clear browser cache
5. Test all functionality

## Getting Help

If you encounter issues:

1. Check PHP error logs in cPanel
2. Check browser console for JavaScript errors
3. Review database connection settings
4. Verify file permissions
5. Contact GoDaddy support for hosting-related issues

## Maintenance Schedule

**Weekly**:
- Review and update balances
- Check WhatsApp message logs
- Backup database

**Monthly**:
- Optimize database tables
- Review and clean test data
- Update PHP/MySQL if needed
- Check SSL certificate status

**Quarterly**:
- Review security settings
- Update admin password
- Audit user accounts and permissions

## Contact & Support

For technical support with the Hisaab Portal application, refer to the main README.md file or contact your administrator.

For GoDaddy hosting support, visit: https://www.godaddy.com/help

---

**Last Updated**: October 2024
**Version**: 1.0
