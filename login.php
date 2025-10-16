<?php
require_once 'config/config.php';
require_once 'config/database.php';

$stmt = $pdo->query("SELECT * FROM portal_settings WHERE id = 1");
$portalSettings = $stmt->fetch();
$portalName = $portalSettings ? $portalSettings['portal_name'] : 'Hisaab Portal';
$logoPath = ($portalSettings && $portalSettings['logo_path']) ? SITE_URL . '/' . $portalSettings['logo_path'] : null;

if (isLoggedIn()) {
    redirect(SITE_URL . '/dashboard.php');
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mobile = sanitizeInput($_POST['mobile']);
    $password = $_POST['password'];
    
    $stmt = $pdo->prepare("SELECT * FROM admins WHERE mobile = ?");
    $stmt->execute([$mobile]);
    $admin = $stmt->fetch();
    
    if ($admin && password_verify($password, $admin['password'])) {
        $_SESSION['user_type'] = 'admin';
        $_SESSION['admin_id'] = $admin['id'];
        $_SESSION['admin_mobile'] = $admin['mobile'];
        redirect(SITE_URL . '/dashboard.php');
    } else {
        $stmt = $pdo->prepare("SELECT * FROM employees WHERE mobile = ? AND is_active = TRUE");
        $stmt->execute([$mobile]);
        $employee = $stmt->fetch();
        
        if ($employee && password_verify($password, $employee['password'])) {
            $_SESSION['user_type'] = 'employee';
            $_SESSION['employee_id'] = $employee['id'];
            $_SESSION['employee_name'] = $employee['name'];
            $_SESSION['employee_mobile'] = $employee['mobile'];
            
            loadEmployeePermissions($employee['id']);
            
            redirect(SITE_URL . '/dashboard.php');
        } else {
            $error = 'Invalid mobile number or password';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - <?php echo htmlspecialchars($portalName); ?></title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="login-page">
    <div class="login-container">
        <div class="login-box">
            <div class="login-header">
                <?php if ($logoPath): ?>
                    <img src="<?php echo $logoPath; ?>" alt="Logo" style="max-width: 200px; max-height: 80px; margin-bottom: 15px;">
                <?php endif; ?>
                <h1><?php echo htmlspecialchars($portalName); ?></h1>
                <p>Portal Management System</p>
            </div>
            
            <?php if ($error): ?>
                <div class="alert alert-error">
                    <?php echo $error; ?>
                </div>
            <?php endif; ?>
            
            <form method="POST" action="">
                <div class="form-group">
                    <label for="mobile">Mobile Number</label>
                    <input type="text" id="mobile" name="mobile" required autofocus 
                           pattern="[0-9]{10}" maxlength="10" 
                           placeholder="Enter 10-digit mobile number">
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required 
                           placeholder="Enter password">
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">Login</button>
            </form>
            
            <div class="login-footer">
                <small>© <?php echo date('Y'); ?> Hisaab Portal. All rights reserved.</small>
            </div>
        </div>
    </div>
</body>
</html>
