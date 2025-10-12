<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$stmt = $pdo->query("
    SELECT 
        a.id,
        a.name as agent_name,
        GROUP_CONCAT(DISTINCT ap.phone ORDER BY ap.is_primary DESC SEPARATOR ', ') as phones,
        COUNT(DISTINCT ab.branch_id) as branch_count,
        GROUP_CONCAT(DISTINCT
            CONCAT(s.name, ' - ', b.branch_code, ': ', b.balance) 
            ORDER BY s.name, b.branch_code SEPARATOR ' | '
        ) as branch_details,
        (SELECT COALESCE(SUM(b2.balance), 0) 
         FROM agent_branches ab2 
         JOIN branches b2 ON ab2.branch_id = b2.id 
         WHERE ab2.agent_id = a.id) as total_balance
    FROM agents a
    LEFT JOIN agent_phones ap ON a.id = ap.agent_id
    LEFT JOIN agent_branches ab ON a.id = ab.agent_id
    LEFT JOIN branches b ON ab.branch_id = b.id
    LEFT JOIN sites s ON b.site_id = s.id
    GROUP BY a.id
    ORDER BY total_balance DESC
");
$agentReports = $stmt->fetchAll();

$grandTotal = array_sum(array_column($agentReports, 'total_balance'));

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Agent Reports</h1>
        <button onclick="sendAllReports()" class="btn btn-success">📱 Send All Reports to WhatsApp</button>
    </div>
    
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Agent Name</th>
                    <th>Phone Numbers</th>
                    <th>Branches</th>
                    <th>Branch Details</th>
                    <th>Total Balance</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($agentReports)): ?>
                    <tr>
                        <td colspan="6" class="text-center">No reports available</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($agentReports as $report): ?>
                        <tr>
                            <td><strong><?php echo htmlspecialchars($report['agent_name']); ?></strong></td>
                            <td><?php echo htmlspecialchars($report['phones'] ?? 'No phone'); ?></td>
                            <td><?php echo $report['branch_count']; ?></td>
                            <td style="font-size: 12px;"><?php echo htmlspecialchars($report['branch_details'] ?? 'No branches'); ?></td>
                            <td class="<?php echo $report['total_balance'] < 0 ? 'text-danger' : 'text-success'; ?>">
                                <strong><?php echo formatCurrency($report['total_balance']); ?></strong>
                            </td>
                            <td>
                                <button onclick="sendWhatsApp(<?php echo $report['id']; ?>, '<?php echo htmlspecialchars($report['agent_name']); ?>')" 
                                        class="btn btn-sm whatsapp-btn" data-agent-id="<?php echo $report['id']; ?>">
                                    📱 Send Report
                                </button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                    <tr style="background: #f8f9fa; font-weight: bold;">
                        <td colspan="4" class="text-right">GRAND TOTAL:</td>
                        <td class="<?php echo $grandTotal < 0 ? 'text-danger' : 'text-success'; ?>">
                            <?php echo formatCurrency($grandTotal); ?>
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

function sendAllReports() {
    if (!confirm('Send reports to all agents via WhatsApp?')) {
        return;
    }
    
    const agentIds = <?php echo json_encode(array_column($agentReports, 'id')); ?>;
    let completed = 0;
    let failed = 0;
    
    agentIds.forEach((agentId, index) => {
        setTimeout(() => {
            $.ajax({
                url: SITE_URL + '/api/send_whatsapp.php',
                method: 'POST',
                data: { agent_id: agentId },
                success: function(response) {
                    if (response.success) {
                        completed++;
                    } else {
                        failed++;
                    }
                    
                    if (completed + failed === agentIds.length) {
                        alert('Completed: ' + completed + ' messages sent, ' + failed + ' failed.');
                    }
                },
                error: function() {
                    failed++;
                    if (completed + failed === agentIds.length) {
                        alert('Completed: ' + completed + ' messages sent, ' + failed + ' failed.');
                    }
                }
            });
        }, index * 2000);
    });
}
</script>

<?php include '../includes/footer.php'; ?>
