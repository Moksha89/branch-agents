<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$stmt = $pdo->query("
    SELECT 
        s.*,
        COUNT(DISTINCT b.id) as branch_count,
        COUNT(DISTINCT b.agent_id) as agent_count,
        COALESCE(SUM(b.balance), 0) as total_balance
    FROM sites s
    LEFT JOIN branches b ON s.id = b.site_id
    GROUP BY s.id
    ORDER BY s.name
");
$sites = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Sites Management</h1>
        <a href="create.php" class="btn btn-primary">+ Create New Site</a>
    </div>
    
    <div class="table-responsive">
        <table class="table data-table" id="sitesTable">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Site Name</th>
                    <th>Branches</th>
                    <th>Agents</th>
                    <th>Total Balance</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($sites)): ?>
                    <tr>
                        <td colspan="7" class="text-center">No sites found. <a href="create.php">Create your first site</a></td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($sites as $site): ?>
                        <tr>
                            <td><?php echo $site['id']; ?></td>
                            <td><strong><?php echo htmlspecialchars($site['name']); ?></strong></td>
                            <td><?php echo $site['branch_count']; ?></td>
                            <td><?php echo $site['agent_count']; ?></td>
                            <td class="<?php echo $site['total_balance'] < 0 ? 'text-danger' : 'text-success'; ?>">
                                <?php echo formatCurrency($site['total_balance']); ?>
                            </td>
                            <td><?php echo date('d-M-Y', strtotime($site['created_at'])); ?></td>
                            <td>
                                <a href="view.php?id=<?php echo $site['id']; ?>" class="btn btn-sm btn-info">View</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
