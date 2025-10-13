<?php

session_start();

// Auto-detect site URL based on environment
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
define('SITE_URL', $protocol . '://' . $host);
define('SITE_NAME', 'Hisaab Portal');

date_default_timezone_set('Asia/Kolkata');

function isLoggedIn() {
    return isset($_SESSION['admin_id']);
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: ' . SITE_URL . '/login.php');
        exit;
    }
}

function redirect($url) {
    header('Location: ' . $url);
    exit;
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
