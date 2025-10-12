<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$agentId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($agentId <= 0) {
    redirect(SITE_URL . '/agents/index.php');
}

$stmt = $pdo->prepare("SELECT * FROM agents WHERE id = ?");
$stmt->execute([$agentId]);
$agent = $stmt->fetch();

if (!$agent) {
    redirect(SITE_URL . '/agents/index.php');
}

$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM agent_branches WHERE agent_id = ?");
$stmt->execute([$agentId]);
$branchCount = $stmt->fetch()['count'];

$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM agent_phones WHERE agent_id = ?");
$stmt->execute([$agentId]);
$phoneCount = $stmt->fetch()['count'];

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['confirm']) && $_POST['confirm'] === 'yes') {
        try {
            $stmt = $pdo->prepare("DELETE FROM agents WHERE id = ?");
            $stmt->execute([$agentId]);
            $success = 'Agent deleted successfully';
            header('refresh:2;url=index.php');
        } catch (PDOException $e) {
            $error = 'Error deleting agent: ' . $e->getMessage();
        }
    } else {
        redirect(SITE_URL . '/agents/index.php');
    }
}

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Delete Agent</h1>
        <a href="index.php" class="btn btn-secondary">← Back to Agents</a>
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
                <p>Are you sure you want to delete the agent <strong><?php echo htmlspecialchars($agent['name']); ?></strong>?</p>
                <?php if ($branchCount > 0): ?>
                    <p><strong>This agent is assigned to <?php echo $branchCount; ?> branch(es). The assignments will be removed.</strong></p>
                <?php endif; ?>
                <?php if ($phoneCount > 0): ?>
                    <p><strong>This agent has <?php echo $phoneCount; ?> phone number(s) that will be deleted.</strong></p>
                <?php endif; ?>
                <p>This action cannot be undone.</p>
            </div>
            
            <form method="POST" action="">
                <input type="hidden" name="confirm" value="yes">
                <div class="form-actions">
                    <button type="submit" class="btn btn-danger">Yes, Delete Agent</button>
                    <a href="index.php" class="btn btn-secondary">Cancel</a>
                </div>
            </form>
        </div>
    <?php endif; ?>
</div>

<?php include '../includes/footer.php'; ?>
