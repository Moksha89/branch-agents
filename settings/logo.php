<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!isAdmin()) {
    redirect(SITE_URL . '/dashboard.php');
}

$stmt = $pdo->query("SELECT * FROM website_settings LIMIT 1");
$settings = $stmt->fetch();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Website Settings</h1>
        <a href="<?php echo SITE_URL; ?>/settings/index.php" class="btn btn-secondary">← Back</a>
    </div>
    
    <div class="card">
        <h2>Logo</h2>
        <form onsubmit="uploadLogo(event)" enctype="multipart/form-data">
            <?php if ($settings['logo_path'] && file_exists('../' . $settings['logo_path'])): ?>
                <div class="form-group">
                    <label>Current Logo:</label><br>
                    <img src="<?php echo SITE_URL . '/' . $settings['logo_path']; ?>" alt="Logo" style="max-height: 100px;">
                </div>
            <?php endif; ?>
            
            <div class="form-group">
                <label>Upload New Logo (PNG, JPG, max 2MB)</label>
                <input type="file" name="logo" accept="image/png,image/jpeg,image/jpg" required>
            </div>
            
            <button type="submit" class="btn btn-primary">Upload Logo</button>
        </form>
    </div>
    
    <div class="card">
        <h2>Website Title</h2>
        <form onsubmit="updateTitle(event)">
            <div class="form-group">
                <label>Title</label>
                <input type="text" name="title" class="form-control" value="<?php echo htmlspecialchars($settings['website_title']); ?>" required>
            </div>
            
            <button type="submit" class="btn btn-primary">Update Title</button>
        </form>
    </div>
</div>

<script>
function uploadLogo(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    fetch('<?php echo SITE_URL; ?>/api/upload_logo.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Logo uploaded successfully');
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

function updateTitle(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    fetch('<?php echo SITE_URL; ?>/api/update_website_title.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Title updated successfully');
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
