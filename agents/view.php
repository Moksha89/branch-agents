<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$agentId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($agentId <= 0) {
    redirect(SITE_URL . '/agents/index.php');
}

$stmt = $pdo->prepare("
    SELECT a.*, GROUP_CONCAT(ap.phone SEPARATOR ', ') as phones
    FROM agents a
    LEFT JOIN agent_phones ap ON a.id = ap.agent_id
    WHERE a.id = ?
    GROUP BY a.id
");
$stmt->execute([$agentId]);
$agent = $stmt->fetch();

if (!$agent) {
    redirect(SITE_URL . '/agents/index.php');
}

$stmt = $pdo->prepare("
    SELECT 
        b.*,
        s.name as site_name
    FROM agent_branches ab
    JOIN branches b ON ab.branch_id = b.id
    JOIN sites s ON b.site_id = s.id
    WHERE ab.agent_id = ?
    ORDER BY s.name, b.branch_code
");
$stmt->execute([$agentId]);
$branches = $stmt->fetchAll();

$totalBalance = array_sum(array_column($branches, 'balance'));

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Agent: <?php echo htmlspecialchars($agent['name']); ?></h1>
        <div>
            <button onclick="sendWhatsApp(<?php echo $agentId; ?>, '<?php echo htmlspecialchars($agent['name']); ?>')" 
                    class="btn whatsapp-btn" data-agent-id="<?php echo $agentId; ?>">
                📱 Send Report to WhatsApp
            </button>
            <a href="edit.php?id=<?php echo $agentId; ?>" class="btn btn-warning">Edit Agent</a>
            <a href="index.php" class="btn btn-secondary">← Back to Agents</a>
        </div>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon bg-orange">
                <i class="icon-branch"></i>
            </div>
            <div class="stat-details">
                <h3><?php echo count($branches); ?></h3>
                <p>Assigned Branches</p>
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
    
    <div class="dashboard-section">
        <h3>Contact Information</h3>
        <p><strong>Mobile Numbers:</strong> <?php echo htmlspecialchars($agent['phones'] ?? 'No phone numbers'); ?></p>
    </div>
    
    <div class="table-responsive" style="margin-top: 30px;">
        <h2>Assigned Branches</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Site</th>
                    <th>Branch Code</th>
                    <th>Balance</th>
                    <th>Last Updated</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($branches)): ?>
                    <tr>
                        <td colspan="4" class="text-center">No branches assigned</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($branches as $branch): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($branch['site_name']); ?></td>
                            <td><strong><?php echo htmlspecialchars($branch['branch_code']); ?></strong></td>
                            <td class="<?php echo $branch['balance'] < 0 ? 'text-danger' : 'text-success'; ?>">
                                <?php echo formatCurrency($branch['balance']); ?>
                            </td>
                            <td><?php echo date('d-M-Y H:i', strtotime($branch['updated_at'])); ?></td>
                        </tr>
                    <?php endforeach; ?>
                    <tr style="background: #f8f9fa; font-weight: bold;">
                        <td colspan="2">TOTAL</td>
                        <td class="<?php echo $totalBalance < 0 ? 'text-danger' : 'text-success'; ?>">
                            <?php echo formatCurrency($totalBalance); ?>
                        </td>
                        <td></td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<script>
const SITE_URL = '<?php echo SITE_URL; ?>';
</script>

<?php include '../includes/footer.php'; ?>
