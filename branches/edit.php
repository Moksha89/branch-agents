<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!hasModuleAccess('branches')) {
    redirect(SITE_URL . '/dashboard.php');
}

if (!hasFullAccess('branches')) {
    redirect(SITE_URL . '/branches/index.php');
}

$branchId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($branchId <= 0) {
    redirect(SITE_URL . '/branches/index.php');
}

$stmt = $pdo->prepare("SELECT * FROM branches WHERE id = ?");
$stmt->execute([$branchId]);
$branch = $stmt->fetch();

if (!$branch) {
    redirect(SITE_URL . '/branches/index.php');
}

$currentAgentId = $branch['agent_id'];

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $siteId = intval($_POST['site_id']);
    $branchCode = sanitizeInput($_POST['branch_code']);
    $balance = floatval($_POST['balance']);
    $agentId = isset($_POST['agent_id']) && !empty($_POST['agent_id']) ? intval($_POST['agent_id']) : null;
    
    if (empty($siteId) || empty($branchCode)) {
        $error = 'Site and branch code are required';
    } else {
        try {
            $stmt = $pdo->prepare("UPDATE branches SET site_id = ?, branch_code = ?, balance = ?, agent_id = ? WHERE id = ?");
            $stmt->execute([$siteId, $branchCode, $balance, $agentId, $branchId]);
            
            $success = 'Branch updated successfully';
            
            $stmt = $pdo->prepare("SELECT * FROM branches WHERE id = ?");
            $stmt->execute([$branchId]);
            $branch = $stmt->fetch();
            
            $currentAgentId = $branch['agent_id'];
        } catch (PDOException $e) {
            $error = 'Error updating branch: ' . $e->getMessage();
        }
    }
}

$stmt = $pdo->query("SELECT * FROM sites ORDER BY name");
$sites = $stmt->fetchAll();

$stmt = $pdo->query("SELECT * FROM agents ORDER BY name");
$allAgents = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Edit Branch</h1>
        <a href="index.php" class="btn btn-secondary">← Back to Branches</a>
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
                <label for="site_id">Site *</label>
                <select id="site_id" name="site_id" required>
                    <option value="">Select Site</option>
                    <?php foreach ($sites as $site): ?>
                        <option value="<?php echo $site['id']; ?>" 
                                <?php echo ($branch['site_id'] == $site['id']) ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($site['name']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="form-group">
                <label for="branch_code">Branch Code *</label>
                <input type="text" id="branch_code" name="branch_code" required 
                       placeholder="e.g., JAIBK01, KALKIBK04" 
                       value="<?php echo htmlspecialchars($branch['branch_code']); ?>">
            </div>
            
            <div class="form-group">
                <label for="balance">Balance</label>
                <input type="number" id="balance" name="balance" step="0.01" 
                       value="<?php echo $branch['balance']; ?>">
            </div>
            
            <div class="form-group">
                <label for="agent_id">Assign Agent</label>
                <select id="agent_id" name="agent_id">
                    <option value="">No agent</option>
                    <?php if (!empty($allAgents)): ?>
                        <?php foreach ($allAgents as $agent): ?>
                            <option value="<?php echo $agent['id']; ?>"
                                    <?php echo ($currentAgentId == $agent['id']) ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($agent['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <option value="" disabled>No agents available</option>
                    <?php endif; ?>
                </select>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Update Branch</button>
                <a href="index.php" class="btn btn-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
