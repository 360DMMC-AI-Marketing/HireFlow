# Email Setup Guide - Mailtrap Configuration

## Current Issue
Your emails are not being sent because the Mailtrap credentials in `.env` are not correct.

## How to Fix

### Step 1: Get Your Mailtrap Credentials

1. Go to https://mailtrap.io and log in
2. Click on your inbox (or create one if needed)
3. Go to "SMTP Settings" tab
4. You'll see something like:
   ```
   Host: sandbox.smtp.mailtrap.io
   Port: 2525
   Username: YOUR_USERNAME_HERE
   Password: YOUR_PASSWORD_HERE
   ```

### Step 2: Update Your `.env` File

Open `backend/.env` and replace with YOUR actual credentials:

```env
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=YOUR_ACTUAL_MAILTRAP_USERNAME
EMAIL_PASSWORD=YOUR_ACTUAL_MAILTRAP_PASSWORD
```

### Step 3: Restart Backend Server

```bash
# Kill the current server
taskkill /F /IM node.exe

# Start it again
cd backend
node server.js
```

## Testing Without Email (Current Workaround)

Since email might not be configured, I've added these features:

### 1. Backend Console Shows Token
When you sign up, the backend will print:
```
🔑 Token: abc123xyz...
🔗 Or visit: http://localhost:5173/verify-email?token=abc123xyz...
```

### 2. Auto-Verification from URL
- The signup page now automatically redirects with the token in dev mode
- Just click the link from console, or it happens automatically

### 3. Manual Token Entry
- Go to `/verify-email` page
- Paste the token from backend console
- Click "Verify Email"

### 4. Development Mode Returns Token
The signup API response includes the token in development:
```json
{
  "success": true,
  "verificationToken": "abc123...",
  "verificationUrl": "http://localhost:5173/verify-email?token=abc123..."
}
```

## Test the Full Flow

1. **Sign Up** at http://localhost:5173/signup
   - Fill in email, password, company details
   - Submit

2. **Check Backend Console**
   - Look for the verification token
   - Copy it if needed

3. **Verify Email** - One of these will happen:
   - Auto-redirect with token (development mode)
   - Or paste token manually on verify-email page
   - Or click link from Mailtrap (if configured)

4. **Login** at http://localhost:5173/login
   - Use your email and password
   - Should work after verification

## Common Issues

### "Please verify your email first"
- Your account exists but isn't verified
- Check backend console for verification token
- Go to `/verify-email?token=YOUR_TOKEN`

### "Invalid credentials" (Mailtrap)
- Wrong username/password in `.env`
- Get correct credentials from Mailtrap.io

### No token in console
- Backend might not be in development mode
- Check: `NODE_ENV=development` in `.env`
- Restart server after changes

## Quick Commands

```bash
# Clear all users (start fresh)
cd backend
node clearUsers.js

# Restart backend
taskkill /F /IM node.exe
cd backend
node server.js

# Check .env is loaded
cd backend
Get-Content .env | Select-String "EMAIL"
```
