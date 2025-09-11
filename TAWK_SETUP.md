# Tawk.to Chat Integration Setup

## Quick Setup Guide

### Step 1: Get Your Tawk.to Property ID

1. Sign up for a free account at [Tawk.to](https://www.tawk.to)
2. Go to your [Dashboard](https://dashboard.tawk.to)
3. Navigate to **Administration** → **Channels** → **Chat Widget**
4. You'll see a code snippet that looks like:
   ```javascript
   https://embed.tawk.to/YOUR_PROPERTY_ID/default
   ```
5. Copy your `YOUR_PROPERTY_ID` (it's a string like `5e1abc123def456789`)

### Step 2: Update the Integration Code

1. Open `hyperfiler-pro.html`
2. Find line 5988 (search for `YOUR_PROPERTY_ID`)
3. Replace `YOUR_PROPERTY_ID` with your actual property ID:
   ```javascript
   s1.src='https://embed.tawk.to/5e1abc123def456789/default';
   ```

### Step 3: Configure Tawk.to Settings (Optional)

In your Tawk.to dashboard, you can:

- **Customize appearance**: Change colors, position, and size
- **Set up automated messages**: Welcome messages, offline forms
- **Add team members**: Invite agents to handle chats
- **Enable language support**: The integration already supports Spanish/English switching
- **Set business hours**: Configure when you're available

## Features Already Integrated

✅ **Automatic Language Switching**
- When users switch between English/Spanish in the app, Tawk.to updates too

✅ **User Identification**
- If users are logged in, their info is passed to Tawk.to

✅ **Page Tracking**
- Track which views users are on when they start a chat

✅ **Custom Launch Button**
- "💬 Live Support" button in the sidebar opens the chat

## Testing

1. Deploy your changes
2. Visit your site
3. You should see the Tawk.to widget in the bottom-right corner
4. Click the "💬 Live Support" button in the sidebar to open the chat
5. Test language switching - the chat should update its language

## Troubleshooting

If the chat doesn't appear:

1. Check browser console for errors
2. Verify your Property ID is correct
3. Make sure Tawk.to widget is enabled in your dashboard
4. Check if ad blockers are interfering

## Support

- Tawk.to Documentation: https://help.tawk.to
- Tawk.to API Reference: https://developer.tawk.to/jsapi/