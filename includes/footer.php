    </div>
    
    <script src="<?php echo SITE_URL; ?>/assets/js/main.js"></script>
<!-- DataTables JS -->
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>

<script>
$(document).ready(function() {
    if ($.fn.DataTable) {
        $('.data-table').DataTable({
            "pageLength": 25,
            "order": [],
            "language": {
                "search": "Search:",
                "lengthMenu": "Show _MENU_ entries",
                "info": "Showing _START_ to _END_ of _TOTAL_ entries",
                "infoEmpty": "Showing 0 to 0 of 0 entries",
                "infoFiltered": "(filtered from _TOTAL_ total entries)",
                "zeroRecords": "No matching records found",
                "emptyTable": "No data available in table"
            }
        });
    }
});
</script>
</body>
</html>
