<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../config/config.php';
require_once '../config/database.php';
require_once '../config/pdf_helper.php';

requireLogin();

if (!hasModuleAccess('reports')) {
    http_response_code(403);
    die('Access denied');
}

$agentId = isset($_GET['agent_id']) ? intval($_GET['agent_id']) : 0;

if ($agentId <= 0) {
    die('Invalid agent ID');
}

generateAgentBalanceReportPDF($agentId);
