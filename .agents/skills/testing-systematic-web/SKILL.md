# Testing Systematic Web Portal

## Overview
Systematic Web is a Next.js + NestJS banking operations portal deployed on a VPS. Testing involves browser-based UI verification on the live site combined with source code verification for features that are difficult to trigger via automation.

## Devin Secrets Needed
- `VPS_SSH_PASSWORD` — SSH password for `administrator@93.127.138.91` (for deployment)
- Telegram OTP bot token is hardcoded in backend `.env`

## Login Flow
1. Navigate to http://waterbottles.live (or http://93.127.138.91)
2. Enter username (e.g., `sarkar`)
3. Enter password
4. If Telegram 2FA is enabled, a 6-digit OTP is sent to the user's linked Telegram
5. Enter OTP — **the OTP input uses 6 individual `<input>` fields**

### OTP Input Automation Workaround
The OTP digit fields may block direct `browser.click()` actions. Use this JavaScript workaround:
```javascript
const inputs = document.querySelectorAll('input[type="text"]');
const otp = '123456'; // replace with actual OTP
inputs.forEach((input, i) => {
  if (i < 6) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, otp[i]);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
```

## React Controlled Input Automation
React controlled inputs often don't respond to `browser.type()`. Use the native value setter pattern:
```javascript
const input = document.querySelector('input[placeholder="..."]');
const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
nativeSetter.call(input, 'value');
input.dispatchEvent(new Event('input', { bubbles: true }));
input.dispatchEvent(new Event('change', { bubbles: true }));
```
**Limitation**: This may not trigger all React state updates (e.g., form validation via `formErrors` state). For validation testing, verify the code exists via `grep` instead.

## Button Click Workaround
Some buttons may block `browser.click()`. Use JavaScript:
```javascript
const btns = document.querySelectorAll('button');
for (const btn of btns) {
  if (btn.textContent.includes('Button Text')) {
    btn.click();
    break;
  }
}
```

## Esc Key / Keyboard Event Testing
To test Esc key handlers on modals, dispatch the event via JS:
```javascript
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
```

## Hybrid Testing Strategy
For comprehensive testing, combine:
1. **Live browser testing** — for visual verification, search/filter, navigation, toast notifications
2. **Source code verification via `grep`** — for:
   - Mobile responsive layouts (`md:hidden` classes)
   - Error handling patterns (`.catch` with `showToast`)
   - API query parameter usage (`dateFrom`, `dateTo`)
   - Import verification (check if utility files are actually imported)
   - Validation code existence (`formErrors`, `border-red-500`)
3. **Fetch interception** — for debounce testing:
```javascript
window._fetchCalls = [];
const origFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0]?.includes('search-term')) {
    window._fetchCalls.push({ url: args[0], time: Date.now() });
  }
  return origFetch.apply(this, args);
};
```

## Key Pages & Their Test Points
- `/dashboard` — KPI cards, charts (Branch Balances, Account Status, P/L Trend, Transaction Volume), 2FA status banner
- `/branches` — Branch list with search filter, Create Branch modal (Name, Address, City, State, Pincode)
- `/branches/[id]` — Tabs: Accounts, Transactions, Daily Reports. Status dropdown, Transfer Account, Download (PDF/Excel/CSV)
- `/accounts` — Status tabs (All, Active, Debit Freeze, Credit Freeze, Cyber, Closed), summary cards, search with debounce
- `/expenses` — Add/Edit/Delete expenses, branch filter, date range filter (server-side), balance warning
- `/users` — RBAC, branch access (R/W/F), inline validation, delete confirmation modal
- `/profile` — Change password, Telegram 2FA setup/removal

## Common Issues to Watch For
- **Pagination not integrated**: Component may exist in `components/ui/pagination.tsx` but might not be imported into list pages
- **Utility files not imported**: Check that utility files (e.g., `format-date.ts`) are actually imported by consuming pages
- **Role display casing**: Backend may return `SUPER_ADMIN` but frontend should display as Title Case
- **Native `<select>` styling**: May not match dark theme without explicit `bg-slate-*` classes
- **Double API prefix**: If `NEXT_PUBLIC_API_URL` is set to `/api`, calls become `/api/api/...`. Use empty string `''` instead.

## Database State
Production DB typically has: branches, bank accounts (100+), transactions, daily reports, expenses. The admin user `sarkar` is protected from deletion.
