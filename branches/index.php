<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!hasModuleAccess('branches')) {
    redirect(SITE_URL . '/dashboard.php');
}

$accessible_branch_ids = getAccessibleBranchIds();
if (empty($accessible_branch_ids)) {
    $branches = [];
} else {
    $placeholders = implode(',', array_fill(0, count($accessible_branch_ids), '?'));
    $stmt = $pdo->prepare("
        SELECT 
            b.*,
            s.name as site_name,
            a.name as agent_name
        FROM branches b
        JOIN sites s ON b.site_id = s.id
        LEFT JOIN agents a ON b.agent_id = a.id
        WHERE b.id IN ($placeholders)
        ORDER BY s.name, b.branch_code
    ");
    $stmt->execute($accessible_branch_ids);
    $branches = $stmt->fetchAll();
}

$has_full_access = hasFullAccess('branches');

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Branches Management</h1>
        <?php if ($has_full_access): ?>
        <button onclick="showCreateBranchModal()" class="btn btn-primary">+ Create New Branch</button>
        <?php endif; ?>
    </div>
    
    <div class="table-responsive">
        <table class="table data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Site</th>
                    <th>Branch Code</th>
                    <th>Balance</th>
                    <th>Assigned Agent</th>
                    <th>Updated</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($branches)): ?>
                    <tr>
                        <td colspan="6" class="text-center">No branches found. <a href="create.php">Create your first branch</a></td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($branches as $branch): ?>
                        <tr>
                            <td><?php echo $branch['id']; ?></td>
                            <td><?php echo htmlspecialchars($branch['site_name']); ?></td>
                            <td><strong><?php echo htmlspecialchars($branch['branch_code']); ?></strong></td>
                            <td class="<?php echo $branch['balance'] < 0 ? 'text-success' : 'text-danger'; ?>">
                                <?php echo formatCurrency($branch['balance']); ?>
                            </td>
                            <td><?php echo htmlspecialchars($branch['agent_name'] ?? 'No agent'); ?></td>
                            <td><?php echo date('d-M-Y H:i', strtotime($branch['updated_at'])); ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<div id="createBranchModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Create New Branch</h2>
            <span class="modal-close" onclick="closeCreateBranchModal()">&times;</span>
        </div>
        <form id="createBranchForm">
            <div class="modal-body">
                <div class="form-group">
                    <label for="site_id">Site *</label>
                    <select id="site_id" name="site_id" required>
                        <option value="">-- Select Site --</option>
                        <?php
                        $sitesStmt = $pdo->query("SELECT id, name FROM sites ORDER BY name");
                        while ($site = $sitesStmt->fetch()) {
                            echo '<option value="'.$site['id'].'">'.htmlspecialchars($site['name']).'</option>';
                        }
                        ?>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="branch_code">Branch Code *</label>
                    <input type="text" id="branch_code" name="branch_code" required 
                           placeholder="e.g., BR001, BR002">
                </div>
                
                <div class="form-group">
                    <label for="balance">Initial Balance *</label>
                    <input type="number" id="balance" name="balance" step="0.01" required value="0">
                </div>
                
                <div class="form-group">
                    <label for="agent_id">Assign Agent (Optional)</label>
                    <select id="agent_id" name="agent_id">
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

<script>
const SITE_URL = '<?php echo SITE_URL; ?>';

function showCreateBranchModal() {
    document.getElementById('createBranchModal').style.display = 'block';
    document.getElementById('site_id').focus();
}

function closeCreateBranchModal() {
    document.getElementById('createBranchModal').style.display = 'none';
    document.getElementById('createBranchForm').reset();
}

window.onclick = function(event) {
    const branchModal = document.getElementById('createBranchModal');
    if (event.target == branchModal) {
        closeCreateBranchModal();
    }
}

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
</script>

<?php include '../includes/footer.php'; ?>
