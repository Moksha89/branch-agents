<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$stmt = $pdo->query("
    SELECT 
        b.*,
        s.name as site_name,
        GROUP_CONCAT(a.name ORDER BY a.name SEPARATOR ', ') as agents
    FROM branches b
    JOIN sites s ON b.site_id = s.id
    LEFT JOIN agent_branches ab ON b.id = ab.branch_id
    LEFT JOIN agents a ON ab.agent_id = a.id
    GROUP BY b.id
    ORDER BY s.name, b.branch_code
");
$branches = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Branches Management</h1>
        <a href="create.php" class="btn btn-primary">+ Create New Branch</a>
    </div>
    
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Site</th>
                    <th>Branch Code</th>
                    <th>Balance</th>
                    <th>Assigned Agents</th>
                    <th>Updated</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($branches)): ?>
                    <tr>
                        <td colspan="7" class="text-center">No branches found. <a href="create.php">Create your first branch</a></td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($branches as $branch): ?>
                        <tr>
                            <td><?php echo $branch['id']; ?></td>
                            <td><?php echo htmlspecialchars($branch['site_name']); ?></td>
                            <td><strong><?php echo htmlspecialchars($branch['branch_code']); ?></strong></td>
                            <td class="editable-balance <?php echo $branch['balance'] < 0 ? 'text-danger' : 'text-success'; ?>" 
                                data-branch-id="<?php echo $branch['id']; ?>"
                                data-original-value="<?php echo $branch['balance']; ?>"
                                title="Double-click to edit">
                                <?php echo formatCurrency($branch['balance']); ?>
                            </td>
                            <td><?php echo htmlspecialchars($branch['agents'] ?? 'No agents'); ?></td>
                            <td><?php echo date('d-M-Y H:i', strtotime($branch['updated_at'])); ?></td>
                            <td>
                                <a href="edit.php?id=<?php echo $branch['id']; ?>" class="btn btn-sm btn-warning">Edit</a>
                                <a href="delete.php?id=<?php echo $branch['id']; ?>" class="btn btn-sm btn-danger" 
                                   onclick="return confirm('Are you sure you want to delete this branch?')">Delete</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    
    <div class="alert alert-warning" style="margin-top: 20px;">
        <strong>💡 Tip:</strong> Double-click on any balance to edit it directly. Changes will be saved automatically.
    </div>
</div>

<script>
const SITE_URL = '<?php echo SITE_URL; ?>';
</script>

<?php include '../includes/footer.php'; ?>
