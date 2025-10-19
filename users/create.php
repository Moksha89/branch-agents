<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!isAdmin()) {
    redirect(SITE_URL . '/dashboard.php');
}

$stmt = $pdo->query("SELECT * FROM sites WHERE still_active = 1 ORDER BY name");
$sites = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Create User</h1>
        <a href="<?php echo SITE_URL; ?>/users/index.php" class="btn btn-secondary">← Back</a>
    </div>
    
    <div class="card">
        <form id="createUserForm" onsubmit="createUser(event)">
            <div class="form-group">
                <label>Name *</label>
                <input type="text" name="name" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label>Mobile Number *</label>
                <input type="text" name="mobile" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label>Username *</label>
                <input type="text" name="username" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label>Password *</label>
                <input type="password" name="password" class="form-control" required minlength="6">
            </div>
            
            <div class="form-group">
                <label>Role *</label>
                <select name="role" class="form-control" required onchange="toggleRoleFields()">
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            
            <div class="form-group" id="employeeTabField">
                <label>
                    <input type="checkbox" name="employee_tab" value="1"> Employee Tab Access
                </label>
            </div>
            
            <div class="form-group" id="backupTabField">
                <label>
                    <input type="checkbox" name="backup_tab" value="1"> Backup Tab Access
                </label>
            </div>
            
            <div class="form-group">
                <label>Device Limit</label>
                <input type="number" name="device_limit" class="form-control" value="1" min="1">
            </div>
            
            <div class="form-group">
                <label>Expiry Date</label>
                <input type="date" name="expiry_date" class="form-control">
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="otp_auth_enabled" value="1"> Enable OTP Authentication
                </label>
            </div>
            
            <div id="siteAccessSection">
                <h3>Site Access</h3>
                <?php foreach ($sites as $site): ?>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="sites[]" value="<?php echo $site['id']; ?>" onchange="toggleAccessLevel(<?php echo $site['id']; ?>)">
                            <?php echo htmlspecialchars($site['name']); ?>
                        </label>
                        <select name="access_level_<?php echo $site['id']; ?>" class="form-control" style="display:none;" id="access_<?php echo $site['id']; ?>">
                            <option value="read">Read Only</option>
                            <option value="full">Full Access</option>
                        </select>
                    </div>
                <?php endforeach; ?>
            </div>
            
            <button type="submit" class="btn btn-primary">Create User</button>
        </form>
    </div>
</div>

<script>
function toggleRoleFields() {
    const role = document.querySelector('[name="role"]').value;
    const employeeTab = document.getElementById('employeeTabField');
    const backupTab = document.getElementById('backupTabField');
    const siteAccess = document.getElementById('siteAccessSection');
    
    if (role === 'admin') {
        employeeTab.style.display = 'none';
        backupTab.style.display = 'none';
        siteAccess.style.display = 'none';
    } else {
        employeeTab.style.display = 'block';
        backupTab.style.display = 'block';
        siteAccess.style.display = 'block';
    }
}

function toggleAccessLevel(siteId) {
    const checkbox = document.querySelector('[name="sites[]"][value="' + siteId + '"]');
    const select = document.getElementById('access_' + siteId);
    select.style.display = checkbox.checked ? 'inline-block' : 'none';
}

function createUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    fetch('<?php echo SITE_URL; ?>/api/create_user.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('User created successfully');
            window.location.href = '<?php echo SITE_URL; ?>/users/index.php';
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred');
    });
}

toggleRoleFields();
</script>

<?php include '../includes/footer.php'; ?>
