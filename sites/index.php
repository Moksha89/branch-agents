<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$stmt = $pdo->query("
    SELECT 
        s.*,
        COUNT(DISTINCT b.id) as branch_count,
        COUNT(DISTINCT b.agent_id) as agent_count,
        COALESCE(SUM(b.balance), 0) as total_balance
    FROM sites s
    LEFT JOIN branches b ON s.id = b.site_id
    GROUP BY s.id
    ORDER BY s.name
");
$sites = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Sites Management</h1>
        <button onclick="showCreateSiteModal()" class="btn btn-primary">+ Create New Site</button>
    </div>
    
    <div class="table-responsive">
        <table class="table data-table" id="sitesTable">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Site Name</th>
                    <th>Branches</th>
                    <th>Agents</th>
                    <th>Total Balance</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($sites)): ?>
                    <tr>
                        <td colspan="7" class="text-center">No sites found. <a href="javascript:void(0)" onclick="showCreateSiteModal()">Create your first site</a></td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($sites as $site): ?>
                        <tr>
                            <td><?php echo $site['id']; ?></td>
                            <td><strong><?php echo htmlspecialchars($site['name']); ?></strong></td>
                            <td><?php echo $site['branch_count']; ?></td>
                            <td><?php echo $site['agent_count']; ?></td>
                            <td class="<?php echo $site['total_balance'] < 0 ? 'text-success' : 'text-danger'; ?>">
                                <?php echo formatCurrency($site['total_balance']); ?>
                            </td>
                            <td><?php echo date('d-M-Y', strtotime($site['created_at'])); ?></td>
                            <td>
                                <a href="view.php?id=<?php echo $site['id']; ?>" class="btn btn-sm btn-info">View</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<div id="createSiteModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Create New Site</h2>
            <span class="modal-close" onclick="closeCreateSiteModal()">&times;</span>
        </div>
        <form id="createSiteForm">
            <div class="modal-body">
                <div class="form-group">
                    <label for="site_name">Site Name *</label>
                    <input type="text" id="site_name" name="name" required 
                           placeholder="e.g., JAI, KALKI, VVBOOK">
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeCreateSiteModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Site</button>
            </div>
        </form>
    </div>
</div>

<script>
const SITE_URL = '<?php echo SITE_URL; ?>';

function showCreateSiteModal() {
    document.getElementById('createSiteModal').style.display = 'block';
    document.getElementById('site_name').focus();
}

function closeCreateSiteModal() {
    document.getElementById('createSiteModal').style.display = 'none';
    document.getElementById('createSiteForm').reset();
}

window.onclick = function(event) {
    const modal = document.getElementById('createSiteModal');
    if (event.target == modal) {
        closeCreateSiteModal();
    }
}

$('#createSiteForm').on('submit', function(e) {
    e.preventDefault();
    
    const formData = $(this).serialize();
    const $submitBtn = $(this).find('button[type="submit"]');
    const originalText = $submitBtn.text();
    
    $submitBtn.text('Creating...').prop('disabled', true);
    
    $.ajax({
        url: SITE_URL + '/api/create_site.php',
        method: 'POST',
        data: formData,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('✓ Site created successfully!');
                location.reload();
            } else {
                alert('✗ Error: ' + (response.error || 'Failed to create site'));
                $submitBtn.text(originalText).prop('disabled', false);
            }
        },
        error: function() {
            alert('✗ Error creating site. Please try again.');
            $submitBtn.text(originalText).prop('disabled', false);
        }
    });
});
</script>

<?php include '../includes/footer.php'; ?>
