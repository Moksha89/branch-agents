<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$branchId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($branchId <= 0) {
    redirect(SITE_URL . '/branches/index.php');
}

$stmt = $pdo->prepare("
    SELECT b.*, s.name as site_name 
    FROM branches b
    JOIN sites s ON b.site_id = s.id
    WHERE b.id = ?
");
$stmt->execute([$branchId]);
$branch = $stmt->fetch();

if (!$branch) {
    redirect(SITE_URL . '/branches/index.php');
}

$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM agent_branches WHERE branch_id = ?");
$stmt->execute([$branchId]);
$agentCount = $stmt->fetch()['count'];

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['confirm']) && $_POST['confirm'] === 'yes') {
        try {
            $stmt = $pdo->prepare("DELETE FROM branches WHERE id = ?");
            $stmt->execute([$branchId]);
            $success = 'Branch deleted successfully';
            header('refresh:2;url=index.php');
        } catch (PDOException $e) {
            $error = 'Error deleting branch: ' . $e->getMessage();
        }
    } else {
        redirect(SITE_URL . '/branches/index.php');
    }
}

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Delete Branch</h1>
        <a href="index.php" class="btn btn-secondary">← Back to Branches</a>
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
                <p>Are you sure you want to delete the branch <strong><?php echo htmlspecialchars($branch['branch_code']); ?></strong> from site <strong><?php echo htmlspecialchars($branch['site_name']); ?></strong>?</p>
                <?php if ($agentCount > 0): ?>
                    <p><strong>This branch is assigned to <?php echo $agentCount; ?> agent(s). The assignments will be removed.</strong></p>
                <?php endif; ?>
                <p>Current balance: <strong><?php echo formatCurrency($branch['balance']); ?></strong></p>
                <p>This action cannot be undone.</p>
            </div>
            
            <form method="POST" action="">
                <input type="hidden" name="confirm" value="yes">
                <div class="form-actions">
                    <button type="submit" class="btn btn-danger">Yes, Delete Branch</button>
                    <a href="index.php" class="btn btn-secondary">Cancel</a>
                </div>
            </form>
        </div>
    <?php endif; ?>
</div>

<?php include '../includes/footer.php'; ?>
