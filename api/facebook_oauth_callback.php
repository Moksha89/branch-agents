<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!isAdmin()) {
    redirect(SITE_URL . '/dashboard.php');
}

$code = $_GET['code'] ?? null;
$error = $_GET['error'] ?? null;

if ($error) {
    $_SESSION['error'] = 'Facebook authentication failed: ' . $error;
    redirect(SITE_URL . '/settings/whatsapp_web.php');
    exit;
}

if (!$code) {
    $_SESSION['error'] = 'No authorization code received from Facebook';
    redirect(SITE_URL . '/settings/whatsapp_web.php');
    exit;
}

$stmt = $pdo->query("SELECT facebook_app_id, facebook_app_secret FROM whatsapp_config WHERE id = 1");
$config = $stmt->fetch();

if (!$config || !$config['facebook_app_id'] || !$config['facebook_app_secret']) {
    $_SESSION['error'] = 'Facebook app credentials not configured';
    redirect(SITE_URL . '/settings/whatsapp_web.php');
    exit;
}

$redirectUri = SITE_URL . '/api/facebook_oauth_callback.php';
$tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token';

$params = [
    'client_id' => $config['facebook_app_id'],
    'client_secret' => $config['facebook_app_secret'],
    'code' => $code,
    'redirect_uri' => $redirectUri
];

$ch = curl_init($tokenUrl . '?' . http_build_query($params));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    $_SESSION['error'] = 'Failed to exchange code for access token: ' . $response;
    redirect(SITE_URL . '/settings/whatsapp_web.php');
    exit;
}

$data = json_decode($response, true);
$accessToken = $data['access_token'] ?? null;

if (!$accessToken) {
    $_SESSION['error'] = 'No access token received from Facebook';
    redirect(SITE_URL . '/settings/whatsapp_web.php');
    exit;
}

try {
    $stmt = $pdo->prepare("
        UPDATE whatsapp_config 
        SET access_token = ?, 
            api_type = 'business',
            is_active = 1,
            updated_at = NOW()
        WHERE id = 1
    ");
    $stmt->execute([$accessToken]);
    
    $_SESSION['success'] = 'Facebook Business Manager connected successfully! WhatsApp is now ready to send messages.';
} catch (PDOException $e) {
    $_SESSION['error'] = 'Database error: ' . $e->getMessage();
}

redirect(SITE_URL . '/settings/whatsapp_web.php');
