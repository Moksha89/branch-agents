<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$siteId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($siteId <= 0) {
    redirect(SITE_URL . '/sites/index.php');
}

$stmt = $pdo->prepare("SELECT * FROM sites WHERE id = ?");
$stmt->execute([$siteId]);
$site = $stmt->fetch();

if (!$site) {
    redirect(SITE_URL . '/sites/index.php');
}

$stmt = $pdo->prepare("
    SELECT 
        b.*,
        a.name as agent_name,
        ap.phone as agent_phone
    FROM branches b
    LEFT JOIN agents a ON b.agent_id = a.id
    LEFT JOIN (
        SELECT agent_id, MIN(phone) as phone 
        FROM agent_phones 
        GROUP BY agent_id
    ) ap ON a.id = ap.agent_id
    WHERE b.site_id = ?
    ORDER BY b.branch_code
");
$stmt->execute([$siteId]);
$branches = $stmt->fetchAll();

$totalBalance = array_sum(array_column($branches, 'balance'));

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Site: <?php echo htmlspecialchars($site['name']); ?></h1>
        <div>
            <button onclick="showCreateBranchModal()" class="btn btn-primary">+ Create Branch</button>
            <button type="button" class="btn btn-success" onclick="showBulkUpdateModal()">💰 Bulk Update Amounts</button>
            <a href="index.php" class="btn btn-secondary">← Back to Sites</a>
        </div>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon bg-green">
                <i class="icon-branch"></i>
            </div>
            <div class="stat-details">
                <h3><?php echo count($branches); ?></h3>
                <p>Total Branches</p>
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
    
    <div class="table-responsive">
        <h2>Branches</h2>
        <table class="table data-table" id="branchesTable">
            <thead>
                <tr>
                    <th>Branch Code</th>
                    <th>Balance</th>
                    <th>Assigned Agent</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($branches)): ?>
                    <tr>
                        <td colspan="5" class="text-center">No branches found. Click the "+ Create Branch" button above to add one.</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($branches as $branch): ?>
                        <tr data-branch-id="<?php echo $branch['id']; ?>">
                            <td><strong><?php echo htmlspecialchars($branch['branch_code']); ?></strong></td>
                            <td>
                                <span class="balance-display <?php echo $branch['balance'] < 0 ? 'text-danger' : 'text-success'; ?>" 
                                      id="balance-display-<?php echo $branch['id']; ?>">
                                    <?php echo formatCurrency($branch['balance']); ?>
                                </span>
                                <span class="balance-edit-controls" id="balance-edit-<?php echo $branch['id']; ?>" style="display: none;">
                                    <input type="number" step="0.01" class="form-control form-control-sm d-inline-block" 
                                           id="balance-input-<?php echo $branch['id']; ?>" 
                                           value="<?php echo $branch['balance']; ?>" 
                                           style="width: 150px;">
                                    <button class="btn btn-sm btn-success" onclick="saveBalance(<?php echo $branch['id']; ?>)">✓ OK</button>
                                    <button class="btn btn-sm btn-secondary" onclick="cancelEditBalance(<?php echo $branch['id']; ?>)">✗</button>
                                </span>
                            </td>
                            <td><?php echo $branch['agent_name'] ? htmlspecialchars($branch['agent_name'] . ' (' . $branch['agent_phone'] . ')') : 'No agent'; ?></td>
                            <td><?php echo date('d-M-Y H:i', strtotime($branch['updated_at'])); ?></td>
                            <td>
                                <button class="btn btn-sm btn-warning" onclick="editBalance(<?php echo $branch['id']; ?>)">✏️ Edit Amount</button>
                                <a href="../branches/edit.php?id=<?php echo $branch['id']; ?>" class="btn btn-sm btn-info">Edit Branch</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
            <?php if (!empty($branches)): ?>
            <tfoot>
                <tr style="background: #f8f9fa; font-weight: bold;">
                    <td>TOTAL</td>
                    <td class="<?php echo $totalBalance < 0 ? 'text-danger' : 'text-success'; ?>">
                        <?php echo formatCurrency($totalBalance); ?>
                    </td>
                    <td colspan="3"></td>
                </tr>
            </tfoot>
            <?php endif; ?>
        </table>
    </div>
</div>

<!-- Create Branch Modal -->
<div id="createBranchModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Create New Branch</h2>
            <span class="modal-close" onclick="closeCreateBranchModal()">&times;</span>
        </div>
        <form id="createBranchForm">
            <input type="hidden" name="site_id" value="<?php echo $siteId; ?>">
            <div class="modal-body">
                <div class="form-group">
                    <label>Site</label>
                    <input type="text" value="<?php echo htmlspecialchars($site['name']); ?>" disabled class="form-control">
                    <small>Branch will be created under this site</small>
                </div>
                
                <div class="form-group">
                    <label for="branch_code">Branch Code *</label>
                    <input type="text" id="branch_code" name="branch_code" required 
                           placeholder="e.g., BR001, BR002" class="form-control">
                </div>
                
                <div class="form-group">
                    <label for="balance">Initial Balance *</label>
                    <input type="number" id="balance" name="balance" step="0.01" required value="0" class="form-control">
                </div>
                
                <div class="form-group">
                    <label for="agent_id">Assign Agent (Optional)</label>
                    <select id="agent_id" name="agent_id" class="form-control">
                        <option value="">-- No Agent --</option>
                        <?php
                        $agentsStmt = $pdo->query("SELECT id, name FROM agents ORDER BY name");
                        while ($agent = $agentsStmt->fetch()) {
                            echo '<option value="'.$agent['id'].'">'.htmlspecialchars($agent['name']).'</option>';
                        }
                        ?>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeCreateBranchModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Branch</button>
            </div>
        </form>
    </div>
</div>

<!-- Bulk Update Modal -->
<div id="bulkUpdateModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999;">
    <div style="background: white; width: 90%; max-width: 800px; margin: 50px auto; padding: 30px; border-radius: 10px; max-height: 80vh; overflow-y: auto;">
        <h2>Bulk Update Branch Balances</h2>
        <p>Update multiple branch balances at once. Leave fields blank to keep current values.</p>
        
        <form id="bulkUpdateForm">
            <table class="table">
                <thead>
                    <tr>
                        <th>Branch Code</th>
                        <th>Current Balance</th>
                        <th>New Balance</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($branches as $branch): ?>
                        <tr>
                            <td><strong><?php echo htmlspecialchars($branch['branch_code']); ?></strong></td>
                            <td class="<?php echo $branch['balance'] < 0 ? 'text-danger' : 'text-success'; ?>">
                                <?php echo formatCurrency($branch['balance']); ?>
                            </td>
                            <td>
                                <input type="number" step="0.01" class="form-control" 
                                       name="balance[<?php echo $branch['id']; ?>]" 
                                       placeholder="Leave blank to skip">
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            
            <div style="text-align: right; margin-top: 20px;">
                <button type="button" class="btn btn-secondary" onclick="closeBulkUpdateModal()">Cancel</button>
                <button type="submit" class="btn btn-success">💰 Update All</button>
            </div>
        </form>
    </div>
</div>

<script>
const SITE_URL = '<?php echo SITE_URL; ?>';
const SITE_ID = <?php echo $siteId; ?>;

function showCreateBranchModal() {
    document.getElementById('createBranchModal').style.display = 'block';
    document.getElementById('branch_code').focus();
}

function closeCreateBranchModal() {
    document.getElementById('createBranchModal').style.display = 'none';
    document.getElementById('createBranchForm').reset();
}

function editBalance(branchId) {
    document.getElementById('balance-display-' + branchId).style.display = 'none';
    document.getElementById('balance-edit-' + branchId).style.display = 'inline-block';
    document.getElementById('balance-input-' + branchId).focus();
}

function cancelEditBalance(branchId) {
    document.getElementById('balance-display-' + branchId).style.display = 'inline-block';
    document.getElementById('balance-edit-' + branchId).style.display = 'none';
}

function saveBalance(branchId) {
    const newBalance = document.getElementById('balance-input-' + branchId).value;
    
    $.ajax({
        url: SITE_URL + '/api/update_balance.php',
        method: 'POST',
        data: {
            branch_id: branchId,
            balance: newBalance
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                location.reload();
            } else {
                alert('Error: ' + (response.error || 'Failed to update balance'));
            }
        },
        error: function() {
            alert('Failed to update balance. Please try again.');
        }
    });
}

function showBulkUpdateModal() {
    document.getElementById('bulkUpdateModal').style.display = 'block';
}

function closeBulkUpdateModal() {
    document.getElementById('bulkUpdateModal').style.display = 'none';
}

$('#bulkUpdateForm').on('submit', function(e) {
    e.preventDefault();
    
    const formData = $(this).serializeArray();
    const updates = [];
    
    formData.forEach(function(item) {
        if (item.value !== '') {
            const branchId = item.name.match(/\[(\d+)\]/)[1];
            updates.push({
                branch_id: branchId,
                balance: item.value
            });
        }
    });
    
    if (updates.length === 0) {
        alert('No changes to save.');
        return;
    }
    
    $.ajax({
        url: SITE_URL + '/api/bulk_update_balances.php',
        method: 'POST',
        data: JSON.stringify(updates),
        contentType: 'application/json',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('Updated ' + response.updated + ' branch(es) successfully!');
                location.reload();
            } else {
                alert('Error: ' + (response.error || 'Failed to update balances'));
            }
        },
        error: function() {
            alert('Failed to update balances. Please try again.');
        }
    });
});

$('#createBranchForm').on('submit', function(e) {
    e.preventDefault();
    
    const formData = $(this).serialize();
    const $submitBtn = $(this).find('button[type="submit"]');
    const originalText = $submitBtn.text();
    
    $submitBtn.text('Creating...').prop('disabled', true);
    
    $.ajax({
        url: SITE_URL + '/api/create_branch.php',
        method: 'POST',
        data: formData,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('✓ Branch created successfully!');
                location.reload();
            } else {
                alert('✗ Error: ' + (response.error || 'Failed to create branch'));
                $submitBtn.text(originalText).prop('disabled', false);
            }
        },
        error: function() {
            alert('✗ Error creating branch. Please try again.');
            $submitBtn.text(originalText).prop('disabled', false);
        }
    });
});

window.onclick = function(event) {
    const branchModal = document.getElementById('createBranchModal');
    if (event.target == branchModal) {
        closeCreateBranchModal();
    }
    const bulkModal = document.getElementById('bulkUpdateModal');
    if (event.target == bulkModal) {
        closeBulkUpdateModal();
    }
}
</script>

<?php include '../includes/footer.php'; ?>
