<?php
require_once 'config/config.php';
require_once 'config/database.php';
requireLogin();

$stmt = $pdo->query("SELECT COUNT(*) as count FROM sites");
$totalSites = $stmt->fetch()['count'];

$stmt = $pdo->query("SELECT COUNT(*) as count FROM branches");
$totalBranches = $stmt->fetch()['count'];

$stmt = $pdo->query("SELECT COUNT(*) as count FROM agents");
$totalAgents = $stmt->fetch()['count'];

$stmt = $pdo->query("SELECT SUM(balance) as total FROM branches");
$totalBalance = $stmt->fetch()['total'] ?? 0;

$stmt = $pdo->query("
    SELECT s.name as site_name, COUNT(b.id) as branch_count, SUM(b.balance) as total_balance
    FROM sites s
    LEFT JOIN branches b ON s.id = b.site_id
    GROUP BY s.id
    ORDER BY total_balance DESC
    LIMIT 5
");
$topSites = $stmt->fetchAll();

include 'includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Dashboard</h1>
        <p>Welcome to Hisaab Portal</p>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon bg-blue">
                <i class="icon-site"></i>
            </div>
            <div class="stat-details">
                <h3><?php echo $totalSites; ?></h3>
                <p>Total Sites</p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon bg-green">
                <i class="icon-branch"></i>
            </div>
            <div class="stat-details">
                <h3><?php echo $totalBranches; ?></h3>
                <p>Total Branches</p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon bg-orange">
                <i class="icon-agent"></i>
            </div>
            <div class="stat-details">
                <h3><?php echo $totalAgents; ?></h3>
                <p>Total Agents</p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon bg-purple">
                <i class="icon-money"></i>
            </div>
            <div class="stat-details">
                <h3><?php echo formatCurrency($totalBalance); ?></h3>
                <p>Total Balance</p>
            </div>
        </div>
    </div>
    
    <div class="dashboard-section">
        <h2>Top Sites by Balance</h2>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Site Name</th>
                        <th>Branches</th>
                        <th>Total Balance</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($topSites)): ?>
                        <tr>
                            <td colspan="3" class="text-center">No sites found. <a href="sites/create.php">Create your first site</a></td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($topSites as $site): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($site['site_name']); ?></td>
                                <td><?php echo $site['branch_count']; ?></td>
                                <td class="<?php echo $site['total_balance'] < 0 ? 'text-danger' : 'text-success'; ?>">
                                    <?php echo formatCurrency($site['total_balance']); ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
