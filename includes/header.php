<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/style.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-header">
            <h2>Hisaab</h2>
        </div>
        <nav class="sidebar-nav">
            <a href="<?php echo SITE_URL; ?>/dashboard.php" class="nav-item <?php echo basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : ''; ?>">
                <i class="icon-dashboard"></i> Dashboard
            </a>
            <a href="<?php echo SITE_URL; ?>/sites/index.php" class="nav-item <?php echo strpos($_SERVER['PHP_SELF'], '/sites/') !== false ? 'active' : ''; ?>">
                <i class="icon-site"></i> Sites
            </a>
            <a href="<?php echo SITE_URL; ?>/branches/index.php" class="nav-item <?php echo strpos($_SERVER['PHP_SELF'], '/branches/') !== false ? 'active' : ''; ?>">
                <i class="icon-branch"></i> Branches
            </a>
            <a href="<?php echo SITE_URL; ?>/agents/index.php" class="nav-item <?php echo strpos($_SERVER['PHP_SELF'], '/agents/') !== false ? 'active' : ''; ?>">
                <i class="icon-agent"></i> Agents
            </a>
            <a href="<?php echo SITE_URL; ?>/reports/index.php" class="nav-item <?php echo strpos($_SERVER['PHP_SELF'], '/reports/') !== false ? 'active' : ''; ?>">
                <i class="icon-report"></i> Reports
            </a>
            <a href="<?php echo SITE_URL; ?>/settings/whatsapp.php" class="nav-item <?php echo strpos($_SERVER['PHP_SELF'], '/settings/') !== false ? 'active' : ''; ?>">
                <i class="icon-settings"></i> WhatsApp Settings
            </a>
            <a href="<?php echo SITE_URL; ?>/logout.php" class="nav-item">
                <i class="icon-logout"></i> Logout
            </a>
        </nav>
    </div>
    
    <div class="main-content">
        <div class="topbar">
            <div class="topbar-left">
                <button class="menu-toggle" id="menuToggle">☰</button>
            </div>
            <div class="topbar-right">
                <span class="user-info">
                    <i class="icon-user"></i> <?php echo $_SESSION['admin_mobile']; ?>
                </span>
            </div>
        </div>
