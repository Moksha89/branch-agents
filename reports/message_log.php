<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$stmt = $pdo->query("
    SELECT 
        wl.id,
        wl.agent_name,
        wl.phone_number,
        wl.message_text,
        wl.status,
        wl.error_message,
        wl.sent_at
    FROM whatsapp_logs wl
    ORDER BY wl.sent_at DESC
");
$logs = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>📊 WhatsApp Message Log</h1>
        <p class="text-muted">History of all WhatsApp reports sent from the portal</p>
    </div>
    
    <div class="table-responsive">
        <table class="table data-table" id="message-log-table">
            <thead>
                <tr>
                    <th>Date & Time</th>
                    <th>Agent Name</th>
                    <th>Phone Number</th>
                    <th>Status</th>
                    <th>Message Preview</th>
                    <th>Error</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($logs)): ?>
                    <tr>
                        <td colspan="7" class="text-center">No messages sent yet</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($logs as $log): ?>
                        <tr>
                            <td><?php echo date('d-M-Y h:i A', strtotime($log['sent_at'])); ?></td>
                            <td><strong><?php echo htmlspecialchars($log['agent_name']); ?></strong></td>
                            <td><?php echo htmlspecialchars($log['phone_number']); ?></td>
                            <td>
                                <?php if ($log['status'] === 'success'): ?>
                                    <span class="badge" style="background: #28a745; color: white; padding: 5px 10px; border-radius: 4px;">✓ Sent</span>
                                <?php else: ?>
                                    <span class="badge" style="background: #dc3545; color: white; padding: 5px 10px; border-radius: 4px;">✗ Failed</span>
                                <?php endif; ?>
                            </td>
                            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                <?php echo htmlspecialchars(substr($log['message_text'], 0, 100)); ?>
                                <?php if (strlen($log['message_text']) > 100): ?>...<?php endif; ?>
                            </td>
                            <td>
                                <?php if ($log['error_message']): ?>
                                    <span class="text-danger" style="font-size: 12px;">
                                        <?php echo htmlspecialchars($log['error_message']); ?>
                                    </span>
                                <?php else: ?>
                                    <span class="text-muted">-</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <button onclick="viewFullMessage(<?php echo $log['id']; ?>)" class="btn btn-sm btn-secondary">
                                    👁️ View
                                </button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<div id="messageModal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 600px;">
        <span class="close" onclick="closeMessageModal()">&times;</span>
        <h3>Full Message Content</h3>
        <pre id="fullMessageText" style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 4px; max-height: 500px; overflow-y: auto;"></pre>
    </div>
</div>

<script>
const SITE_URL = '<?php echo SITE_URL; ?>';
const messageLogs = <?php echo json_encode($logs); ?>;

function viewFullMessage(logId) {
    const log = messageLogs.find(l => l.id == logId);
    if (log) {
        document.getElementById('fullMessageText').textContent = log.message_text;
        document.getElementById('messageModal').style.display = 'block';
    }
}

function closeMessageModal() {
    document.getElementById('messageModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('messageModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}
</script>

<style>
.modal {
    display: none;
    position: fixed;
    z-index: 9999;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0,0,0,0.4);
}

.modal-content {
    background-color: #fefefe;
    margin: 5% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 600px;
    border-radius: 8px;
    position: relative;
}

.close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
}

.close:hover,
.close:focus {
    color: #000;
}
</style>

<?php include '../includes/footer.php'; ?>
