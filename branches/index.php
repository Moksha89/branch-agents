<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$stmt = $pdo->query("
    SELECT 
        b.*,
        s.name as site_name,
        a.name as agent_name
    FROM branches b
    JOIN sites s ON b.site_id = s.id
    LEFT JOIN agents a ON b.agent_id = a.id
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
        <table class="table data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Site</th>
                    <th>Branch Code</th>
                    <th>Balance</th>
                    <th>Assigned Agent</th>
                    <th>Updated</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($branches)): ?>
                    <tr>
                        <td colspan="6" class="text-center">No branches found. <a href="create.php">Create your first branch</a></td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($branches as $branch): ?>
                        <tr>
                            <td><?php echo $branch['id']; ?></td>
                            <td><?php echo htmlspecialchars($branch['site_name']); ?></td>
                            <td><strong><?php echo htmlspecialchars($branch['branch_code']); ?></strong></td>
                            <td class="<?php echo $branch['balance'] < 0 ? 'text-danger' : 'text-success'; ?>">
                                <?php echo formatCurrency($branch['balance']); ?>
                            </td>
                            <td><?php echo htmlspecialchars($branch['agent_name'] ?? 'No agent'); ?></td>
                            <td><?php echo date('d-M-Y H:i', strtotime($branch['updated_at'])); ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
