<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!hasEmployeeTabAccess() && !isAdmin()) {
    redirect(SITE_URL . '/dashboard.php');
}

$stmt = $pdo->query("
    SELECT u.*, 
           GROUP_CONCAT(DISTINCT CONCAT(s.name, ':', uca.access_level) SEPARATOR '; ') as site_access
    FROM admins u
    LEFT JOIN user_company_access uca ON u.id = uca.user_id
    LEFT JOIN sites s ON uca.site_id = s.id
    GROUP BY u.id
    ORDER BY u.id DESC
");
$users = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>User Management</h1>
        <?php if (isAdmin()): ?>
        <button class="btn btn-primary" onclick="window.location.href='<?php echo SITE_URL; ?>/users/create.php'">
            <i class="icon">👤</i> Add User
        </button>
        <?php endif; ?>
    </div>
    
    <div class="table-responsive">
        <table class="table data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Mobile/Username</th>
                    <th>Role</th>
                    <th>Device Limit</th>
                    <th>Expiry Date</th>
                    <th>Site Access</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($users as $user): ?>
                    <tr>
                        <td><?php echo $user['id']; ?></td>
                        <td><?php echo htmlspecialchars($user['name']); ?></td>
                        <td>
                            <?php echo htmlspecialchars($user['mobile']); ?><br>
                            <small><?php echo htmlspecialchars($user['username']); ?></small>
                        </td>
                        <td>
                            <?php 
                            if ($user['has_admin_privileges']) echo '<span class="badge badge-danger">Admin</span>';
                            elseif ($user['is_manager']) echo '<span class="badge badge-warning">Manager</span>';
                            elseif ($user['is_employee']) echo '<span class="badge badge-info">Employee</span>';
                            ?>
                        </td>
                        <td><?php echo $user['device_limit']; ?></td>
                        <td><?php echo $user['expiry_date'] ?: 'No expiry'; ?></td>
                        <td style="font-size: 11px;"><?php echo htmlspecialchars($user['site_access'] ?: 'No access'); ?></td>
                        <td>
                            <?php if ($user['first_device_id']): ?>
                                <span class="badge badge-success">Device Locked</span>
                            <?php else: ?>
                                <span class="badge badge-secondary">No Device</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php if (isAdmin()): ?>
                                <a href="<?php echo SITE_URL; ?>/users/edit.php?id=<?php echo $user['id']; ?>" class="btn btn-sm btn-info">Edit</a>
                                <?php if ($user['first_device_id']): ?>
                                    <button onclick="resetDevice(<?php echo $user['id']; ?>)" class="btn btn-sm btn-warning">Reset Device</button>
                                <?php endif; ?>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<script>
function resetDevice(userId) {
    if (!confirm('Reset device for this user? They will be able to login from a new device.')) {
        return;
    }
    
    fetch('<?php echo SITE_URL; ?>/api/reset_device.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'user_id=' + userId
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Device reset successfully');
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
