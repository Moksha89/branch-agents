# Testing: Systematic Web Branch Management Portal

## Environment

- **Live site**: http://93.127.138.91
- **Backend**: NestJS + Prisma ORM + PostgreSQL on VPS
- **Frontend**: Next.js 14 + React + TypeScript on VPS
- **Process manager**: PM2 (cluster mode)
- **VPS path**: Backend at `/home/administrator/systematic-web/backend`, Frontend at `/home/administrator/systematic-web/frontend`

## Devin Secrets Needed

- `VPS_SSH_PASSWORD` — SSH password for `administrator@93.127.138.91` (needed for deployments and log access)
- Login credentials for the app are stored in the database (default: sarkar / Sarkar@00)

## Testing Approach

1. **Always test on the live site** — do NOT attempt local setup (no local DB, complex env config)
2. Log in at `/login` with test credentials
3. Navigate via sidebar: Dashboard, Branches, Compare
4. Each branch has tabs: Accounts, Transactions, Daily Report

## Key Test Flows

### Decimal/Calculation Verification
- **Why**: Prisma `Decimal(15,2)` fields serialize as strings in JSON. If Number() conversion is missing, JavaScript does string concatenation instead of numeric addition (e.g., `0 + "60000"` = `"060000"` not `60000`).
- **Where to check**:
  - Daily Report tab → TOTAL row (sum of deposits, withdrawals, P/L)
  - Branch balance summary cards (Total Balance, per-status totals)
  - Dashboard KPI cards (Total Balance across all branches)
  - Transaction history (amount, balanceBefore, balanceAfter)
- **Red flag**: Any value showing concatenated numbers like ₹0600005000 instead of ₹65,000

### Transaction Flow
- Click D/W/T/OT buttons on account rows to open transaction modals
- After deposit: verify account balance increases by exact amount
- After withdrawal: verify balance decreases
- Check that branch Total Balance card updates accordingly

### Account Detail Popup
- Click any account row to open detail popup
- Verify: Personal Info, Bank Details, Identity Documents, Debit Card, Netbanking, Transaction History, Merchants, Documents sections
- Sensitive data should be masked (Aadhar ****XXXX, PAN ****XXXX, CVV ***)

### Account Creation Form
- Navigate to branch → "Add Bank Account"
- Verify all sections: Personal Info, Bank Details, Identity Documents (Aadhar/PAN/Debit Card front+back uploads), Netbanking, Linked Merchants (Add Merchant button), Other Documents

## Common Issues & Workarounds

### Browser Tool Click Blocking
- Table action buttons (D/W/T/OT) may not respond to the browser tool's `click` action due to `stopPropagation()` handlers
- **Workaround**: Use `browser console` action with JavaScript: `document.querySelector('button[title="Deposit"]').click()`
- Tab buttons (Accounts/Transactions/Daily Report) may also need JS clicks
- Modal overlays render but may not appear in the HTML scraper output — use `console` action to inspect modal content

### React State Updates via Console
- When filling form inputs via JavaScript, use React's native setter pattern:
  ```js
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, '1000');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  ```
- Simple `input.value = '1000'` won't trigger React state updates

### VPS Deployment
- SSH as `administrator@93.127.138.91`
- Backend: `cd /home/administrator/systematic-web/backend && npm run build && pm2 restart systematic-backend`
- Frontend: `cd /home/administrator/systematic-web/frontend && npm run build && pm2 restart systematic-frontend`
- After deployment, Nginx may cache old JS — add cache-busting headers or tell users to hard-refresh (Ctrl+Shift+R)

### Next.js Config
- Do NOT use `output: 'standalone'` in `next.config.js` — it causes Next.js to run in degraded mode where HTML renders but JS event handlers never attach (grayed-out, unclickable UI)

### Prisma Decimal Fields
- Always wrap Prisma Decimal fields with `Number()` before returning from backend services
- Apply conversion in BOTH frontend (fetch handlers) AND backend (service methods) for defense-in-depth
- Fields affected: `bankBalance`, `totalDeposit`, `totalWithdrawal`, `playerBalance`, `profitLoss`, `amount`, `balanceBefore`, `balanceAfter`, merchant `balance`
