<?php

session_start();

// Auto-detect site URL based on environment
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
define('SITE_URL', $protocol . '://' . $host);
define('SITE_NAME', 'Hisaab Portal');

date_default_timezone_set('Asia/Kolkata');

function isLoggedIn() {
    return isset($_SESSION['admin_id']) || isset($_SESSION['employee_id']);
}

function isAdmin() {
    return isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'admin';
}

function isEmployee() {
    return isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'employee';
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: ' . SITE_URL . '/login.php');
        exit;
    }
}

function requireAdmin() {
    requireLogin();
    if (!isAdmin()) {
        header('Location: ' . SITE_URL . '/dashboard.php');
        exit;
    }
}

function loadEmployeePermissions($employee_id) {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT site_id, access_type FROM employee_site_access WHERE employee_id = ?");
    $stmt->execute([$employee_id]);
    $_SESSION['employee_sites'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("SELECT branch_id FROM employee_branch_access WHERE employee_id = ?");
    $stmt->execute([$employee_id]);
    $_SESSION['employee_branches'] = array_column($stmt->fetchAll(), 'branch_id');
    
    $stmt = $pdo->prepare("SELECT module_name, access_level FROM employee_module_access WHERE employee_id = ?");
    $stmt->execute([$employee_id]);
    $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $_SESSION['employee_modules'] = [];
    foreach ($modules as $module) {
        $_SESSION['employee_modules'][$module['module_name']] = $module['access_level'];
    }
}

function hasModuleAccess($module_name) {
    if (isAdmin()) return true;
    if (!isEmployee()) return false;
    return isset($_SESSION['employee_modules'][$module_name]);
}

function hasFullAccess($module_name) {
    if (isAdmin()) return true;
    if (!isEmployee()) return false;
    return isset($_SESSION['employee_modules'][$module_name]) && 
           $_SESSION['employee_modules'][$module_name] === 'full';
}

function getAccessibleSiteIds() {
    if (isAdmin()) {
        global $pdo;
        $stmt = $pdo->query("SELECT id FROM sites");
        return array_column($stmt->fetchAll(), 'id');
    }
    if (!isEmployee()) return [];
    return array_column($_SESSION['employee_sites'] ?? [], 'site_id');
}

function getAccessibleBranchIds() {
    global $pdo;
    if (isAdmin()) {
        $stmt = $pdo->query("SELECT id FROM branches");
        return array_column($stmt->fetchAll(), 'id');
    }
    if (!isEmployee()) return [];
    
    $accessible_branches = [];
    foreach ($_SESSION['employee_sites'] ?? [] as $site_access) {
        if ($site_access['access_type'] === 'all_branches') {
            $stmt = $pdo->prepare("SELECT id FROM branches WHERE site_id = ?");
            $stmt->execute([$site_access['site_id']]);
            $accessible_branches = array_merge($accessible_branches, array_column($stmt->fetchAll(), 'id'));
        } else {
            $accessible_branches = array_merge($accessible_branches, $_SESSION['employee_branches'] ?? []);
        }
    }
    return array_unique($accessible_branches);
}

function canAccessSite($site_id) {
    if (isAdmin()) return true;
    return in_array($site_id, getAccessibleSiteIds());
}

function canAccessBranch($branch_id) {
    if (isAdmin()) return true;
    return in_array($branch_id, getAccessibleBranchIds());
}

function redirect($url) {
    header('Location: ' . $url);
    exit;
}

function encryptBackupData($data) {
    $key = hash('sha256', DB_PASS . SITE_URL, true);
    $iv = openssl_random_pseudo_bytes(16);
    $encrypted = openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv);
    return base64_encode($iv . $encrypted);
}

function decryptBackupData($data) {
    $key = hash('sha256', DB_PASS . SITE_URL, true);
    $data = base64_decode($data);
    $iv = substr($data, 0, 16);
    $encrypted = substr($data, 16);
    return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
}

function formatCurrency($amount) {
    return '₹' . number_format($amount, 2);
}

function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}
