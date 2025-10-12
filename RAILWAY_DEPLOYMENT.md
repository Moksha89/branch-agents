# Railway Deployment Guide for WhatsApp API Server

This guide will help you deploy the WhatsApp Web automation server to Railway's free tier.

## Prerequisites

- A Railway account (sign up at https://railway.app - no credit card required for free tier)
- The WhatsApp server code (already prepared in `/tmp/whatsapp-server`)

## Step 1: Prepare the WhatsApp Server

The WhatsApp server is already cloned and ready at `/tmp/whatsapp-server`. It includes:
- Node.js server with Baileys WhatsApp Web library
- Admin dashboard for monitoring sessions
- REST API endpoints for QR code login and message sending
- Session persistence (survives restarts)

## Step 2: Generate Secure Keys

Run these commands to generate secure encryption keys:

```bash
cd /tmp/whatsapp-server
node -e "console.log('TOKEN_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(16).toString('hex'))"
node -e "console.log('MASTER_API_KEY=' + require('crypto').randomBytes(16).toString('hex'))"
```

Save these generated keys - you'll need them in Railway environment variables.

## Step 3: Deploy to Railway

### Option A: Using Railway CLI (Recommended)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```
   This will open your browser for authentication.

3. **Initialize and Deploy:**
   ```bash
   cd /tmp/whatsapp-server
   railway init
   railway up
   ```

4. **Set Environment Variables:**
   ```bash
   railway variables set ADMIN_DASHBOARD_PASSWORD=your_secure_password
   railway variables set TOKEN_ENCRYPTION_KEY=<paste_generated_key>
   railway variables set SESSION_SECRET=<paste_generated_key>
   railway variables set MASTER_API_KEY=<paste_generated_key>
   railway variables set PORT=3000
   railway variables set MAX_SESSIONS=5
   railway variables set NODE_ENV=production
   ```

5. **Generate Domain:**
   ```bash
   railway domain
   ```
   This creates a public URL like `https://your-app-name.up.railway.app`

### Option B: Using Railway Web Dashboard

1. Go to https://railway.app/new

2. Click **"Deploy from GitHub repo"** or **"Empty Project"**

3. If using GitHub:
   - Fork the repository: https://github.com/Alucard0x1/Super-Light-Web-WhatsApp-API-Server
   - Connect your GitHub account
   - Select the forked repository
   - Railway will auto-detect Node.js and use `npm start`

4. If using Empty Project:
   - Create a new project
   - Upload `/tmp/whatsapp-server` as a ZIP file
   - Railway will auto-detect and deploy

5. **Configure Environment Variables:**
   - Go to your project → Variables tab
   - Add the following variables:
     ```
     ADMIN_DASHBOARD_PASSWORD=your_secure_password
     TOKEN_ENCRYPTION_KEY=<paste_generated_key>
     SESSION_SECRET=<paste_generated_key>
     MASTER_API_KEY=<paste_generated_key>
     PORT=3000
     MAX_SESSIONS=5
     NODE_ENV=production
     ```

6. **Enable Public Domain:**
   - Go to Settings → Networking
   - Click "Generate Domain"
   - Note the URL (e.g., `https://your-app-name.up.railway.app`)

## Step 4: Verify Deployment

1. **Check Health Endpoint:**
   ```bash
   curl https://your-app-name.up.railway.app/health
   ```
   Should return: `{"status":"ok","sessions":0}`

2. **Access Admin Dashboard:**
   - Open: `https://your-app-name.up.railway.app/admin/dashboard.html`
   - Login with your ADMIN_DASHBOARD_PASSWORD
   - You should see the dashboard with no active sessions

3. **View Logs:**
   ```bash
   railway logs
   ```
   Or check logs in Railway web dashboard

## Step 5: Configure Hisaab Portal

1. **Login to Hisaab Portal** (your GoDaddy hosted site)

2. **Navigate to Settings → WhatsApp Connection**

3. **Enter Configuration:**
   - **WhatsApp API Server URL:** `https://your-app-name.up.railway.app`
   - **Master API Key:** (the MASTER_API_KEY you set in Railway)
   - Click **"Save Configuration"**

4. **Connect WhatsApp:**
   - Click **"Connect WhatsApp"** button
   - Wait for QR code to appear (3-5 seconds)
   - Open WhatsApp on your phone
   - Go to Settings → Linked Devices → Link a Device
   - Scan the QR code displayed in the portal
   - Status should change to "Connected"

## Step 6: Test Message Sending

1. Go to **Reports** page in Hisaab Portal

2. Click **"📱 Send Report"** for any agent

3. Check if message arrives on WhatsApp

4. Verify message format:
   ```
   *Hisaab Report - AGENT_NAME*
   Date: 12-Oct-2024 03:15 AM

   *SITE_NAME*
     • BRANCH_CODE: ₹50,000.00
     • BRANCH_CODE2: ₹75,000.00

   ━━━━━━━━━━━━━━━
   *Total Balance: ₹125,000.00*
   ```

## Railway Free Tier Limits

- **500 execution hours/month** (enough for 24/7 uptime for ~20 days)
- **$5 free credit** (covers additional usage)
- **100 GB network egress/month**
- **512 MB RAM per service**

For most use cases, this is **completely free**. If you exceed limits, costs are approximately $5-10/month.

## Troubleshooting

### QR Code Not Appearing

1. Check Railway logs: `railway logs`
2. Verify all environment variables are set correctly
3. Check if service is running: `curl https://your-app-name.up.railway.app/health`
4. Check browser console for JavaScript errors

### WhatsApp Connection Lost

1. Session data is stored on Railway (persists across restarts)
2. If Railway redeploys (e.g., code update), you may need to re-scan QR
3. Check session status in admin dashboard
4. If needed, disconnect and reconnect in portal

### Message Sending Fails

1. **Check session token:** Ensure portal has valid session token
2. **Check API URL:** Verify URL in portal settings is correct (no trailing slash)
3. **Check API Key:** Ensure MASTER_API_KEY matches between Railway and portal
4. **Check phone number format:** Should be 10 digits (automatically adds +91)
5. **Check Railway logs** for errors

### CORS Errors

If you see CORS errors in browser console:

1. Add to Railway environment variables:
   ```
   ALLOWED_ORIGINS=https://your-godaddy-domain.com,http://localhost:8000
   ```

2. Redeploy the service

### Rate Limiting

WhatsApp may rate-limit if you send too many messages:
- Limit: ~20 messages per minute
- Solution: Use "Send All Reports" with 2-second delay between messages (already implemented)

## Monitoring

### View Active Sessions
- Admin Dashboard: `https://your-app-name.up.railway.app/admin/dashboard.html`
- Shows all connected WhatsApp sessions

### View Logs
```bash
railway logs --tail
```

### Check Uptime
Railway dashboard shows service uptime and restarts

## Backup Options

If Railway doesn't work or you exceed free tier:

### 1. Render.com
- Similar free tier (750 hours/month)
- Deployment process nearly identical
- May have slower cold starts

### 2. Fly.io
- Free tier: 3 shared CPU VMs
- More technical setup required

### 3. GoDaddy VPS (if you upgrade)
- Full control
- Run Node.js directly
- Costs more but consolidates hosting

## Security Best Practices

1. **Never commit .env file** to git (already in .gitignore)
2. **Use strong MASTER_API_KEY** (generated randomly)
3. **Change ADMIN_DASHBOARD_PASSWORD** regularly
4. **Enable HTTPS** (Railway provides this automatically)
5. **Restrict CORS** to your domain only
6. **Monitor logs** for suspicious activity

## API Endpoints Reference

### Health Check
```
GET https://your-app-name.up.railway.app/health
```

### Create Session
```
POST https://your-app-name.up.railway.app/api/v1/sessions
Headers: X-Master-Key: <MASTER_API_KEY>
Body: {"sessionId": "hisaab_portal"}
```

### Get Sessions
```
GET https://your-app-name.up.railway.app/api/v1/sessions
```

### Send Message
```
POST https://your-app-name.up.railway.app/api/v1/messages?sessionId=hisaab_portal
Headers: Authorization: Bearer <session_token>
Body: {"to": "919876543210", "type": "text", "text": {"body": "Hello"}}
```

### Delete Session
```
DELETE https://your-app-name.up.railway.app/api/v1/sessions/hisaab_portal
Headers: Authorization: Bearer <session_token>
```

## Support

- Railway Documentation: https://docs.railway.app
- WhatsApp API Server: https://github.com/Alucard0x1/Super-Light-Web-WhatsApp-API-Server
- Baileys Library: https://github.com/WhiskeySockets/Baileys

## Cost Estimation

**Monthly Costs (typical usage):**
- Railway Free Tier: $0 (within limits)
- If exceeding free tier: $5-10/month
- GoDaddy hosting: (existing cost, no change)

**Total Additional Cost:** $0-10/month

This is significantly cheaper than WhatsApp Business API which requires:
- Business verification ($0 but time-consuming)
- Per-message costs ($0.005-0.01 per message)
- Minimum monthly costs ($50-100/month for moderate usage)
