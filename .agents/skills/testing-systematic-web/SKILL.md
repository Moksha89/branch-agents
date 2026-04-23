# Testing Systematic Web Portal

## Overview
Systematic Web is a NestJS (backend) + Next.js (frontend) + PostgreSQL portal for managing bank accounts across branches. It runs on a VPS at 93.127.138.91 with domain waterbottles.live.

## Environment
- **Live URL:** http://waterbottles.live (also http://93.127.138.91)
- **Backend:** NestJS on port 3001, proxied via Nginx at `/api`
- **Frontend:** Next.js on port 3000
- **Database:** PostgreSQL (Prisma ORM)
- **Process Manager:** PM2 (services: `backend`, `frontend`)
- **VPS Path:** `/home/administrator/systematic-web/`

## Devin Secrets Needed
- `VPS_SSH_PASSWORD`: SSH password for `administrator@93.127.138.91` (needed for deployment and VPS debugging)

## Login
- **Admin:** username `sarkar`, password stored in Devin secrets or use `Sarkar@00` (SUPER_ADMIN role)
- Login endpoint: `POST /api/auth/login` with `{"username", "password"}` returns `{"accessToken"}`
- JWT token must be passed as `Authorization: Bearer <token>` header

## Testing Patterns

### API Testing
For reliable testing, prefer API calls over browser UI when verifying data changes:
```bash
TOKEN=$(curl -s -X POST http://93.127.138.91/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"sarkar","password":"Sarkar@00"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

curl -s "http://93.127.138.91/api/branches" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Browser UI Testing
- **Click blocking:** Browser automation clicks on table rows and buttons may be blocked. Use JavaScript `document.querySelector('...').click()` via browser console as a workaround.
- **React state updates:** When selecting dropdown values programmatically, use the native setter pattern:
  ```js
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  nativeInputValueSetter.call(select, 'value');
  select.dispatchEvent(new Event('change', { bubbles: true }));
  ```
- **Popup scrolling:** Account detail popups have scrollable content. Use `element.scrollIntoView()` to navigate to sections like Transaction History.

### Key API Endpoints
- `GET /api/branches` — list all branches
- `GET /api/branches/:id` — branch detail with accounts
- `POST /api/transactions` — create transaction (types: DEPOSIT, WITHDRAWAL, TRANSFER, OUT_TRANSFER)
- `GET /api/transactions/account/:id` — account transaction history
- `POST /api/bank-accounts/:id/transfer-branch` — transfer account to another branch
- `GET /api/users` — list users
- `GET /api/dashboard/stats` — dashboard KPIs

### Transaction Types
| Type | Badge | Color | Description |
|------|-------|-------|-----------|
| DEPOSIT | D | green | Money deposited |
| WITHDRAWAL | W | red | Money withdrawn |
| TRANSFER | T | blue | Internal transfer (same branch) |
| OUT_TRANSFER | OT | orange | Out transfer to another branch (sender side) |
| IN_TRANSFER | IT | teal | In transfer from another branch (receiver side, auto-created) |

### Common Test Scenarios
1. **Account Transfer:** POST to `/api/bank-accounts/:id/transfer-branch` with `{"targetBranchId": "..."}`. Verify account moves by checking both source and target branch account lists.
2. **OUT_TRANSFER:** POST to `/api/transactions` with `type: "OUT_TRANSFER"`, `fromAccountId`, `toAccountId`. Verify receiver gets IN_TRANSFER entry.
3. **Branch access control:** Create a non-admin user with no branch assignments — they should see 0 branches.

## Known Issues & Workarounds
- **Prisma Decimal fields** may serialize as strings in JSON responses. Frontend must use `Number()` conversion. If totals look like concatenated strings (e.g., "060000" instead of 60000), this is the Decimal bug.
- **NEXT_PUBLIC_API_URL** must be empty string (not undefined) on VPS. If set to `/api`, it causes double-prefix (`/api/api/...`). If undefined, it falls back to `localhost:3001`.
- **File uploads** are stored at `/home/administrator/systematic-web/uploads/` on VPS. Nginx must be configured to serve this path at `/uploads/`.
- **PM2 restart** after code changes: `cd /home/administrator/systematic-web/backend && pm2 restart backend && cd ../frontend && pm2 restart frontend`

## Deployment
1. Push to `devin/1775902915-branch-module` branch
2. SSH to VPS: `ssh administrator@93.127.138.91`
3. Pull: `cd /home/administrator/systematic-web && git pull`
4. Backend: `cd backend && npm install && npx prisma migrate deploy && npx prisma generate && npm run build && pm2 restart backend`
5. Frontend: `cd ../frontend && npm install && npm run build && pm2 restart frontend`
