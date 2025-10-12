<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$siteId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($siteId <= 0) {
    redirect(SITE_URL . '/sites/index.php');
}

$stmt = $pdo->prepare("SELECT * FROM sites WHERE id = ?");
$stmt->execute([$siteId]);
$site = $stmt->fetch();

if (!$site) {
    redirect(SITE_URL . '/sites/index.php');
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = sanitizeInput($_POST['name']);
    
    if (empty($name)) {
        $error = 'Site name is required';
    } else {
        try {
            $stmt = $pdo->prepare("UPDATE sites SET name = ? WHERE id = ?");
            $stmt->execute([$name, $siteId]);
            $success = 'Site updated successfully';
            
            $stmt = $pdo->prepare("SELECT * FROM sites WHERE id = ?");
            $stmt->execute([$siteId]);
            $site = $stmt->fetch();
        } catch (PDOException $e) {
            $error = 'Error updating site: ' . $e->getMessage();
        }
    }
}

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Edit Site</h1>
        <a href="index.php" class="btn btn-secondary">← Back to Sites</a>
    </div>
    
    <?php if ($error): ?>
        <div class="alert alert-error"><?php echo $error; ?></div>
    <?php endif; ?>
    
    <?php if ($success): ?>
        <div class="alert alert-success"><?php echo $success; ?></div>
    <?php endif; ?>
    
    <div class="form-container">
        <form method="POST" action="">
            <div class="form-group">
                <label for="name">Site Name *</label>
                <input type="text" id="name" name="name" required 
                       placeholder="e.g., JAI, KALKI, VVBOOK" 
                       value="<?php echo htmlspecialchars($site['name']); ?>">
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Update Site</button>
                <a href="view.php?id=<?php echo $siteId; ?>" class="btn btn-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
