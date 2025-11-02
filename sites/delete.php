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

$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM branches WHERE site_id = ?");
$stmt->execute([$siteId]);
$branchCount = $stmt->fetch()['count'];

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['confirm']) && $_POST['confirm'] === 'yes') {
        try {
            $stmt = $pdo->prepare("DELETE FROM sites WHERE id = ?");
            $stmt->execute([$siteId]);
            $success = 'Site deleted successfully';
            header('refresh:2;url=index.php');
        } catch (PDOException $e) {
            $error = 'Error deleting site: ' . $e->getMessage();
        }
    } else {
        redirect(SITE_URL . '/sites/index.php');
    }
}

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Delete Site</h1>
        <a href="index.php" class="btn btn-secondary">← Back to Sites</a>
    </div>
    
    <?php if ($error): ?>
        <div class="alert alert-error"><?php echo $error; ?></div>
    <?php endif; ?>
    
    <?php if ($success): ?>
        <div class="alert alert-success"><?php echo $success; ?></div>
    <?php else: ?>
        <div class="form-container">
            <div class="alert alert-warning">
                <h3>⚠️ Warning</h3>
                <p>Are you sure you want to delete the site <strong><?php echo htmlspecialchars($site['name']); ?></strong>?</p>
                <?php if ($branchCount > 0): ?>
                    <p><strong>This site has <?php echo $branchCount; ?> branch(es) that will also be deleted!</strong></p>
                <?php endif; ?>
                <p>This action cannot be undone.</p>
            </div>
            
            <form method="POST" action="">
                <input type="hidden" name="confirm" value="yes">
                <div class="form-actions">
                    <button type="submit" class="btn btn-danger">Yes, Delete Site</button>
                    <a href="index.php" class="btn btn-secondary">Cancel</a>
                </div>
            </form>
        </div>
    <?php endif; ?>
</div>

<?php include '../includes/footer.php'; ?>
