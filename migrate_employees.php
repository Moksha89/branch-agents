<?php

require_once 'config/database.php';

$queries = [
    "CREATE TABLE IF NOT EXISTS employees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(15) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    
    "CREATE TABLE IF NOT EXISTS employee_site_access (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT NOT NULL,
        site_id INT NOT NULL,
        access_type ENUM('all_branches', 'limited_branches') NOT NULL DEFAULT 'all_branches',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
        UNIQUE KEY unique_employee_site (employee_id, site_id)
    )",
    
    "CREATE TABLE IF NOT EXISTS employee_branch_access (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT NOT NULL,
        branch_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
        UNIQUE KEY unique_employee_branch (employee_id, branch_id)
    )",
    
    "CREATE TABLE IF NOT EXISTS employee_module_access (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT NOT NULL,
        module_name VARCHAR(50) NOT NULL,
        access_level ENUM('read', 'full') NOT NULL DEFAULT 'read',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE KEY unique_employee_module (employee_id, module_name)
    )"
];

try {
    foreach ($queries as $query) {
        $pdo->exec($query);
    }
    
    echo "<!DOCTYPE html>
    <html>
    <head>
        <title>Employee Module Migration Success</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 100px auto;
                padding: 20px;
                background: #f5f5f5;
            }
            .success-box {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #28a745;
            }
            .info {
                background: #e7f3ff;
                padding: 15px;
                border-left: 4px solid #007bff;
                margin: 20px 0;
            }
            ul {
                margin: 10px 0;
            }
            li {
                margin: 5px 0;
            }
        </style>
    </head>
    <body>
        <div class='success-box'>
            <h1>✓ Employee Module Migration Successful!</h1>
            <p>The following tables have been created:</p>
            
            <div class='info'>
                <h3>New Database Tables:</h3>
                <ul>
                    <li><strong>employees</strong> - Store employee information (name, mobile, password)</li>
                    <li><strong>employee_site_access</strong> - Control which sites employees can access</li>
                    <li><strong>employee_branch_access</strong> - Control specific branch access when using limited_branches mode</li>
                    <li><strong>employee_module_access</strong> - Control module-level permissions (read/full access)</li>
                </ul>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>Employees can now be created through the admin portal</li>
                <li>Access control is enforced at site, branch, and module levels</li>
                <li>Employees can have read-only or full access to each module</li>
            </ul>
        </div>
    </body>
    </html>";
    
} catch (PDOException $e) {
    echo "<!DOCTYPE html>
    <html>
    <head>
        <title>Migration Error</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 100px auto;
                padding: 20px;
                background: #f5f5f5;
            }
            .error-box {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #dc3545;
            }
            .error {
                background: #f8d7da;
                padding: 15px;
                border-left: 4px solid #dc3545;
                margin: 20px 0;
                color: #721c24;
            }
        </style>
    </head>
    <body>
        <div class='error-box'>
            <h1>✗ Migration Failed</h1>
            <div class='error'>
                <strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "
            </div>
            <p>Please check the error and try again.</p>
        </div>
    </body>
    </html>";
}
