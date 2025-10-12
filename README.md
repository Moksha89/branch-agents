# Hisaab Portal

A comprehensive agent and branch management system for tracking betting/booking operations across multiple sites.

## Features

- **Admin Authentication**: Mobile number & password login
- **Sites Management**: Create and manage multiple betting sites
- **Branches Management**: Create branches under sites with balance tracking
- **Agents Management**: Manage agents with multiple phone numbers
- **Agent-Branch Assignment**: Flexible many-to-many relationship
- **Automated WhatsApp Reports**: Send individual agent reports directly to WhatsApp
- **Real-time Updates**: Live balance updates and changes
- **Comprehensive Reporting**: View totals, balances, and generate reports

## Technology Stack

- **Backend**: PHP 7.4+
- **Database**: MySQL 5.7+
- **Frontend**: HTML5, CSS3, JavaScript (jQuery)
- **WhatsApp Integration**: WhatsApp Business Cloud API

## Installation on GoDaddy Hosting

### Prerequisites
- GoDaddy cPanel hosting account
- MySQL database
- PHP 7.4 or higher

### Steps

1. **Upload Files**
   - Upload all files to your `public_html` directory via FTP or File Manager

2. **Create Database**
   - Go to cPanel → MySQL Databases
   - Create a new database (e.g., `your_user_hisaab`)
   - Create a database user and password
   - Add user to database with ALL PRIVILEGES

3. **Configure Database**
   - Edit `config/database.php` with your database credentials:
     ```php
     define('DB_HOST', 'localhost');
     define('DB_NAME', 'your_database_name');
     define('DB_USER', 'your_database_user');
     define('DB_PASS', 'your_database_password');
     ```

4. **Initialize Database**
   - Access `http://yourdomain.com/install.php` in your browser
   - This will create all necessary tables
   - **Delete install.php after installation for security**

5. **Configure WhatsApp**
   - Sign up for WhatsApp Business API at https://business.whatsapp.com
   - Get your API credentials
   - Edit `config/whatsapp.php` with your credentials

6. **Default Admin Login**
   - Mobile: `9999999999`
   - Password: `admin123`
   - **Change this immediately after first login**

## Security Notes

- Always use HTTPS in production
- Change default admin credentials
- Delete install.php after setup
- Keep your database credentials secure
- Regularly backup your database

## Usage

### Sites Module
1. Navigate to Sites → Create Site
2. Add site name and save
3. View all sites in the Sites list

### Branches Module
1. Navigate to Branches → Create Branch
2. Select site, enter branch code and initial balance
3. Assign agents to branch
4. View branch details and balances

### Agents Module
1. Navigate to Agents → Create Agent
2. Enter agent name and mobile numbers (comma-separated)
3. Assign branches to agent
4. View agent's assigned branches and total balance

### Reports
1. Navigate to Reports
2. View all agents with their branches and balances
3. Use "Send to WhatsApp" to automatically send reports to agents

## Database Schema

- **admins**: Admin user credentials
- **sites**: Betting sites/books
- **branches**: Branches under sites
- **agents**: Agent information
- **agent_phones**: Agent phone numbers
- **agent_branches**: Agent-branch assignments
- **whatsapp_config**: WhatsApp API configuration

## Support

For issues or questions, contact the administrator.

## License

Proprietary - All rights reserved
