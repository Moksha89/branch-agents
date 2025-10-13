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
    FROM branches b
    JOIN sites s ON b.site_id = s.id
    WHERE b.agent_id = ?
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
            <button class="btn btn-warning" onclick="showEditAgentModal(<?php echo $agentId; ?>, '<?php echo htmlspecialchars($agent['name'], ENT_QUOTES); ?>', <?php echo json_encode(explode(', ', $agent['phones'] ?? '')); ?>)">Edit Agent</button>
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

<!-- Edit Agent Modal -->
<div id="editAgentModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Edit Agent</h2>
            <span class="modal-close" onclick="closeEditAgentModal()">&times;</span>
        </div>
        <form id="editAgentForm">
            <input type="hidden" id="edit_agent_id" name="agent_id">
            <div class="modal-body">
                <div class="form-group">
                    <label for="edit_agent_name">Agent Name *</label>
                    <input type="text" id="edit_agent_name" name="name" required 
                           placeholder="e.g., John Doe" class="form-control">
                </div>
                
                <div class="form-group">
                    <label>Phone Numbers *</label>
                    <div id="editPhoneNumbersContainer">
                    </div>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="addEditPhoneNumber()">+ Add Phone Number</button>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeEditAgentModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Agent</button>
            </div>
        </form>
    </div>
</div>

<script>
const SITE_URL = '<?php echo SITE_URL; ?>';
let editPhoneNumberIndex = 0;

function showEditAgentModal(agentId, agentName, phones) {
    document.getElementById('edit_agent_id').value = agentId;
    document.getElementById('edit_agent_name').value = agentName;
    
    const container = document.getElementById('editPhoneNumbersContainer');
    container.innerHTML = '';
    editPhoneNumberIndex = 0;
    
    if (phones && phones.length > 0 && phones[0] !== '') {
        phones.forEach((phone, index) => {
            const row = document.createElement('div');
            row.className = 'phone-number-row';
            row.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
            row.innerHTML = `
                <input type="text" name="phones[]" required 
                       placeholder="Enter phone number" 
                       style="flex: 1;" value="${phone.trim()}">
                ${index > 0 ? '<button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">✗</button>' : ''}
            `;
            container.appendChild(row);
            editPhoneNumberIndex++;
        });
    } else {
        addEditPhoneNumber();
    }
    
    document.getElementById('editAgentModal').style.display = 'block';
    document.getElementById('edit_agent_name').focus();
}

function closeEditAgentModal() {
    document.getElementById('editAgentModal').style.display = 'none';
    document.getElementById('editAgentForm').reset();
}

function addEditPhoneNumber() {
    const container = document.getElementById('editPhoneNumbersContainer');
    const newRow = document.createElement('div');
    newRow.className = 'phone-number-row';
    newRow.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
    newRow.innerHTML = `
        <input type="text" name="phones[]" required 
               placeholder="Enter phone number" 
               style="flex: 1;">
        <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">✗</button>
    `;
    container.appendChild(newRow);
    editPhoneNumberIndex++;
}

window.onclick = function(event) {
    const editModal = document.getElementById('editAgentModal');
    if (event.target == editModal) {
        closeEditAgentModal();
    }
}

$('#editAgentForm').on('submit', function(e) {
    e.preventDefault();
    
    const formData = $(this).serialize();
    const $submitBtn = $(this).find('button[type="submit"]');
    const originalText = $submitBtn.text();
    
    $submitBtn.text('Updating...').prop('disabled', true);
    
    $.ajax({
        url: SITE_URL + '/api/update_agent.php',
        method: 'POST',
        data: formData,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('✓ Agent updated successfully!');
                location.reload();
            } else {
                alert('✗ Error: ' + (response.error || 'Failed to update agent'));
                $submitBtn.text(originalText).prop('disabled', false);
            }
        },
        error: function() {
            alert('✗ Error updating agent. Please try again.');
            $submitBtn.text(originalText).prop('disabled', false);
        }
    });
});
</script>

<?php include '../includes/footer.php'; ?>
