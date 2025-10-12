<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $siteId = intval($_POST['site_id']);
    $branchCode = sanitizeInput($_POST['branch_code']);
    $balance = floatval($_POST['balance']);
    $agents = isset($_POST['agents']) ? $_POST['agents'] : [];
    
    if (empty($siteId) || empty($branchCode)) {
        $error = 'Site and branch code are required';
    } else {
        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("INSERT INTO branches (site_id, branch_code, balance) VALUES (?, ?, ?)");
            $stmt->execute([$siteId, $branchCode, $balance]);
            $branchId = $pdo->lastInsertId();
            
            if (!empty($agents)) {
                $stmt = $pdo->prepare("INSERT INTO agent_branches (agent_id, branch_id) VALUES (?, ?)");
                foreach ($agents as $agentId) {
                    $stmt->execute([$agentId, $branchId]);
                }
            }
            
            $pdo->commit();
            $success = 'Branch created successfully';
            header('refresh:2;url=index.php');
        } catch (PDOException $e) {
            $pdo->rollBack();
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
                <select id="site_id" name="site_id" required>
                    <option value="">Select Site</option>
                    <?php foreach ($sites as $site): ?>
                        <option value="<?php echo $site['id']; ?>" 
                                <?php echo (isset($_POST['site_id']) && $_POST['site_id'] == $site['id']) ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($site['name']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
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
                <label>Assign Agents (optional)</label>
                <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ced4da; padding: 10px; border-radius: 5px;">
                    <?php if (empty($allAgents)): ?>
                        <p>No agents available. <a href="../agents/create.php">Create an agent first</a></p>
                    <?php else: ?>
                        <?php foreach ($allAgents as $agent): ?>
                            <div>
                                <label style="font-weight: normal;">
                                    <input type="checkbox" name="agents[]" value="<?php echo $agent['id']; ?>">
                                    <?php echo htmlspecialchars($agent['name']); ?>
                                </label>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Create Branch</button>
                <a href="index.php" class="btn btn-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
