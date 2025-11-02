<?php
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../config/pdf_helper.php';

requireLogin();

if (!hasModuleAccess('sites')) {
    http_response_code(403);
    die('Access denied');
}

$siteId = isset($_GET['site_id']) ? intval($_GET['site_id']) : 0;

if ($siteId <= 0) {
    die('Invalid site ID');
}

generateSiteBalanceReportPDF($siteId);
