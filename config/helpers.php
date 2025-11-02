<?php

function recalculateBalance($agentId) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT 
            t.id,
            t.sender_id,
            t.receiver_id,
            t.coins,
            t.rate,
            t.deleted
        FROM transactions t
        WHERE (t.sender_id = ? OR t.receiver_id = ?) 
          AND t.deleted = 0
        ORDER BY t.transaction_date ASC, t.id ASC
    ");
    $stmt->execute([$agentId, $agentId]);
    $transactions = $stmt->fetchAll();
    
    $balance = 0;
    foreach ($transactions as $trans) {
        $amount = $trans['coins'] * $trans['rate'];
        
        if ($trans['sender_id'] == $agentId) {
            $balance -= $amount;
        }
        if ($trans['receiver_id'] == $agentId) {
            $balance += $amount;
        }
    }
    
    $stmt = $pdo->prepare("UPDATE agents SET balance = ? WHERE id = ?");
    $stmt->execute([round($balance, 2), $agentId]);
    
    return round($balance, 2);
}

function recalculateBranchBalance($branchId) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT 
            t.id,
            t.sender_id,
            t.receiver_id,
            t.branch_id,
            t.coins,
            t.rate,
            t.deleted
        FROM transactions t
        WHERE t.branch_id = ? AND t.deleted = 0
        ORDER BY t.transaction_date ASC, t.id ASC
    ");
    $stmt->execute([$branchId]);
    $transactions = $stmt->fetchAll();
    
    $balance = 0;
    foreach ($transactions as $trans) {
        $amount = $trans['coins'] * $trans['rate'];
        $balance += $amount;
    }
    
    $stmt = $pdo->prepare("UPDATE branches SET balance = ? WHERE id = ?");
    $stmt->execute([round($balance, 2), $branchId]);
    
    return round($balance, 2);
}

function hasCompanyAccess($userId, $siteId, $requiredLevel = 'read') {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT has_admin_privileges FROM admins WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) return false;
    if ($user['has_admin_privileges']) return true;
    
    $stmt = $pdo->prepare("
        SELECT access_level FROM user_company_access 
        WHERE user_id = ? AND site_id = ?
    ");
    $stmt->execute([$userId, $siteId]);
    $access = $stmt->fetch();
    
    if (!$access) return false;
    
    if ($requiredLevel === 'full') {
        return $access['access_level'] === 'full';
    }
    
    return true;
}

function isManager() {
    if (!isset($_SESSION['admin_id'])) return false;
    global $pdo;
    $stmt = $pdo->prepare("SELECT is_manager, has_admin_privileges FROM admins WHERE id = ?");
    $stmt->execute([$_SESSION['admin_id']]);
    $user = $stmt->fetch();
    return $user && ($user['is_manager'] || $user['has_admin_privileges']);
}

function hasEmployeeTabAccess() {
    if (!isset($_SESSION['admin_id'])) return false;
    global $pdo;
    $stmt = $pdo->prepare("SELECT employee_tab, has_admin_privileges FROM admins WHERE id = ?");
    $stmt->execute([$_SESSION['admin_id']]);
    $user = $stmt->fetch();
    return $user && ($user['employee_tab'] || $user['has_admin_privileges']);
}

function hasBackupTabAccess() {
    if (!isset($_SESSION['admin_id'])) return false;
    global $pdo;
    $stmt = $pdo->prepare("SELECT backup_tab, has_admin_privileges FROM admins WHERE id = ?");
    $stmt->execute([$_SESSION['admin_id']]);
    $user = $stmt->fetch();
    return $user && ($user['backup_tab'] || $user['has_admin_privileges']);
}

function getAccessibleSites($userId) {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT has_admin_privileges FROM admins WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if ($user && $user['has_admin_privileges']) {
        $stmt = $pdo->query("SELECT id FROM sites WHERE still_active = 1");
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    $stmt = $pdo->prepare("SELECT site_id FROM user_company_access WHERE user_id = ?");
    $stmt->execute([$userId]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

function generateDeviceId() {
    return bin2hex(random_bytes(32));
}
