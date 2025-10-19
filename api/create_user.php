<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');
requireLogin();

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Only admins can create users']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $name = trim($_POST['name']);
    $mobile = trim($_POST['mobile']);
    $username = trim($_POST['username']);
    $password = $_POST['password'];
    $role = $_POST['role'];
    $deviceLimit = intval($_POST['device_limit'] ?? 1);
    $expiryDate = $_POST['expiry_date'] ?? null;
    $otpEnabled = isset($_POST['otp_auth_enabled']) ? 1 : 0;
    $employeeTab = isset($_POST['employee_tab']) ? 1 : 0;
    $backupTab = isset($_POST['backup_tab']) ? 1 : 0;
    
    if (empty($name) || empty($mobile) || empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'error' => 'All required fields must be filled']);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM admins WHERE mobile = ? OR username = ?");
    $stmt->execute([$mobile, $username]);
    if ($stmt->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'error' => 'Mobile or username already exists']);
        exit;
    }
    
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    $isAdmin = $role === 'admin' ? 1 : 0;
    $isManager = $role === 'manager' ? 1 : 0;
    $isEmployee = $role === 'employee' ? 1 : 0;
    $hasAdminPrivileges = $role === 'admin' ? 1 : 0;
    
    $stmt = $pdo->prepare("
        INSERT INTO admins (
            name, mobile, username, password, 
            has_admin_privileges, is_manager, is_employee,
            device_limit, expiry_date, otp_auth_enabled,
            employee_tab, backup_tab
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $name, $mobile, $username, $hashedPassword,
        $hasAdminPrivileges, $isManager, $isEmployee,
        $deviceLimit, $expiryDate, $otpEnabled,
        $employeeTab, $backupTab
    ]);
    
    $userId = $pdo->lastInsertId();
    
    if ($role !== 'admin' && isset($_POST['sites'])) {
        $sites = $_POST['sites'];
        foreach ($sites as $siteId) {
            $accessLevel = $_POST['access_level_' . $siteId] ?? 'read';
            $stmt = $pdo->prepare("
                INSERT INTO user_company_access (user_id, site_id, access_level) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$userId, $siteId, $accessLevel]);
        }
    }
    
    echo json_encode(['success' => true, 'message' => 'User created successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
