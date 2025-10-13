<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$stmt = $pdo->query("
    SELECT 
        a.*,
        GROUP_CONCAT(DISTINCT ap.phone ORDER BY ap.is_primary DESC SEPARATOR ', ') as phones,
        COUNT(DISTINCT b.id) as branch_count,
        COALESCE(SUM(b.balance), 0) as total_balance
    FROM agents a
    LEFT JOIN agent_phones ap ON a.id = ap.agent_id
    LEFT JOIN branches b ON b.agent_id = a.id
    GROUP BY a.id
    ORDER BY a.name
");
$agents = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Agents Management</h1>
        <button onclick="showCreateAgentModal()" class="btn btn-primary">+ Create New Agent</button>
    </div>
    
    <div class="table-responsive">
        <table class="table data-table">
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

<div id="createAgentModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Create New Agent</h2>
            <span class="modal-close" onclick="closeCreateAgentModal()">&times;</span>
        </div>
        <form id="createAgentForm">
            <div class="modal-body">
                <div class="form-group">
                    <label for="agent_name">Agent Name *</label>
                    <input type="text" id="agent_name" name="name" required 
                           placeholder="e.g., John Doe">
                </div>
                
                <div class="form-group">
                    <label>Phone Numbers *</label>
                    <div id="phoneNumbersContainer">
                        <div class="phone-number-row" style="display: flex; gap: 10px; margin-bottom: 10px;">
                            <input type="text" name="phones[]" required 
                                   placeholder="Enter phone number" 
                                   style="flex: 1;">
                            <label style="display: flex; align-items: center; gap: 5px;">
                                <input type="radio" name="primary_index" value="0" checked>
                                <span>Primary</span>
                            </label>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="addPhoneNumber()">+ Add Phone Number</button>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeCreateAgentModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Agent</button>
            </div>
        </form>
    </div>
</div>

<script>
const SITE_URL = '<?php echo SITE_URL; ?>';
let phoneNumberIndex = 1;

function showCreateAgentModal() {
    document.getElementById('createAgentModal').style.display = 'block';
    document.getElementById('agent_name').focus();
}

function closeCreateAgentModal() {
    document.getElementById('createAgentModal').style.display = 'none';
    document.getElementById('createAgentForm').reset();
    const container = document.getElementById('phoneNumbersContainer');
    container.innerHTML = `
        <div class="phone-number-row" style="display: flex; gap: 10px; margin-bottom: 10px;">
            <input type="text" name="phones[]" required 
                   placeholder="Enter phone number" 
                   style="flex: 1;">
            <label style="display: flex; align-items: center; gap: 5px;">
                <input type="radio" name="primary_index" value="0" checked>
                <span>Primary</span>
            </label>
        </div>
    `;
    phoneNumberIndex = 1;
}

function addPhoneNumber() {
    const container = document.getElementById('phoneNumbersContainer');
    const newRow = document.createElement('div');
    newRow.className = 'phone-number-row';
    newRow.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
    newRow.innerHTML = `
        <input type="text" name="phones[]" required 
               placeholder="Enter phone number" 
               style="flex: 1;">
        <label style="display: flex; align-items: center; gap: 5px;">
            <input type="radio" name="primary_index" value="${phoneNumberIndex}">
            <span>Primary</span>
        </label>
        <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">✗</button>
    `;
    container.appendChild(newRow);
    phoneNumberIndex++;
}

window.onclick = function(event) {
    const agentModal = document.getElementById('createAgentModal');
    if (event.target == agentModal) {
        closeCreateAgentModal();
    }
}

$('#createAgentForm').on('submit', function(e) {
    e.preventDefault();
    
    const formData = $(this).serialize();
    const $submitBtn = $(this).find('button[type="submit"]');
    const originalText = $submitBtn.text();
    
    $submitBtn.text('Creating...').prop('disabled', true);
    
    $.ajax({
        url: SITE_URL + '/api/create_agent.php',
        method: 'POST',
        data: formData,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('✓ Agent created successfully!');
                location.reload();
            } else {
                alert('✗ Error: ' + (response.error || 'Failed to create agent'));
                $submitBtn.text(originalText).prop('disabled', false);
            }
        },
        error: function() {
            alert('✗ Error creating agent. Please try again.');
            $submitBtn.text(originalText).prop('disabled', false);
        }
    });
});
</script>

<?php include '../includes/footer.php'; ?>
