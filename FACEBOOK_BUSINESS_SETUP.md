# Facebook Business Manager Setup Guide

## Prerequisites
- Meta Business account (verified)
- WhatsApp Business API access approved by Meta
- Facebook Developer account

## Step 1: Create Facebook App

1. Go to https://developers.facebook.com/
2. Click "My Apps" → "Create App"
3. Select "Business" as app type
4. Fill in app details:
   - App Name: "Hisaab WhatsApp Integration"
   - Contact Email: your-email@example.com
5. Click "Create App"

## Step 2: Configure WhatsApp Business API

1. In your Facebook App dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set Up"
3. Follow the setup wizard:
   - Select your Business Manager account
   - Add a phone number for WhatsApp
   - Verify the phone number
4. Note down:
   - **Phone Number ID** (from WhatsApp → API Setup)
   - **App ID** (from Settings → Basic)
   - **App Secret** (from Settings → Basic → Show button)

## Step 3: Configure OAuth Redirect URI

1. In Facebook App dashboard, go to "WhatsApp" → "Configuration"
2. Add OAuth Redirect URI:
   ```
   http://204.12.227.184/api/facebook_oauth_callback.php
   ```
   (Or your production domain)

## Step 4: Configure Hisaab Portal

1. Login to Hisaab portal as admin
2. Go to Settings → WhatsApp Connection
3. Scroll to "Facebook Business Manager Integration"
4. Enter:
   - Facebook App ID (from Step 2)
   - Facebook App Secret (from Step 2)
   - WhatsApp Phone Number ID (from Step 2)
5. Click "Save Facebook Configuration"

## Step 5: Authenticate with Facebook

1. In the "Select Authentication Method" section, choose "WhatsApp Business API (Facebook)"
2. Click "Login with Facebook Business Manager"
3. You'll be redirected to Facebook
4. Approve the permissions requested
5. You'll be redirected back to Hisaab with access token saved

## Step 6: Test Message Sending

1. Go to Reports page
2. Select an agent
3. Click "Send to WhatsApp"
4. Message should be sent via WhatsApp Business API

## Troubleshooting

### Error: "Invalid OAuth redirect URI"
- Ensure the redirect URI in Facebook App settings matches exactly: `http://204.12.227.184/api/facebook_oauth_callback.php`

### Error: "Access token invalid"
- Access tokens expire after 60 days
- Re-authenticate by clicking "Login with Facebook Business Manager" again

### Error: "Phone number not verified"
- Ensure your WhatsApp Business phone number is verified in Facebook Business Manager

### Error: "Message template not approved"
- WhatsApp Business API requires pre-approved templates for certain messages
- Check your templates in Facebook Business Manager → WhatsApp → Message Templates
- Plain text messages should work without template approval

## Costs

WhatsApp Business API pricing (as of 2024):
- Free tier: 1000 messages/month
- Paid: ~$0.005-0.01 per message (varies by country)
- Monthly minimum: ~$50-100 depending on usage

## Important Notes

1. **Access Token Expiration**: Tokens expire after 60 days. You'll need to re-authenticate.
2. **Message Templates**: Some message types require pre-approved templates in Facebook Business Manager.
3. **Phone Number**: The WhatsApp Business phone number must be different from any personal WhatsApp number.
4. **Business Verification**: Meta may require business verification before approving high message volumes.

## Switching Between Authentication Methods

The Hisaab portal supports both:
- **WhatsApp Web (QR Code)**: Free, requires QR scanning, phone stays online
- **WhatsApp Business API (Facebook)**: Paid, OAuth2, enterprise-grade

You can switch between methods anytime in Settings → WhatsApp Connection. Only one method can be active at a time.

## Support

For Facebook Business Manager issues:
- Facebook Developer Support: https://developers.facebook.com/support/
- WhatsApp Business API Documentation: https://developers.facebook.com/docs/whatsapp

For Hisaab Portal issues:
- Contact your system administrator
