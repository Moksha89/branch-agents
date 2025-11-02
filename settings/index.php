<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$error = '';
$success = '';

$stmt = $pdo->query("SELECT * FROM portal_settings WHERE id = 1");
$settings = $stmt->fetch();

$stmt = $pdo->query("SELECT * FROM admins WHERE id = " . $_SESSION['admin_id']);
$admin = $stmt->fetch();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {
        try {
            switch ($_POST['action']) {
                case 'change_mobile':
                    $currentPassword = $_POST['current_password'];
                    $newMobile = sanitizeInput($_POST['new_mobile']);
                    
                    if (!password_verify($currentPassword, $admin['password'])) {
                        $error = 'Current password is incorrect';
                        break;
                    }
                    
                    if (!preg_match('/^[0-9]{10}$/', $newMobile)) {
                        $error = 'Mobile number must be 10 digits';
                        break;
                    }
                    
                    $stmt = $pdo->prepare("UPDATE admins SET mobile = ? WHERE id = ?");
                    $stmt->execute([$newMobile, $_SESSION['admin_id']]);
                    $_SESSION['admin_mobile'] = $newMobile;
                    $success = 'Mobile number updated successfully';
                    
                    $stmt = $pdo->query("SELECT * FROM admins WHERE id = " . $_SESSION['admin_id']);
                    $admin = $stmt->fetch();
                    break;
                    
                case 'change_password':
                    $currentPassword = $_POST['current_password'];
                    $newPassword = $_POST['new_password'];
                    $confirmPassword = $_POST['confirm_password'];
                    
                    if (!password_verify($currentPassword, $admin['password'])) {
                        $error = 'Current password is incorrect';
                        break;
                    }
                    
                    if (strlen($newPassword) < 6) {
                        $error = 'New password must be at least 6 characters';
                        break;
                    }
                    
                    if ($newPassword !== $confirmPassword) {
                        $error = 'New passwords do not match';
                        break;
                    }
                    
                    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                    $stmt = $pdo->prepare("UPDATE admins SET password = ? WHERE id = ?");
                    $stmt->execute([$hashedPassword, $_SESSION['admin_id']]);
                    $success = 'Password updated successfully';
                    break;
                    
                case 'upload_logo':
                    if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
                        $error = 'Error uploading logo file';
                        break;
                    }
                    
                    $file = $_FILES['logo'];
                    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                    $maxSize = 2 * 1024 * 1024;
                    
                    if (!in_array($file['type'], $allowedTypes)) {
                        $error = 'Only JPG, PNG, and GIF files are allowed';
                        break;
                    }
                    
                    if ($file['size'] > $maxSize) {
                        $error = 'Logo file must be less than 2MB';
                        break;
                    }
                    
                    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
                    $filename = 'logo_' . time() . '.' . $extension;
                    $uploadDir = dirname(__DIR__) . '/assets/images/';
                    
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0755, true);
                    }
                    
                    if (move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
                        if ($settings && $settings['logo_path']) {
                            $oldLogo = dirname(__DIR__) . '/' . $settings['logo_path'];
                            if (file_exists($oldLogo)) {
                                unlink($oldLogo);
                            }
                        }
                        
                        $logoPath = 'assets/images/' . $filename;
                        $stmt = $pdo->prepare("UPDATE portal_settings SET logo_path = ? WHERE id = 1");
                        $stmt->execute([$logoPath]);
                        $success = 'Logo uploaded successfully';
                        
                        $stmt = $pdo->query("SELECT * FROM portal_settings WHERE id = 1");
                        $settings = $stmt->fetch();
                    } else {
                        $error = 'Error saving logo file';
                    }
                    break;
                    
                case 'change_portal_name':
                    $portalName = sanitizeInput($_POST['portal_name']);
                    
                    if (empty($portalName) || strlen($portalName) > 100) {
                        $error = 'Portal name must be between 1 and 100 characters';
                        break;
                    }
                    
                    $stmt = $pdo->prepare("UPDATE portal_settings SET portal_name = ? WHERE id = 1");
                    $stmt->execute([$portalName]);
                    $success = 'Portal name updated successfully';
                    
                    $stmt = $pdo->query("SELECT * FROM portal_settings WHERE id = 1");
                    $settings = $stmt->fetch();
                    break;
            }
        } catch (PDOException $e) {
            $error = 'Database error: ' . $e->getMessage();
        }
    }
}

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Portal Settings</h1>
    </div>
    
    <?php if ($error): ?>
        <div class="alert alert-error"><?php echo $error; ?></div>
    <?php endif; ?>
    
    <?php if ($success): ?>
        <div class="alert alert-success"><?php echo $success; ?></div>
    <?php endif; ?>
    
    <div class="settings-grid">
        <div class="form-container">
            <h3>Change Mobile Number</h3>
            <form method="POST" action="">
                <input type="hidden" name="action" value="change_mobile">
                
                <div class="form-group">
                    <label for="current_password_mobile">Current Password</label>
                    <input type="password" id="current_password_mobile" name="current_password" required>
                </div>
                
                <div class="form-group">
                    <label for="new_mobile">New Mobile Number</label>
                    <input type="text" id="new_mobile" name="new_mobile" 
                           pattern="[0-9]{10}" maxlength="10" 
                           placeholder="Enter 10-digit mobile number"
                           value="<?php echo htmlspecialchars($admin['mobile']); ?>" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Update Mobile Number</button>
            </form>
        </div>
        
        <div class="form-container">
            <h3>Change Password</h3>
            <form method="POST" action="">
                <input type="hidden" name="action" value="change_password">
                
                <div class="form-group">
                    <label for="current_password_pwd">Current Password</label>
                    <input type="password" id="current_password_pwd" name="current_password" required>
                </div>
                
                <div class="form-group">
                    <label for="new_password">New Password</label>
                    <input type="password" id="new_password" name="new_password" 
                           minlength="6" placeholder="Minimum 6 characters" required>
                </div>
                
                <div class="form-group">
                    <label for="confirm_password">Confirm New Password</label>
                    <input type="password" id="confirm_password" name="confirm_password" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Update Password</button>
            </form>
        </div>
        
        <div class="form-container">
            <h3>Portal Logo</h3>
            <?php if ($settings && $settings['logo_path']): ?>
                <div class="logo-preview">
                    <img src="<?php echo SITE_URL . '/' . $settings['logo_path']; ?>" 
                         alt="Portal Logo" style="max-width: 200px; max-height: 100px; margin-bottom: 15px;">
                </div>
            <?php endif; ?>
            
            <form method="POST" action="" enctype="multipart/form-data">
                <input type="hidden" name="action" value="upload_logo">
                
                <div class="form-group">
                    <label for="logo">Upload Logo (JPG, PNG, GIF - Max 2MB)</label>
                    <input type="file" id="logo" name="logo" accept="image/jpeg,image/png,image/gif" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Upload Logo</button>
            </form>
        </div>
        
        <div class="form-container">
            <h3>Portal Name</h3>
            <form method="POST" action="">
                <input type="hidden" name="action" value="change_portal_name">
                
                <div class="form-group">
                    <label for="portal_name">Portal Name</label>
                    <input type="text" id="portal_name" name="portal_name" 
                           maxlength="100" 
                           value="<?php echo htmlspecialchars($settings ? $settings['portal_name'] : 'Hisaab Portal'); ?>" 
                           required>
                </div>
                
                <button type="submit" class="btn btn-primary">Update Portal Name</button>
            </form>
        </div>
    </div>
</div>

<style>
.settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.logo-preview {
    text-align: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 5px;
}
</style>

<?php include '../includes/footer.php'; ?>
