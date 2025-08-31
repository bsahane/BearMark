# Google Calendar Integration Setup

This guide explains how to set up real Google Calendar integration for BearMark Chrome Extension.

## Quick Start (Demo Mode)
By default, BearMark shows demo calendar events. Click "Connect Google Calendar" and then "OK" to see sample events.

## Real Google Calendar Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### Step 2: Enable Calendar API
1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and click "Enable"

### Step 3: Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in required fields (App name, User support email, Developer email)
   - Add `https://www.googleapis.com/auth/calendar.readonly` to scopes
4. For Application type, choose "Web application"
5. Add Authorized JavaScript origins:
   - `chrome-extension://[YOUR_EXTENSION_ID]`
6. Copy the Client ID (looks like: `123456789-abc123.apps.googleusercontent.com`)

### Step 4: Update Extension
1. Open `extension/manifest.json`
2. Replace `451234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com` with your actual Client ID
3. Reload the extension in Chrome

### Step 5: Test Integration
1. Open a new tab (BearMark should load)
2. Click the calendar icon in the header
3. Click "Connect Google Calendar"
4. Follow the Google authentication flow
5. Grant calendar read permissions
6. Your real calendar events should now appear!

## Troubleshooting

### "Invalid client" error
- Check that your Client ID is correctly copied to manifest.json
- Ensure the extension ID is added to authorized origins in Google Cloud Console

### "Access blocked" error  
- Complete the OAuth consent screen configuration
- Add your email to test users if the app is not published

### No events showing
- Check that you have events in your primary Google Calendar for today
- Verify calendar permissions were granted during authentication

### Permission denied
- Ensure the Google Calendar API is enabled in your Google Cloud project
- Check that the OAuth scope includes calendar readonly access

## Privacy Note
BearMark only requests read-only access to your calendar events and never stores or transmits your calendar data outside of your local Chrome storage.

