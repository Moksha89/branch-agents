<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!hasModuleAccess('agents')) {
    redirect(SITE_URL . '/dashboard.php');
}

$stmt = $pdo->query("
    SELECT 
        a.id,
        a.name,
        a.status,
        a.created_at,
        a.updated_at,
        GROUP_CONCAT(DISTINCT ap.phone ORDER BY ap.is_primary DESC SEPARATOR ', ') as phones,
        COALESCE(MAX(branch_data.branch_count), 0) as branch_count,
        COALESCE(MAX(branch_data.total_balance), 0) as total_balance
    FROM agents a
    LEFT JOIN agent_phones ap ON a.id = ap.agent_id
    LEFT JOIN (
        SELECT 
            agent_id,
            COUNT(id) as branch_count,
            SUM(balance) as total_balance
        FROM branches
        GROUP BY agent_id
    ) branch_data ON a.id = branch_data.agent_id
    GROUP BY a.id
    ORDER BY (a.status = 'active') DESC, a.name
");
$agents = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Agents Management</h1>
        <?php if ($has_full_access): ?>
        <button onclick="showCreateAgentModal()" class="btn btn-primary">+ Create New Agent</button>
        <?php endif; ?>
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
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($agents)): ?>
                    <tr>
                        <td colspan="7" class="text-center">No agents found. <a href="create.php">Create your first agent</a></td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($agents as $agent): ?>
                        <tr style="<?php echo ($agent['status'] != 'active') ? 'opacity: 0.6; background-color: #f8f9fa;' : ''; ?>">
                            <td><?php echo $agent['id']; ?></td>
                            <td>
                                <strong><?php echo htmlspecialchars($agent['name']); ?></strong>
                                <?php if ($agent['status'] != 'active'): ?>
                                    <span class="badge badge-secondary" style="margin-left: 5px; font-size: 10px; padding: 2px 6px; background: #6c757d; color: white; border-radius: 3px;">INACTIVE</span>
                                <?php endif; ?>
                            </td>
                            <td><?php echo htmlspecialchars($agent['phones'] ?? 'No phone'); ?></td>
                            <td><?php echo $agent['branch_count']; ?></td>
                            <td class="<?php echo $agent['total_balance'] < 0 ? 'text-success' : 'text-danger'; ?>">
                                <?php echo formatCurrency($agent['total_balance']); ?>
                            </td>
                            <td>
                                <span class="badge <?php echo ($agent['status'] == 'active') ? 'badge-success' : 'badge-secondary'; ?>" style="padding: 4px 8px; font-size: 11px;">
                                    <?php echo ($agent['status'] == 'active') ? 'Active' : 'Inactive'; ?>
                                </span>
                            </td>
                            <td>
                                <a href="view.php?id=<?php echo $agent['id']; ?>" class="btn btn-sm btn-info">View</a>
                                <?php if ($has_full_access): ?>
                                <button class="btn btn-sm btn-warning" onclick="showEditAgentModal(<?php echo $agent['id']; ?>, '<?php echo htmlspecialchars($agent['name'], ENT_QUOTES); ?>', <?php echo json_encode(explode(', ', $agent['phones'] ?? '')); ?>)">Edit</button>
                                <button onclick="toggleAgentStatus(<?php echo $agent['id']; ?>, <?php echo ($agent['status'] == 'active') ? 'true' : 'false'; ?>)" class="btn btn-sm <?php echo ($agent['status'] == 'active') ? 'btn-secondary' : 'btn-success'; ?>">
                                    <?php echo ($agent['status'] == 'active') ? 'Deactivate' : 'Activate'; ?>
                                </button>
                                <?php endif; ?>
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
let phoneNumberIndex = 1;
let editPhoneNumberIndex = 0;

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

function toggleAgentStatus(agentId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this agent?`)) {
        return;
    }
    
    $.ajax({
        url: SITE_URL + '/api/toggle_agent_status.php',
        method: 'POST',
        data: { agent_id: agentId },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('✓ ' + response.message);
                location.reload();
            } else {
                alert('✗ Error: ' + (response.error || 'Failed to toggle status'));
            }
        },
        error: function() {
            alert('✗ Error toggling agent status. Please try again.');
        }
    });
}

window.onclick = function(event) {
    const agentModal = document.getElementById('createAgentModal');
    if (event.target == agentModal) {
        closeCreateAgentModal();
    }
    const editModal = document.getElementById('editAgentModal');
    if (event.target == editModal) {
        closeEditAgentModal();
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

<script>
function toggleAgentStatus(agentId, newStatus) {
    const action = newStatus ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} this agent?`)) {
        return;
    }
    
    fetch('<?php echo SITE_URL; ?>/api/toggle_agent_active_status.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `agent_id=${agentId}&status=${newStatus}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            window.location.reload();
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred');
    });
}
</script>

<?php include '../includes/footer.php'; ?>
