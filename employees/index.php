<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireAdmin();

$stmt = $pdo->query("
    SELECT 
        e.id,
        e.name,
        e.mobile,
        e.is_active,
        e.created_at,
        COUNT(DISTINCT esa.site_id) as site_count,
        COUNT(DISTINCT ema.module_name) as module_count
    FROM employees e
    LEFT JOIN employee_site_access esa ON e.id = esa.employee_id
    LEFT JOIN employee_module_access ema ON e.id = ema.employee_id
    GROUP BY e.id
    ORDER BY e.is_active DESC, e.name
");
$employees = $stmt->fetchAll();

$sites_stmt = $pdo->query("SELECT id, name FROM sites ORDER BY name");
$all_sites = $sites_stmt->fetchAll();

$modules = ['dashboard', 'sites', 'branches', 'agents', 'masters', 'reports'];

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Employee Management</h1>
        <button onclick="showCreateEmployeeModal()" class="btn btn-primary">+ Create New Employee</button>
    </div>
    
    <div class="table-responsive">
        <table class="table data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Sites Access</th>
                    <th>Modules Access</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($employees)): ?>
                    <tr>
                        <td colspan="7" class="text-center">No employees found. Create your first employee.</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($employees as $emp): ?>
                        <tr style="<?php echo !$emp['is_active'] ? 'opacity: 0.6; background-color: #f8f9fa;' : ''; ?>">
                            <td><?php echo $emp['id']; ?></td>
                            <td>
                                <strong><?php echo htmlspecialchars($emp['name']); ?></strong>
                                <?php if (!$emp['is_active']): ?>
                                    <span class="badge badge-secondary" style="margin-left: 5px; font-size: 10px; padding: 2px 6px; background: #6c757d; color: white; border-radius: 3px;">INACTIVE</span>
                                <?php endif; ?>
                            </td>
                            <td><?php echo htmlspecialchars($emp['mobile']); ?></td>
                            <td><?php echo $emp['site_count']; ?> site(s)</td>
                            <td><?php echo $emp['module_count']; ?> module(s)</td>
                            <td>
                                <span class="badge <?php echo $emp['is_active'] ? 'badge-success' : 'badge-secondary'; ?>" style="padding: 4px 8px; font-size: 11px;">
                                    <?php echo $emp['is_active'] ? 'Active' : 'Inactive'; ?>
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-warning" onclick="editEmployee(<?php echo $emp['id']; ?>)">Edit</button>
                                <button class="btn btn-sm <?php echo $emp['is_active'] ? 'btn-secondary' : 'btn-success'; ?>" 
                                        onclick="toggleEmployeeStatus(<?php echo $emp['id']; ?>, <?php echo $emp['is_active'] ? 'true' : 'false'; ?>)">
                                    <?php echo $emp['is_active'] ? 'Deactivate' : 'Activate'; ?>
                                </button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<div id="createEmployeeModal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
            <h2>Create New Employee</h2>
            <span class="modal-close" onclick="closeCreateEmployeeModal()">&times;</span>
        </div>
        <form id="createEmployeeForm">
            <div class="modal-body">
                <div class="form-group">
                    <label for="emp_name">Name *</label>
                    <input type="text" id="emp_name" name="name" required class="form-control">
                </div>
                <div class="form-group">
                    <label for="emp_mobile">Mobile Number *</label>
                    <input type="text" id="emp_mobile" name="mobile" required pattern="[0-9]{10}" maxlength="10" class="form-control" placeholder="10-digit mobile number">
                </div>
                <div class="form-group">
                    <label for="emp_password">Password *</label>
                    <input type="password" id="emp_password" name="password" required minlength="6" class="form-control" placeholder="Minimum 6 characters">
                </div>
                
                <div class="form-group">
                    <label><strong>Site Access</strong></label>
                    <div id="siteAccessContainer">
                        <?php foreach ($all_sites as $site): ?>
                            <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                                <label style="margin-bottom: 5px;">
                                    <input type="checkbox" class="site-checkbox" name="sites[]" value="<?php echo $site['id']; ?>" 
                                           onchange="toggleBranchAccess(<?php echo $site['id']; ?>)">
                                    <strong><?php echo htmlspecialchars($site['name']); ?></strong>
                                </label>
                                <div style="margin-left: 20px; margin-top: 5px;">
                                    <label style="margin-right: 15px;">
                                        <input type="radio" name="site_access_<?php echo $site['id']; ?>" value="all_branches" checked disabled>
                                        All Branches
                                    </label>
                                    <label>
                                        <input type="radio" name="site_access_<?php echo $site['id']; ?>" value="limited_branches" disabled
                                               onchange="showBranchSelection(<?php echo $site['id']; ?>)">
                                        Limited Branches
                                    </label>
                                    <div id="branches_<?php echo $site['id']; ?>" style="display: none; margin-top: 5px;">
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <div class="form-group">
                    <label><strong>Module Access</strong></label>
                    <div>
                        <?php foreach ($modules as $module): ?>
                            <div style="border: 1px solid #ddd; padding: 8px; margin-bottom: 5px; border-radius: 4px;">
                                <label style="display: inline-block; width: 150px;">
                                    <input type="checkbox" class="module-checkbox" name="modules[]" value="<?php echo $module; ?>"
                                           onchange="toggleModuleAccess('<?php echo $module; ?>')">
                                    <strong><?php echo ucfirst($module); ?></strong>
                                </label>
                                <div style="display: inline-block;">
                                    <label style="margin-right: 15px;">
                                        <input type="radio" name="module_access_<?php echo $module; ?>" value="read" checked disabled>
                                        Read Only
                                    </label>
                                    <label>
                                        <input type="radio" name="module_access_<?php echo $module; ?>" value="full" disabled>
                                        Full Access
                                    </label>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeCreateEmployeeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Employee</button>
            </div>
        </form>
    </div>
</div>

<div id="editEmployeeModal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
            <h2>Edit Employee</h2>
            <span class="modal-close" onclick="closeEditEmployeeModal()">&times;</span>
        </div>
        <form id="editEmployeeForm">
            <input type="hidden" id="edit_emp_id" name="employee_id">
            <div class="modal-body">
                <div class="form-group">
                    <label for="edit_emp_name">Name *</label>
                    <input type="text" id="edit_emp_name" name="name" required class="form-control">
                </div>
                <div class="form-group">
                    <label for="edit_emp_mobile">Mobile Number *</label>
                    <input type="text" id="edit_emp_mobile" name="mobile" required pattern="[0-9]{10}" maxlength="10" class="form-control">
                </div>
                <div class="form-group">
                    <label for="edit_emp_password">Password (leave blank to keep current)</label>
                    <input type="password" id="edit_emp_password" name="password" minlength="6" class="form-control">
                </div>
                
                <div class="form-group">
                    <label><strong>Site Access</strong></label>
                    <div id="editSiteAccessContainer">
                    </div>
                </div>
                
                <div class="form-group">
                    <label><strong>Module Access</strong></label>
                    <div id="editModuleAccessContainer">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeEditEmployeeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Employee</button>
            </div>
        </form>
    </div>
</div>

<script>
const SITE_URL = '<?php echo SITE_URL; ?>';

function showCreateEmployeeModal() {
    document.getElementById('createEmployeeModal').style.display = 'block';
}

function closeCreateEmployeeModal() {
    document.getElementById('createEmployeeModal').style.display = 'none';
    document.getElementById('createEmployeeForm').reset();
    
    document.querySelectorAll('input[type="radio"][name^="site_access_"]').forEach(radio => {
        radio.disabled = true;
    });
    document.querySelectorAll('input[type="radio"][name^="module_access_"]').forEach(radio => {
        radio.disabled = true;
    });
}

function toggleBranchAccess(siteId) {
    const siteCheckbox = document.querySelector(`input[name="sites[]"][value="${siteId}"]`);
    const radioButtons = document.querySelectorAll(`input[name="site_access_${siteId}"]`);
    radioButtons.forEach(radio => radio.disabled = !siteCheckbox.checked);
    
    if (!siteCheckbox.checked) {
        document.getElementById(`branches_${siteId}`).style.display = 'none';
    }
}

function showBranchSelection(siteId) {
    const container = document.getElementById(`branches_${siteId}`);
    container.style.display = 'block';
    
    if (container.innerHTML.trim() === '') {
        $.ajax({
            url: SITE_URL + '/api/get_site_branches.php',
            data: { site_id: siteId },
            dataType: 'json',
            success: function(branches) {
                let html = '<div style="max-height: 150px; overflow-y: auto; padding: 5px; background: #f8f9fa; border-radius: 3px;">';
                branches.forEach(branch => {
                    html += `<label style="display: block; margin: 3px 0;"><input type="checkbox" name="branches_${siteId}[]" value="${branch.id}"> ${branch.branch_code}</label>`;
                });
                html += '</div>';
                container.innerHTML = html;
            }
        });
    }
}

function toggleModuleAccess(moduleName) {
    const moduleCheckbox = document.querySelector(`input[name="modules[]"][value="${moduleName}"]`);
    const radioButtons = document.querySelectorAll(`input[name="module_access_${moduleName}"]`);
    radioButtons.forEach(radio => radio.disabled = !moduleCheckbox.checked);
}

function editEmployee(employeeId) {
    $.ajax({
        url: SITE_URL + '/api/get_employee_details.php',
        data: { employee_id: employeeId },
        dataType: 'json',
        success: function(data) {
            document.getElementById('edit_emp_id').value = data.employee.id;
            document.getElementById('edit_emp_name').value = data.employee.name;
            document.getElementById('edit_emp_mobile').value = data.employee.mobile;
            
            let sitesHtml = '';
            <?php foreach ($all_sites as $site): ?>
            {
                const siteId = <?php echo $site['id']; ?>;
                const siteData = data.sites.find(s => s.site_id == siteId);
                const isChecked = siteData ? 'checked' : '';
                const accessType = siteData ? siteData.access_type : 'all_branches';
                
                sitesHtml += `<div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                    <label style="margin-bottom: 5px;">
                        <input type="checkbox" class="site-checkbox" name="sites[]" value="${siteId}" ${isChecked}
                               onchange="toggleBranchAccessEdit(${siteId})">
                        <strong><?php echo htmlspecialchars($site['name']); ?></strong>
                    </label>
                    <div style="margin-left: 20px; margin-top: 5px;">
                        <label style="margin-right: 15px;">
                            <input type="radio" name="site_access_${siteId}" value="all_branches" 
                                   ${accessType === 'all_branches' ? 'checked' : ''} ${isChecked ? '' : 'disabled'}>
                            All Branches
                        </label>
                        <label>
                            <input type="radio" name="site_access_${siteId}" value="limited_branches" 
                                   ${accessType === 'limited_branches' ? 'checked' : ''} ${isChecked ? '' : 'disabled'}
                                   onchange="showBranchSelectionEdit(${siteId})">
                            Limited Branches
                        </label>
                        <div id="edit_branches_${siteId}" style="display: ${accessType === 'limited_branches' ? 'block' : 'none'}; margin-top: 5px;">
                        </div>
                    </div>
                </div>`;
            }
            <?php endforeach; ?>
            document.getElementById('editSiteAccessContainer').innerHTML = sitesHtml;
            
            let modulesHtml = '';
            <?php foreach ($modules as $module): ?>
            {
                const moduleData = data.modules.find(m => m.module_name === '<?php echo $module; ?>');
                const isChecked = moduleData ? 'checked' : '';
                const accessLevel = moduleData ? moduleData.access_level : 'read';
                
                modulesHtml += `<div style="border: 1px solid #ddd; padding: 8px; margin-bottom: 5px; border-radius: 4px;">
                    <label style="display: inline-block; width: 150px;">
                        <input type="checkbox" class="module-checkbox" name="modules[]" value="<?php echo $module; ?>" ${isChecked}
                               onchange="toggleModuleAccessEdit('<?php echo $module; ?>')">
                        <strong><?php echo ucfirst($module); ?></strong>
                    </label>
                    <div style="display: inline-block;">
                        <label style="margin-right: 15px;">
                            <input type="radio" name="module_access_<?php echo $module; ?>" value="read" 
                                   ${accessLevel === 'read' ? 'checked' : ''} ${isChecked ? '' : 'disabled'}>
                            Read Only
                        </label>
                        <label>
                            <input type="radio" name="module_access_<?php echo $module; ?>" value="full" 
                                   ${accessLevel === 'full' ? 'checked' : ''} ${isChecked ? '' : 'disabled'}>
                            Full Access
                        </label>
                    </div>
                </div>`;
            }
            <?php endforeach; ?>
            document.getElementById('editModuleAccessContainer').innerHTML = modulesHtml;
            
            if (data.sites.some(s => s.access_type === 'limited_branches')) {
                data.sites.filter(s => s.access_type === 'limited_branches').forEach(site => {
                    loadBranchesForEdit(site.site_id, data.branches.filter(b => b.site_id == site.site_id).map(b => b.branch_id));
                });
            }
            
            document.getElementById('editEmployeeModal').style.display = 'block';
        },
        error: function() {
            alert('Failed to load employee details');
        }
    });
}

function toggleBranchAccessEdit(siteId) {
    const siteCheckbox = document.querySelector(`#editSiteAccessContainer input[name="sites[]"][value="${siteId}"]`);
    const radioButtons = document.querySelectorAll(`#editSiteAccessContainer input[name="site_access_${siteId}"]`);
    radioButtons.forEach(radio => radio.disabled = !siteCheckbox.checked);
    
    if (!siteCheckbox.checked) {
        document.getElementById(`edit_branches_${siteId}`).style.display = 'none';
    }
}

function showBranchSelectionEdit(siteId) {
    const container = document.getElementById(`edit_branches_${siteId}`);
    container.style.display = 'block';
    loadBranchesForEdit(siteId, []);
}

function loadBranchesForEdit(siteId, selectedBranches) {
    const container = document.getElementById(`edit_branches_${siteId}`);
    
    $.ajax({
        url: SITE_URL + '/api/get_site_branches.php',
        data: { site_id: siteId },
        dataType: 'json',
        success: function(branches) {
            let html = '<div style="max-height: 150px; overflow-y: auto; padding: 5px; background: #f8f9fa; border-radius: 3px;">';
            branches.forEach(branch => {
                const checked = selectedBranches.includes(branch.id) ? 'checked' : '';
                html += `<label style="display: block; margin: 3px 0;"><input type="checkbox" name="branches_${siteId}[]" value="${branch.id}" ${checked}> ${branch.branch_code}</label>`;
            });
            html += '</div>';
            container.innerHTML = html;
        }
    });
}

function toggleModuleAccessEdit(moduleName) {
    const moduleCheckbox = document.querySelector(`#editModuleAccessContainer input[name="modules[]"][value="${moduleName}"]`);
    const radioButtons = document.querySelectorAll(`#editModuleAccessContainer input[name="module_access_${moduleName}"]`);
    radioButtons.forEach(radio => radio.disabled = !moduleCheckbox.checked);
}

function closeEditEmployeeModal() {
    document.getElementById('editEmployeeModal').style.display = 'none';
    document.getElementById('editEmployeeForm').reset();
}

function toggleEmployeeStatus(employeeId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this employee?`)) {
        return;
    }
    
    $.ajax({
        url: SITE_URL + '/api/toggle_employee_status.php',
        method: 'POST',
        data: { employee_id: employeeId },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('✓ ' + response.message);
                location.reload();
            } else {
                alert('✗ Error: ' + (response.error || 'Failed to toggle status'));
            }
        },
        error: function() {
            alert('✗ Error toggling employee status. Please try again.');
        }
    });
}

window.onclick = function(event) {
    const createModal = document.getElementById('createEmployeeModal');
    if (event.target == createModal) {
        closeCreateEmployeeModal();
    }
    const editModal = document.getElementById('editEmployeeModal');
    if (event.target == editModal) {
        closeEditEmployeeModal();
    }
}

$('#createEmployeeForm').on('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const $submitBtn = $(this).find('button[type="submit"]');
    const originalText = $submitBtn.text();
    
    $submitBtn.text('Creating...').prop('disabled', true);
    
    $.ajax({
        url: SITE_URL + '/api/create_employee.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('✓ Employee created successfully!');
                location.reload();
            } else {
                alert('✗ Error: ' + (response.error || 'Failed to create employee'));
                $submitBtn.text(originalText).prop('disabled', false);
            }
        },
        error: function() {
            alert('✗ Error creating employee. Please try again.');
            $submitBtn.text(originalText).prop('disabled', false);
        }
    });
});

$('#editEmployeeForm').on('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const $submitBtn = $(this).find('button[type="submit"]');
    const originalText = $submitBtn.text();
    
    $submitBtn.text('Updating...').prop('disabled', true);
    
    $.ajax({
        url: SITE_URL + '/api/update_employee.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('✓ Employee updated successfully!');
                location.reload();
            } else {
                alert('✗ Error: ' + (response.error || 'Failed to update employee'));
                $submitBtn.text(originalText).prop('disabled', false);
            }
        },
        error: function() {
            alert('✗ Error updating employee. Please try again.');
            $submitBtn.text(originalText).prop('disabled', false);
        }
    });
});
</script>

<?php include '../includes/footer.php'; ?>
