# Email Setup Guide

## For Development (Recommended)

The system automatically falls back to Ethereal test accounts if SMTP is not configured. This is perfect for development and testing.

### How it works:
1. When you request a password reset, the system will use Ethereal
2. Check the backend console for a preview URL like: `https://ethereal.email/message/...`
3. Click the preview URL to see the email with the reset code

### No configuration needed for development!

## For Production

To use real email sending, configure these environment variables:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=false

# App Configuration
APP_NAME=GreenGrow
APP_SUPPORT_EMAIL=your_email@gmail.com
```

### Gmail Setup:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password (not your regular password) in SMTP_PASS

### Other Email Providers:
- **Outlook/Hotmail**: smtp-mail.outlook.com, port 587
- **Yahoo**: smtp.mail.yahoo.com, port 587
- **Custom SMTP**: Use your provider's settings

## Testing

Run the test script to verify email configuration:
```bash
cd backend
node test-email.js
```

## Troubleshooting

1. **"Failed to send reset code"** - Check backend console for error details
2. **SMTP errors** - Verify credentials and enable "less secure apps" or use App Passwords
3. **Network issues** - Check firewall settings for SMTP ports (587, 465)

The system will automatically fall back to Ethereal if SMTP fails, so you can always test the password reset flow!
