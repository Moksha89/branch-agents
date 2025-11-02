<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Mpdf\Mpdf;

function generateAgentBalanceReportPDF($agentId) {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT name FROM agents WHERE id = ?");
    $stmt->execute([$agentId]);
    $agent = $stmt->fetch();
    
    if (!$agent) {
        return ['success' => false, 'error' => 'Agent not found'];
    }
    
    $stmt = $pdo->prepare("
        SELECT b.branch_code as branch_name, b.balance, s.name as site_name
        FROM branches b
        JOIN sites s ON b.site_id = s.id
        JOIN agent_branches ab ON b.id = ab.branch_id
        WHERE ab.agent_id = ?
        ORDER BY s.name, b.branch_code
    ");
    $stmt->execute([$agentId]);
    $branches = $stmt->fetchAll();
    
    $positiveBalances = [];
    $negativeBalances = [];
    $totalPositive = 0;
    $totalNegative = 0;
    
    foreach ($branches as $branch) {
        $item = [
            'branch' => $branch['branch_name'],
            'site' => $branch['site_name'],
            'balance' => $branch['balance']
        ];
        
        if ($branch['balance'] > 0) {
            $positiveBalances[] = $item;
            $totalPositive += $branch['balance'];
        } elseif ($branch['balance'] < 0) {
            $negativeBalances[] = $item;
            $totalNegative += $branch['balance'];
        }
    }
    
    $mpdf = new Mpdf(['tempDir' => '/tmp/mpdf']);
    $html = buildAgentBalanceReportHTML($agent['name'], $positiveBalances, $negativeBalances, $totalPositive, $totalNegative);
    $mpdf->WriteHTML($html);
    
    $filename = 'agent_balance_' . preg_replace('/[^a-z0-9]/i', '_', $agent['name']) . '_' . date('Y-m-d') . '.pdf';
    $mpdf->Output($filename, 'D');
    exit;
}

function buildAgentBalanceReportHTML($agentName, $positiveBalances, $negativeBalances, $totalPositive, $totalNegative) {
    $currentDate = date("Y-m-d");
    
    $html = '<style>
        body { font-family: Arial, sans-serif; }
        h1 { text-align: left; color: #4A4A4A; font-size: 20px; }
        .date { text-align: right; color: #4A4A4A; font-size: 14px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th { background-color: #ffffff; color: #4A4A4A; font-weight: bold; padding: 8px; border: 1px solid #ccc; text-align: center; }
        td { padding: 8px; border: 1px solid #ccc; text-align: center; }
        .positive-row { background-color: #f2d1f8; }
        .negative-row { background-color: #ffe0b3; }
        .total-positive { background-color: #6fa3f1; font-weight: bold; }
        .total-negative { background-color: #e03e44; font-weight: bold; color: white; }
    </style>';
    
    $html .= '<h1>' . htmlspecialchars($agentName) . ' - Balance Report</h1>';
    $html .= '<p class="date">Date: ' . $currentDate . '</p>';
    
    $html .= '<table width="100%"><tr>';
    
    $html .= '<td width="50%" valign="top">';
    $html .= '<table>';
    $html .= '<thead><tr><th>Site</th><th>Branch</th><th>Balance</th></tr></thead>';
    $html .= '<tbody>';
    foreach ($positiveBalances as $item) {
        $html .= '<tr class="positive-row">';
        $html .= '<td>' . htmlspecialchars($item['site']) . '</td>';
        $html .= '<td>' . htmlspecialchars($item['branch']) . '</td>';
        $html .= '<td>' . number_format($item['balance'], 2) . '</td>';
        $html .= '</tr>';
    }
    $html .= '<tr class="total-positive">';
    $html .= '<td colspan="2">Total Positive</td>';
    $html .= '<td>' . number_format($totalPositive, 2) . '</td>';
    $html .= '</tr>';
    $html .= '</tbody></table>';
    $html .= '</td>';
    
    $html .= '<td width="50%" valign="top">';
    $html .= '<table>';
    $html .= '<thead><tr><th>Site</th><th>Branch</th><th>Balance</th></tr></thead>';
    $html .= '<tbody>';
    foreach ($negativeBalances as $item) {
        $html .= '<tr class="negative-row">';
        $html .= '<td>' . htmlspecialchars($item['site']) . '</td>';
        $html .= '<td>' . htmlspecialchars($item['branch']) . '</td>';
        $html .= '<td>' . number_format($item['balance'], 2) . '</td>';
        $html .= '</tr>';
    }
    $html .= '<tr class="total-negative">';
    $html .= '<td colspan="2">Total Negative</td>';
    $html .= '<td>' . number_format($totalNegative, 2) . '</td>';
    $html .= '</tr>';
    $html .= '</tbody></table>';
    $html .= '</td>';
    
    $html .= '</tr></table>';
    
    return $html;
}

function generateSiteBalanceReportPDF($siteId) {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT name FROM sites WHERE id = ?");
    $stmt->execute([$siteId]);
    $site = $stmt->fetch();
    
    if (!$site) {
        return ['success' => false, 'error' => 'Site not found'];
    }
    
    $stmt = $pdo->prepare("
        SELECT b.branch_code as branch_name, b.balance, 
               GROUP_CONCAT(a.name SEPARATOR ', ') as agents
        FROM branches b
        LEFT JOIN agent_branches ab ON b.id = ab.branch_id
        LEFT JOIN agents a ON ab.agent_id = a.id
        WHERE b.site_id = ?
        GROUP BY b.id, b.branch_code, b.balance
        ORDER BY b.branch_code
    ");
    $stmt->execute([$siteId]);
    $branches = $stmt->fetchAll();
    
    $positiveBalances = [];
    $negativeBalances = [];
    $totalPositive = 0;
    $totalNegative = 0;
    
    foreach ($branches as $branch) {
        $item = [
            'branch' => $branch['branch_name'],
            'agents' => $branch['agents'] ?: 'No agents',
            'balance' => $branch['balance']
        ];
        
        if ($branch['balance'] > 0) {
            $positiveBalances[] = $item;
            $totalPositive += $branch['balance'];
        } elseif ($branch['balance'] < 0) {
            $negativeBalances[] = $item;
            $totalNegative += $branch['balance'];
        }
    }
    
    $mpdf = new Mpdf(['tempDir' => '/tmp/mpdf']);
    $html = buildSiteBalanceReportHTML($site['name'], $positiveBalances, $negativeBalances, $totalPositive, $totalNegative);
    $mpdf->WriteHTML($html);
    
    $filename = 'site_balance_' . preg_replace('/[^a-z0-9]/i', '_', $site['name']) . '_' . date('Y-m-d') . '.pdf';
    $mpdf->Output($filename, 'D');
    exit;
}

function buildSiteBalanceReportHTML($siteName, $positiveBalances, $negativeBalances, $totalPositive, $totalNegative) {
    $currentDate = date("Y-m-d");
    
    $html = '<style>
        body { font-family: Arial, sans-serif; }
        h1 { text-align: left; color: #4A4A4A; font-size: 20px; }
        .date { text-align: right; color: #4A4A4A; font-size: 14px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th { background-color: #ffffff; color: #4A4A4A; font-weight: bold; padding: 8px; border: 1px solid #ccc; text-align: center; }
        td { padding: 8px; border: 1px solid #ccc; text-align: center; }
        .positive-row { background-color: #f2d1f8; }
        .negative-row { background-color: #ffe0b3; }
        .total-positive { background-color: #6fa3f1; font-weight: bold; }
        .total-negative { background-color: #e03e44; font-weight: bold; color: white; }
    </style>';
    
    $html .= '<h1>' . htmlspecialchars($siteName) . ' - Site Report</h1>';
    $html .= '<p class="date">Date: ' . $currentDate . '</p>';
    
    $html .= '<table width="100%"><tr>';
    
    $html .= '<td width="50%" valign="top">';
    $html .= '<table>';
    $html .= '<thead><tr><th>Branch</th><th>Agents</th><th>Balance</th></tr></thead>';
    $html .= '<tbody>';
    foreach ($positiveBalances as $item) {
        $html .= '<tr class="positive-row">';
        $html .= '<td>' . htmlspecialchars($item['branch']) . '</td>';
        $html .= '<td>' . htmlspecialchars($item['agents']) . '</td>';
        $html .= '<td>' . number_format($item['balance'], 2) . '</td>';
        $html .= '</tr>';
    }
    $html .= '<tr class="total-positive">';
    $html .= '<td colspan="2">Total Positive</td>';
    $html .= '<td>' . number_format($totalPositive, 2) . '</td>';
    $html .= '</tr>';
    $html .= '</tbody></table>';
    $html .= '</td>';
    
    $html .= '<td width="50%" valign="top">';
    $html .= '<table>';
    $html .= '<thead><tr><th>Branch</th><th>Agents</th><th>Balance</th></tr></thead>';
    $html .= '<tbody>';
    foreach ($negativeBalances as $item) {
        $html .= '<tr class="negative-row">';
        $html .= '<td>' . htmlspecialchars($item['branch']) . '</td>';
        $html .= '<td>' . htmlspecialchars($item['agents']) . '</td>';
        $html .= '<td>' . number_format($item['balance'], 2) . '</td>';
        $html .= '</tr>';
    }
    $html .= '<tr class="total-negative">';
    $html .= '<td colspan="2">Total Negative</td>';
    $html .= '<td>' . number_format($totalNegative, 2) . '</td>';
    $html .= '</tr>';
    $html .= '</tbody></table>';
    $html .= '</td>';
    
    $html .= '</tr></table>';
    
    return $html;
}
