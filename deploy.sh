#!/bin/bash
set -e

echo "=================================="
echo "Hisaab Portal - Maibook Integration Deployment"
echo "=================================="
echo ""

HISAAB_DIR="/var/www/hisaab"
DB_USER="hisaab_user"
DB_PASS="HisaabSecure@2024"
DB_NAME="hisaab"

echo "Step 1: Navigating to Hisaab directory..."
cd $HISAAB_DIR

echo "Step 2: Fetching latest code from GitHub..."
git fetch origin

echo "Step 3: Checking out feature branch..."
git checkout devin/1760230725-hisaab-portal

echo "Step 4: Pulling latest changes..."
git pull origin devin/1760230725-hisaab-portal

echo "Step 5: Running Maibook database migration..."
echo "This will add all Maibook features to the database:"
echo "  - Sites: company_id, still_active columns"
echo "  - Agents: uuid, still_active columns"
echo "  - Transactions: transaction_id, name_id, product_id, coins, rate, balances, modified, deleted columns"
echo "  - Admins: 16+ new columns for user management (roles, device tracking, expiry, etc.)"
echo "  - New tables: user_company_access, backup_emails, otp, logo, website_title"
echo ""
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME < migrations/add_maibook_features.sql

echo "Step 6: Fixing file permissions..."
sudo chown -R www-data:www-data $HISAAB_DIR
sudo chmod -R 755 $HISAAB_DIR

echo "Step 7: Ensuring vendor/mpdf/tmp has correct ownership..."
sudo chown -R www-data:www-data $HISAAB_DIR/vendor/mpdf/mpdf/tmp/

echo "Step 8: Restarting PHP-FPM..."
sudo systemctl restart php7.4-fpm

echo ""
echo "=================================="
echo "✅ Deployment completed successfully!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Visit http://204.12.227.184 to test the portal"
echo "2. Login with: Mobile: 9182982174, Password: Sarkar@00"
echo "3. Test Maibook features:"
echo "   - Backups (create, download, restore, delete)"
echo "   - PDF exports (agents, sites, transactions)"
echo "   - Transactions (soft delete, restore, permanent delete)"
echo "   - User management (roles, device limits, company access)"
echo "   - Settings (logo upload, website title)"
echo ""
echo "Database migration added:"
echo "  - All Maibook table structures"
echo "  - Backward compatible with existing Hisaab data"
echo "  - Ready for transaction tracking with double-entry bookkeeping"
echo ""
