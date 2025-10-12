<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$stmt = $pdo->query("
    SELECT 
        a.*,
        GROUP_CONCAT(DISTINCT ap.phone ORDER BY ap.is_primary DESC SEPARATOR ', ') as phones,
        COUNT(DISTINCT ab.branch_id) as branch_count,
        COALESCE(SUM(b.balance), 0) as total_balance
    FROM agents a
    LEFT JOIN agent_phones ap ON a.id = ap.agent_id
    LEFT JOIN agent_branches ab ON a.id = ab.agent_id
    LEFT JOIN branches b ON ab.branch_id = b.id
    GROUP BY a.id
    ORDER BY a.name
");
$agents = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Agents Management</h1>
        <a href="create.php" class="btn btn-primary">+ Create New Agent</a>
    </div>
    
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Agent Name</th>
                    <th>Phone Numbers</th>
                    <th>Branches</th>
                    <th>Total Balance</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($agents)): ?>
                    <tr>
                        <td colspan="6" class="text-center">No agents found. <a href="create.php">Create your first agent</a></td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($agents as $agent): ?>
                        <tr>
                            <td><?php echo $agent['id']; ?></td>
                            <td><strong><?php echo htmlspecialchars($agent['name']); ?></strong></td>
                            <td><?php echo htmlspecialchars($agent['phones'] ?? 'No phone'); ?></td>
                            <td><?php echo $agent['branch_count']; ?></td>
                            <td class="<?php echo $agent['total_balance'] < 0 ? 'text-danger' : 'text-success'; ?>">
                                <?php echo formatCurrency($agent['total_balance']); ?>
                            </td>
                            <td>
                                <a href="view.php?id=<?php echo $agent['id']; ?>" class="btn btn-sm btn-info">View</a>
                                <a href="edit.php?id=<?php echo $agent['id']; ?>" class="btn btn-sm btn-warning">Edit</a>
                                <button onclick="sendWhatsApp(<?php echo $agent['id']; ?>, '<?php echo htmlspecialchars($agent['name']); ?>')" 
                                        class="btn btn-sm whatsapp-btn" data-agent-id="<?php echo $agent['id']; ?>">
                                    📱 Send Report
                                </button>
                                <a href="delete.php?id=<?php echo $agent['id']; ?>" class="btn btn-sm btn-danger" 
                                   onclick="return confirm('Are you sure you want to delete this agent?')">Delete</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<script>
const SITE_URL = '<?php echo SITE_URL; ?>';
</script>

<?php include '../includes/footer.php'; ?>
