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

$stmt = $pdo->prepare("SELECT phone FROM agent_phones WHERE agent_id = ? ORDER BY is_primary DESC");
$stmt->execute([$agentId]);
$phones = array_column($stmt->fetchAll(), 'phone');
$phonesStr = implode(', ', $phones);

$stmt = $pdo->prepare("SELECT branch_id FROM agent_branches WHERE agent_id = ?");
$stmt->execute([$agentId]);
$assignedBranches = array_column($stmt->fetchAll(), 'branch_id');

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = sanitizeInput($_POST['name']);
    $phonesInput = sanitizeInput($_POST['phones']);
    $branches = isset($_POST['branches']) ? $_POST['branches'] : [];
    
    if (empty($name)) {
        $error = 'Agent name is required';
    } else {
        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("UPDATE agents SET name = ? WHERE id = ?");
            $stmt->execute([$name, $agentId]);
            
            $stmt = $pdo->prepare("DELETE FROM agent_phones WHERE agent_id = ?");
            $stmt->execute([$agentId]);
            
            if (!empty($phonesInput)) {
                $phoneArray = array_map('trim', explode(',', $phonesInput));
                $phoneArray = array_filter($phoneArray);
                
                $stmt = $pdo->prepare("INSERT INTO agent_phones (agent_id, phone, is_primary) VALUES (?, ?, ?)");
                foreach ($phoneArray as $index => $phone) {
                    $isPrimary = ($index === 0) ? 1 : 0;
                    $stmt->execute([$agentId, $phone, $isPrimary]);
                }
            }
            
            $stmt = $pdo->prepare("DELETE FROM agent_branches WHERE agent_id = ?");
            $stmt->execute([$agentId]);
            
            if (!empty($branches)) {
                $stmt = $pdo->prepare("INSERT INTO agent_branches (agent_id, branch_id) VALUES (?, ?)");
                foreach ($branches as $branchId) {
                    $stmt->execute([$agentId, $branchId]);
                }
            }
            
            $pdo->commit();
            $success = 'Agent updated successfully';
            
            $stmt = $pdo->prepare("SELECT * FROM agents WHERE id = ?");
            $stmt->execute([$agentId]);
            $agent = $stmt->fetch();
            
            $stmt = $pdo->prepare("SELECT phone FROM agent_phones WHERE agent_id = ? ORDER BY is_primary DESC");
            $stmt->execute([$agentId]);
            $phones = array_column($stmt->fetchAll(), 'phone');
            $phonesStr = implode(', ', $phones);
            
            $stmt = $pdo->prepare("SELECT branch_id FROM agent_branches WHERE agent_id = ?");
            $stmt->execute([$agentId]);
            $assignedBranches = array_column($stmt->fetchAll(), 'branch_id');
        } catch (PDOException $e) {
            $pdo->rollBack();
            $error = 'Error updating agent: ' . $e->getMessage();
        }
    }
}

$stmt = $pdo->query("
    SELECT b.*, s.name as site_name 
    FROM branches b
    JOIN sites s ON b.site_id = s.id
    ORDER BY s.name, b.branch_code
");
$allBranches = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Edit Agent</h1>
        <a href="index.php" class="btn btn-secondary">← Back to Agents</a>
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
                <label for="name">Agent Name *</label>
                <input type="text" id="name" name="name" required 
                       placeholder="e.g., SATISH, PAVAN" 
                       value="<?php echo htmlspecialchars($agent['name']); ?>">
            </div>
            
            <div class="form-group">
                <label for="phones">Mobile Numbers (comma-separated)</label>
                <input type="text" id="phones" name="phones" 
                       placeholder="e.g., 9999999999, 8888888888" 
                       value="<?php echo htmlspecialchars($phonesStr); ?>">
                <small>Enter multiple numbers separated by commas. First number will be primary.</small>
            </div>
            
            <div class="form-group">
                <label>Assign Branches</label>
                <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ced4da; padding: 10px; border-radius: 5px;">
                    <?php if (empty($allBranches)): ?>
                        <p>No branches available. <a href="../branches/create.php">Create a branch first</a></p>
                    <?php else: ?>
                        <?php 
                        $currentSite = '';
                        foreach ($allBranches as $branch): 
                            if ($currentSite != $branch['site_name']):
                                if ($currentSite != '') echo '</div>';
                                echo '<div style="margin-bottom: 15px;">';
                                echo '<strong>' . htmlspecialchars($branch['site_name']) . '</strong>';
                                $currentSite = $branch['site_name'];
                            endif;
                        ?>
                            <div style="margin-left: 20px;">
                                <label style="font-weight: normal;">
                                    <input type="checkbox" name="branches[]" value="<?php echo $branch['id']; ?>"
                                           <?php echo in_array($branch['id'], $assignedBranches) ? 'checked' : ''; ?>>
                                    <?php echo htmlspecialchars($branch['branch_code']); ?> 
                                    (<?php echo formatCurrency($branch['balance']); ?>)
                                </label>
                            </div>
                        <?php 
                        endforeach; 
                        if ($currentSite != '') echo '</div>';
                        ?>
                    <?php endif; ?>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Update Agent</button>
                <a href="view.php?id=<?php echo $agentId; ?>" class="btn btn-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
