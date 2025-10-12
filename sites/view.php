<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$siteId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($siteId <= 0) {
    redirect(SITE_URL . '/sites/index.php');
}

$stmt = $pdo->prepare("SELECT * FROM sites WHERE id = ?");
$stmt->execute([$siteId]);
$site = $stmt->fetch();

if (!$site) {
    redirect(SITE_URL . '/sites/index.php');
}

$stmt = $pdo->prepare("
    SELECT 
        b.*,
        GROUP_CONCAT(
            CONCAT(a.name, ' (', ap.phone, ')') 
            ORDER BY a.name SEPARATOR ', '
        ) as agents_with_phones
    FROM branches b
    LEFT JOIN agent_branches ab ON b.id = ab.branch_id
    LEFT JOIN agents a ON ab.agent_id = a.id
    LEFT JOIN (
        SELECT agent_id, MIN(phone) as phone 
        FROM agent_phones 
        GROUP BY agent_id
    ) ap ON a.id = ap.agent_id
    WHERE b.site_id = ?
    GROUP BY b.id
    ORDER BY b.branch_code
");
$stmt->execute([$siteId]);
$branches = $stmt->fetchAll();

$totalBalance = array_sum(array_column($branches, 'balance'));

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Site: <?php echo htmlspecialchars($site['name']); ?></h1>
        <div>
            <a href="edit.php?id=<?php echo $siteId; ?>" class="btn btn-warning">Edit Site</a>
            <a href="index.php" class="btn btn-secondary">← Back to Sites</a>
        </div>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon bg-green">
                <i class="icon-branch"></i>
            </div>
            <div class="stat-details">
                <h3><?php echo count($branches); ?></h3>
                <p>Total Branches</p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon <?php echo $totalBalance < 0 ? 'bg-danger' : 'bg-purple'; ?>">
                <i class="icon-money"></i>
            </div>
            <div class="stat-details">
                <h3><?php echo formatCurrency($totalBalance); ?></h3>
                <p>Total Balance</p>
            </div>
        </div>
    </div>
    
    <div class="table-responsive">
        <h2>Branches</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Branch Code</th>
                    <th>Balance</th>
                    <th>Assigned Agents</th>
                    <th>Last Updated</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($branches)): ?>
                    <tr>
                        <td colspan="4" class="text-center">No branches found. <a href="../branches/create.php">Create a branch</a></td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($branches as $branch): ?>
                        <tr>
                            <td><strong><?php echo htmlspecialchars($branch['branch_code']); ?></strong></td>
                            <td class="<?php echo $branch['balance'] < 0 ? 'text-danger' : 'text-success'; ?>">
                                <?php echo formatCurrency($branch['balance']); ?>
                            </td>
                            <td><?php echo htmlspecialchars($branch['agents_with_phones'] ?? 'No agents'); ?></td>
                            <td><?php echo date('d-M-Y H:i', strtotime($branch['updated_at'])); ?></td>
                        </tr>
                    <?php endforeach; ?>
                    <tr style="background: #f8f9fa; font-weight: bold;">
                        <td>TOTAL</td>
                        <td class="<?php echo $totalBalance < 0 ? 'text-danger' : 'text-success'; ?>">
                            <?php echo formatCurrency($totalBalance); ?>
                        </td>
                        <td colspan="2"></td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
