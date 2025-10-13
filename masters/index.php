<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$stmt = $pdo->query("
    SELECT *
    FROM masters
    ORDER BY name
");
$masters = $stmt->fetchAll();

$stmt = $pdo->query("
    SELECT 
        a.id,
        a.name as agent_name,
        GROUP_CONCAT(DISTINCT ap.phone ORDER BY ap.is_primary DESC SEPARATOR ', ') as phones
    FROM agents a
    LEFT JOIN agent_phones ap ON a.id = ap.agent_id
    GROUP BY a.id
    ORDER BY a.name
");
$agents = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Masters Management</h1>
        <button onclick="showCreateMasterModal()" class="btn btn-primary">+ Create New Master</button>
    </div>
    
    <div class="table-responsive">
        <table class="table data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Master Name</th>
                    <th>Mobile Number</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($masters)): ?>
                    <tr>
                        <td colspan="5" class="text-center">No masters found. Create your first master above.</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($masters as $master): ?>
                        <tr>
                            <td><?php echo $master['id']; ?></td>
                            <td><strong><?php echo htmlspecialchars($master['name']); ?></strong></td>
                            <td><?php echo htmlspecialchars($master['mobile_number']); ?></td>
                            <td><?php echo date('d-M-Y', strtotime($master['created_at'])); ?></td>
                            <td>
                                <button onclick="deleteMaster(<?php echo $master['id']; ?>, '<?php echo htmlspecialchars($master['name']); ?>')" 
                                        class="btn btn-sm btn-danger">Delete</button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>

    <?php if (!empty($masters) && !empty($agents)): ?>
    <div class="page-header" style="margin-top: 40px;">
        <h2>Send Agent Reports to Masters</h2>
        <p class="text-muted">Select masters, agents, and format to send reports via WhatsApp</p>
    </div>

    <div class="card" style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
        <div class="row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px;">
            <div>
                <h3 style="margin-bottom: 15px;">Select Masters</h3>
                <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; background: white; border-radius: 4px;">
                    <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <input type="checkbox" id="select-all-masters" onchange="toggleSelectAllMasters(this)">
                        <strong>Select All</strong>
                    </label>
                    <hr style="margin: 10px 0;">
                    <?php foreach ($masters as $master): ?>
                    <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <input type="checkbox" class="master-checkbox" value="<?php echo $master['id']; ?>" 
                               data-name="<?php echo htmlspecialchars($master['name']); ?>"
                               data-phone="<?php echo htmlspecialchars($master['mobile_number']); ?>">
                        <span><?php echo htmlspecialchars($master['name']); ?> (<?php echo htmlspecialchars($master['mobile_number']); ?>)</span>
                    </label>
                    <?php endforeach; ?>
                </div>
            </div>

            <div>
                <h3 style="margin-bottom: 15px;">Select Agents</h3>
                <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; background: white; border-radius: 4px;">
                    <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <input type="checkbox" id="select-all-agents" onchange="toggleSelectAllAgents(this)">
                        <strong>Select All</strong>
                    </label>
                    <hr style="margin: 10px 0;">
                    <?php foreach ($agents as $agent): ?>
                    <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <input type="checkbox" class="agent-checkbox" value="<?php echo $agent['id']; ?>"
                               data-name="<?php echo htmlspecialchars($agent['agent_name']); ?>">
                        <span><?php echo htmlspecialchars($agent['agent_name']); ?></span>
                    </label>
                    <?php endforeach; ?>
                </div>
            </div>

            <div>
                <h3 style="margin-bottom: 15px;">Select Format</h3>
                <div style="border: 1px solid #ddd; padding: 10px; background: white; border-radius: 4px;">
                    <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 8px; border-radius: 4px; cursor: pointer;" class="format-option">
                        <input type="radio" name="format" value="text_image" checked>
                        <div>
                            <strong>Text + Image</strong>
                            <p style="margin: 0; font-size: 12px; color: #666;">Send both message text and branch details image</p>
                        </div>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 8px; border-radius: 4px; cursor: pointer;" class="format-option">
                        <input type="radio" name="format" value="text_only">
                        <div>
                            <strong>Text Only</strong>
                            <p style="margin: 0; font-size: 12px; color: #666;">Send only message text without image</p>
                        </div>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 4px; cursor: pointer;" class="format-option">
                        <input type="radio" name="format" value="image_only">
                        <div>
                            <strong>Image Only</strong>
                            <p style="margin: 0; font-size: 12px; color: #666;">Send only branch details image</p>
                        </div>
                    </label>
                </div>

                <button onclick="sendReportsToMasters()" class="btn btn-success" style="width: 100%; margin-top: 20px; padding: 12px;">
                    📱 Send Reports
                </button>
            </div>
        </div>
    </div>
    <?php endif; ?>
</div>

<div id="createMasterModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Create New Master</h2>
            <span class="modal-close" onclick="closeCreateMasterModal()">&times;</span>
        </div>
        <form id="createMasterForm">
            <div class="modal-body">
                <div class="form-group">
                    <label for="master_name">Master Name *</label>
                    <input type="text" id="master_name" name="name" required 
                           placeholder="e.g., Regional Manager">
                </div>
                
                <div class="form-group">
                    <label for="master_mobile">Mobile Number *</label>
                    <input type="text" id="master_mobile" name="mobile_number" required 
                           placeholder="e.g., 9999999999" pattern="[0-9]{10}">
                    <small class="form-text text-muted">Enter 10-digit mobile number</small>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeCreateMasterModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Master</button>
            </div>
        </form>
    </div>
</div>

<script>
const SITE_URL = '<?php echo SITE_URL; ?>';

function showCreateMasterModal() {
    document.getElementById('createMasterModal').style.display = 'block';
    document.getElementById('master_name').focus();
}

function closeCreateMasterModal() {
    document.getElementById('createMasterModal').style.display = 'none';
    document.getElementById('createMasterForm').reset();
}

function toggleSelectAllMasters(checkbox) {
    document.querySelectorAll('.master-checkbox').forEach(cb => cb.checked = checkbox.checked);
}

function toggleSelectAllAgents(checkbox) {
    document.querySelectorAll('.agent-checkbox').forEach(cb => cb.checked = checkbox.checked);
}

window.onclick = function(event) {
    const modal = document.getElementById('createMasterModal');
    if (event.target == modal) {
        closeCreateMasterModal();
    }
}

$('#createMasterForm').on('submit', function(e) {
    e.preventDefault();
    
    const formData = $(this).serialize();
    const $submitBtn = $(this).find('button[type="submit"]');
    const originalText = $submitBtn.text();
    
    $submitBtn.text('Creating...').prop('disabled', true);
    
    $.ajax({
        url: SITE_URL + '/api/create_master.php',
        method: 'POST',
        data: formData,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('✓ Master created successfully!');
                location.reload();
            } else {
                alert('✗ Error: ' + (response.error || 'Failed to create master'));
                $submitBtn.text(originalText).prop('disabled', false);
            }
        },
        error: function() {
            alert('✗ Error creating master. Please try again.');
            $submitBtn.text(originalText).prop('disabled', false);
        }
    });
});

function deleteMaster(id, name) {
    if (!confirm('Are you sure you want to delete master "' + name + '"?')) {
        return;
    }
    
    $.ajax({
        url: SITE_URL + '/api/delete_master.php',
        method: 'POST',
        data: { id: id },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('✓ Master deleted successfully!');
                location.reload();
            } else {
                alert('✗ Error: ' + (response.error || 'Failed to delete master'));
            }
        },
        error: function() {
            alert('✗ Error deleting master. Please try again.');
        }
    });
}

function sendReportsToMasters() {
    const selectedMasters = Array.from(document.querySelectorAll('.master-checkbox:checked'));
    const selectedAgents = Array.from(document.querySelectorAll('.agent-checkbox:checked'));
    const format = document.querySelector('input[name="format"]:checked').value;
    
    if (selectedMasters.length === 0) {
        alert('Please select at least one master');
        return;
    }
    
    if (selectedAgents.length === 0) {
        alert('Please select at least one agent');
        return;
    }
    
    if (!confirm(`Send ${selectedAgents.length} agent report(s) to ${selectedMasters.length} master(s) via WhatsApp?\n\nFormat: ${format.replace('_', ' ')}`)) {
        return;
    }
    
    const masters = selectedMasters.map(cb => ({
        id: cb.value,
        name: cb.dataset.name,
        phone: cb.dataset.phone
    }));
    const agentIds = selectedAgents.map(cb => parseInt(cb.value));
    
    proceedWithMasterSend(masters, agentIds, format);
}

function proceedWithMasterSend(masters, agentIds, format) {
    let completed = 0;
    let failed = 0;
    let failedSends = [];
    const totalSends = masters.length * agentIds.length;
    
    const progressMsg = document.createElement('div');
    progressMsg.id = 'master-send-progress';
    progressMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #007bff; color: white; padding: 15px 20px; border-radius: 4px; z-index: 10000; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
    progressMsg.innerHTML = '<strong>📱 Sending reports to masters...</strong><br>Progress: 0/' + totalSends;
    document.body.appendChild(progressMsg);
    
    let sendIndex = 0;
    masters.forEach(master => {
        agentIds.forEach(agentId => {
            setTimeout(() => {
                $.ajax({
                    url: SITE_URL + '/api/send_whatsapp_to_master.php',
                    method: 'POST',
                    data: { 
                        master_phone: master.phone,
                        master_name: master.name,
                        agent_id: agentId,
                        format: format
                    },
                    dataType: 'json',
                    success: function(response) {
                        if (response.success) {
                            completed++;
                        } else {
                            failed++;
                            failedSends.push({ master: master.name, agent: agentId, error: response.error });
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
                        failedSends.push({ master: master.name, agent: agentId, error: errorMsg });
                        updateProgress();
                    }
                });
            }, sendIndex * 2000);
            sendIndex++;
        });
    });
    
    function updateProgress() {
        progressMsg.innerHTML = '<strong>📱 Sending reports to masters...</strong><br>Progress: ' + (completed + failed) + '/' + totalSends;
        
        if (completed + failed === totalSends) {
            document.body.removeChild(progressMsg);
            
            let message = '✅ Completed: ' + completed + ' messages sent';
            if (failed > 0) {
                message += '\n❌ Failed: ' + failed + ' messages';
                if (failedSends.length > 0 && failedSends.length <= 10) {
                    message += '\n\nFailed sends:\n' + failedSends.map(s => '- ' + s.master + ' (Agent ' + s.agent + '): ' + s.error).join('\n');
                }
            }
            alert(message);
        }
    }
}
</script>

<style>
.format-option:hover {
    background: #f0f0f0;
}
</style>

<?php include '../includes/footer.php'; ?>
