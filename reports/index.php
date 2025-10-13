<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$stmt = $pdo->query("
    SELECT 
        a.id,
        a.name as agent_name,
        GROUP_CONCAT(DISTINCT ap.phone ORDER BY ap.is_primary DESC SEPARATOR ', ') as phones,
        COUNT(DISTINCT b.id) as branch_count,
        GROUP_CONCAT(DISTINCT
            CONCAT(s.name, ' - ', b.branch_code, ': ', b.balance) 
            ORDER BY s.name, b.branch_code SEPARATOR ' | '
        ) as branch_details,
        COALESCE(SUM(b.balance), 0) as total_balance
    FROM agents a
    LEFT JOIN agent_phones ap ON a.id = ap.agent_id
    LEFT JOIN branches b ON b.agent_id = a.id
    LEFT JOIN sites s ON b.site_id = s.id
    WHERE a.is_active = TRUE
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
        <div style="display: flex; gap: 10px;">
            <button onclick="sendSelectedReports()" class="btn btn-primary" id="send-selected-btn" disabled>📱 Send to Selected Agents</button>
            <button onclick="sendAllReports()" class="btn btn-success">📱 Send All Reports to WhatsApp</button>
        </div>
    </div>
    
    <div class="table-responsive">
        <table class="table data-table">
            <thead>
                <tr>
                    <th style="width: 40px;">
                        <input type="checkbox" id="select-all" onchange="toggleSelectAll(this)">
                    </th>
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
                        <td colspan="7" class="text-center">No reports available</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($agentReports as $report): ?>
                        <tr>
                            <td><input type="checkbox" class="agent-checkbox" value="<?php echo $report['id']; ?>" onchange="updateSelectedCount()"></td>
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
                <?php endif; ?>
            </tbody>
            <?php if (!empty($agentReports)): ?>
            <tfoot>
                <tr style="background: #f8f9fa; font-weight: bold;">
                    <td colspan="4" class="text-right">GRAND TOTAL:</td>
                    <td class="<?php echo $grandTotal < 0 ? 'text-danger' : 'text-success'; ?>">
                        <?php echo formatCurrency($grandTotal); ?>
                    </td>
                    <td></td>
                </tr>
            </tfoot>
            <?php endif; ?>
        </table>
    </div>
</div>

<script>
const SITE_URL = '<?php echo SITE_URL; ?>';

function toggleSelectAll(checkbox) {
    const agentCheckboxes = document.querySelectorAll('.agent-checkbox');
    agentCheckboxes.forEach(cb => cb.checked = checkbox.checked);
    updateSelectedCount();
}

function updateSelectedCount() {
    const selectedCheckboxes = document.querySelectorAll('.agent-checkbox:checked');
    const sendSelectedBtn = document.getElementById('send-selected-btn');
    
    if (selectedCheckboxes.length > 0) {
        sendSelectedBtn.disabled = false;
        sendSelectedBtn.textContent = `📱 Send to Selected Agents (${selectedCheckboxes.length})`;
    } else {
        sendSelectedBtn.disabled = true;
        sendSelectedBtn.textContent = '📱 Send to Selected Agents';
    }
}

function sendSelectedReports() {
    const selectedCheckboxes = document.querySelectorAll('.agent-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        alert('Please select at least one agent');
        return;
    }
    
    const whatsappToken = localStorage.getItem('whatsapp_session_token');
    if (!whatsappToken) {
        alert('❌ WhatsApp is not connected. Please connect WhatsApp in Settings → WhatsApp Connection first.');
        return;
    }
    
    if (!confirm(`Send reports to ${selectedCheckboxes.length} selected agent(s) via WhatsApp?`)) {
        return;
    }
    
    $.ajax({
        url: SITE_URL + '/api/save_whatsapp_token.php',
        method: 'POST',
        data: { session_token: whatsappToken },
        success: function() {
            const selectedAgentIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
            proceedWithBulkSend(selectedAgentIds);
        },
        error: function() {
            alert('❌ Failed to sync WhatsApp session. Please try again.');
        }
    });
}

function sendAllReports() {
    const whatsappToken = localStorage.getItem('whatsapp_session_token');
    if (!whatsappToken) {
        alert('❌ WhatsApp is not connected. Please connect WhatsApp in Settings → WhatsApp Connection first.');
        return;
    }
    
    if (!confirm('Send reports to all agents via WhatsApp?')) {
        return;
    }
    
    $.ajax({
        url: SITE_URL + '/api/save_whatsapp_token.php',
        method: 'POST',
        data: { session_token: whatsappToken },
        success: function() {
            proceedWithBulkSend();
        },
        error: function() {
            alert('❌ Failed to sync WhatsApp session. Please try again.');
        }
    });
}

function proceedWithBulkSend(agentIds = null) {
    if (!agentIds) {
        agentIds = <?php echo json_encode(array_column($agentReports, 'id')); ?>;
    }
    let completed = 0;
    let failed = 0;
    let failedAgents = [];
    
    const progressMsg = document.createElement('div');
    progressMsg.id = 'bulk-send-progress';
    progressMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #007bff; color: white; padding: 15px 20px; border-radius: 4px; z-index: 10000; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
    progressMsg.innerHTML = '<strong>📱 Sending reports...</strong><br>Progress: 0/' + agentIds.length;
    document.body.appendChild(progressMsg);
    
    agentIds.forEach((agentId, index) => {
        setTimeout(() => {
            $.ajax({
                url: SITE_URL + '/api/send_whatsapp.php',
                method: 'POST',
                data: { agent_id: agentId },
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        completed++;
                    } else {
                        failed++;
                        failedAgents.push({ id: agentId, error: response.error });
                    }
                    updateProgress();
                },
                error: function(xhr) {
                    failed++;
                    let errorMsg = 'Network error';
                    try {
                        const response = JSON.parse(xhr.responseText);
                        errorMsg = response.error || errorMsg;
                    } catch(e) {}
                    failedAgents.push({ id: agentId, error: errorMsg });
                    updateProgress();
                }
            });
        }, index * 2000);
    });
    
    function updateProgress() {
        progressMsg.innerHTML = '<strong>📱 Sending reports...</strong><br>Progress: ' + (completed + failed) + '/' + agentIds.length;
        
        if (completed + failed === agentIds.length) {
            document.body.removeChild(progressMsg);
            
            let message = '✅ Completed: ' + completed + ' messages sent';
            if (failed > 0) {
                message += '\n❌ Failed: ' + failed + ' messages';
                if (failedAgents.length > 0) {
                    message += '\n\nFailed agents:\n' + failedAgents.map(a => '- Agent ID ' + a.id + ': ' + a.error).join('\n');
                }
            }
            alert(message);
        }
    }
}
</script>

<?php include '../includes/footer.php'; ?>
