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

$error = '';
$success = '';

$preSelectedSiteId = isset($_GET['site_id']) ? intval($_GET['site_id']) : 0;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $siteId = intval($_POST['site_id']);
    $branchCode = sanitizeInput($_POST['branch_code']);
    $balance = floatval($_POST['balance']);
    $agentId = isset($_POST['agent_id']) && !empty($_POST['agent_id']) ? intval($_POST['agent_id']) : null;
    
    if (empty($siteId) || empty($branchCode)) {
        $error = 'Site and branch code are required';
    } else {
        try {
            $stmt = $pdo->prepare("INSERT INTO branches (site_id, branch_code, balance, agent_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$siteId, $branchCode, $balance, $agentId]);
            
            $success = 'Branch created successfully';
            header('refresh:2;url=index.php');
        } catch (PDOException $e) {
            $error = 'Error creating branch: ' . $e->getMessage();
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
        <h1>Create New Branch</h1>
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
                <select id="site_id" name="site_id" required <?php echo $preSelectedSiteId > 0 ? 'disabled' : ''; ?>>
                    <option value="">Select Site</option>
                    <?php foreach ($sites as $site): ?>
                        <option value="<?php echo $site['id']; ?>" 
                                <?php echo ($preSelectedSiteId == $site['id'] || (isset($_POST['site_id']) && $_POST['site_id'] == $site['id'])) ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($site['name']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <?php if ($preSelectedSiteId > 0): ?>
                    <input type="hidden" name="site_id" value="<?php echo $preSelectedSiteId; ?>">
                <?php endif; ?>
                <?php if (empty($sites)): ?>
                    <small><a href="../sites/create.php">Create a site first</a></small>
                <?php endif; ?>
            </div>
            
            <div class="form-group">
                <label for="branch_code">Branch Code *</label>
                <input type="text" id="branch_code" name="branch_code" required 
                       placeholder="e.g., JAIBK01, KALKIBK04" 
                       value="<?php echo isset($_POST['branch_code']) ? htmlspecialchars($_POST['branch_code']) : ''; ?>">
            </div>
            
            <div class="form-group">
                <label for="balance">Initial Balance</label>
                <input type="number" id="balance" name="balance" step="0.01" value="0.00" 
                       placeholder="0.00">
            </div>
            
            <div class="form-group">
                <label for="agent_id">Assign Agent (optional)</label>
                <select id="agent_id" name="agent_id">
                    <option value="">No agent</option>
                    <?php if (!empty($allAgents)): ?>
                        <?php foreach ($allAgents as $agent): ?>
                            <option value="<?php echo $agent['id']; ?>"
                                    <?php echo (isset($_POST['agent_id']) && $_POST['agent_id'] == $agent['id']) ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($agent['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <option value="" disabled>No agents available - Create an agent first</option>
                    <?php endif; ?>
                </select>
                <small><a href="../agents/create.php">Create new agent</a></small>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Create Branch</button>
                <a href="index.php" class="btn btn-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
