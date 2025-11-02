<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!hasModuleAccess('agents')) {
    redirect(SITE_URL . '/dashboard.php');
}

if (!hasFullAccess('agents')) {
    redirect(SITE_URL . '/agents/index.php');
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = sanitizeInput($_POST['name']);
    $phones = sanitizeInput($_POST['phones']);
    $branches = isset($_POST['branches']) ? $_POST['branches'] : [];
    
    if (empty($name)) {
        $error = 'Agent name is required';
    } else {
        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("INSERT INTO agents (name) VALUES (?)");
            $stmt->execute([$name]);
            $agentId = $pdo->lastInsertId();
            
            if (!empty($phones)) {
                $phoneArray = array_map('trim', explode(',', $phones));
                $phoneArray = array_filter($phoneArray);
                
                $stmt = $pdo->prepare("INSERT INTO agent_phones (agent_id, phone, is_primary) VALUES (?, ?, ?)");
                foreach ($phoneArray as $index => $phone) {
                    $isPrimary = ($index === 0) ? 1 : 0;
                    $stmt->execute([$agentId, $phone, $isPrimary]);
                }
            }
            
            if (!empty($branches)) {
                $stmt = $pdo->prepare("INSERT INTO agent_branches (agent_id, branch_id) VALUES (?, ?)");
                foreach ($branches as $branchId) {
                    $stmt->execute([$agentId, $branchId]);
                }
            }
            
            $pdo->commit();
            $success = 'Agent created successfully';
            header('refresh:2;url=index.php');
        } catch (PDOException $e) {
            $pdo->rollBack();
            $error = 'Error creating agent: ' . $e->getMessage();
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
        <h1>Create New Agent</h1>
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
                       value="<?php echo isset($_POST['name']) ? htmlspecialchars($_POST['name']) : ''; ?>">
            </div>
            
            <div class="form-group">
                <label for="phones">Mobile Numbers (comma-separated)</label>
                <input type="text" id="phones" name="phones" 
                       placeholder="e.g., 9999999999, 8888888888" 
                       value="<?php echo isset($_POST['phones']) ? htmlspecialchars($_POST['phones']) : ''; ?>">
                <small>Enter multiple numbers separated by commas. First number will be primary.</small>
            </div>
            
            <div class="form-group">
                <label>Assign Branches (optional)</label>
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
                                    <input type="checkbox" name="branches[]" value="<?php echo $branch['id']; ?>">
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
                <button type="submit" class="btn btn-primary">Create Agent</button>
                <a href="index.php" class="btn btn-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
