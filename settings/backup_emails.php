<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!hasBackupTabAccess() && !isAdmin()) {
    redirect(SITE_URL . '/dashboard.php');
}

$stmt = $pdo->query("SELECT * FROM backup_emails ORDER BY email");
$emails = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Backup Email Notifications</h1>
        <button class="btn btn-primary" onclick="openAddModal()">
            <i class="icon">✉️</i> Add Email
        </button>
    </div>
    
    <div class="card">
        <p>These email addresses will receive notifications when backups are created.</p>
        
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Email Address</th>
                        <th>Added On</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($emails)): ?>
                        <tr>
                            <td colspan="3" class="text-center">No email addresses configured</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($emails as $email): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($email['email']); ?></td>
                                <td><?php echo date('d M Y', strtotime($email['created_at'])); ?></td>
                                <td>
                                    <button onclick="deleteEmail(<?php echo $email['id']; ?>)" class="btn btn-sm btn-danger">Delete</button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<div id="addEmailModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Add Backup Email</h2>
            <span class="close" onclick="closeAddModal()">&times;</span>
        </div>
        <form onsubmit="addEmail(event)">
            <div class="modal-body">
                <div class="form-group">
                    <label>Email Address *</label>
                    <input type="email" name="email" class="form-control" required>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeAddModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Email</button>
            </div>
        </form>
    </div>
</div>

<script>
function openAddModal() {
    document.getElementById('addEmailModal').style.display = 'block';
}

function closeAddModal() {
    document.getElementById('addEmailModal').style.display = 'none';
}

function addEmail(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    fetch('<?php echo SITE_URL; ?>/api/add_backup_email.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Email added successfully');
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

function deleteEmail(id) {
    if (!confirm('Delete this email address?')) {
        return;
    }
    
    fetch('<?php echo SITE_URL; ?>/api/delete_backup_email.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'id=' + id
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Email deleted successfully');
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

window.onclick = function(event) {
    const modal = document.getElementById('addEmailModal');
    if (event.target == modal) {
        closeAddModal();
    }
}
</script>

<?php include '../includes/footer.php'; ?>
