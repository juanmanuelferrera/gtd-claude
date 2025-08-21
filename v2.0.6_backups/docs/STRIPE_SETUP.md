# 💳 HyperFiler Payment Setup Guide

## Quick Start (5 minutes)

### 1. Create Stripe Account
- Go to https://stripe.com
- Click "Start now" 
- Create account with your email
- **Don't worry about business verification yet - use test mode**

### 2. Get Your Keys
After creating account:
- Go to **Developers → API keys**
- Copy your **Publishable key** (starts with `pk_test_`)
- Copy your **Secret key** (starts with `sk_test_`)

### 3. Create a Product
- Go to **Products** in Stripe Dashboard
- Click **"Add Product"**
- Name: "HyperFiler Pro"
- Description: "Unlimited tasks and cloud sync"
- Price: €49.98 (one-time payment)
- Click **Save**
- Copy the **Price ID** (starts with `price_`)

### 4. Update Your Code

**In `payment-integration.html`:**
```javascript
// Replace this line:
const stripe = Stripe('pk_test_51234567890abcdef...');

// With your actual publishable key:
const stripe = Stripe('pk_test_YOUR_ACTUAL_KEY_HERE');
```

**In `payment-server.js`:**
```javascript
// Replace this line:
const stripe = require('stripe')('sk_test_...');

// With your actual secret key:
const stripe = require('stripe')('sk_test_YOUR_ACTUAL_KEY_HERE');
```

**In `payment-integration.html` (priceId):**
```javascript
// Replace this line:
priceId: 'price_1234567890abcdef',

// With your actual price ID:
priceId: 'price_YOUR_ACTUAL_PRICE_ID_HERE',
```

### 5. Install Dependencies
```bash
npm install express stripe cors
```

### 6. Test It
```bash
node payment-server.js
```

Then open: http://localhost:3000/upgrade

### 7. Test Payment
- Use test card: `4242 4242 4242 4242`
- Any future date
- Any 3-digit CVC
- Any zip code

## Integration with HyperFiler

Add this to your main `hyperfiler.html`:

```html
<!-- Add this button to your navigation -->
<button onclick="window.open('/upgrade', '_blank')" style="background: #FFD700; color: #333; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
    ⭐ Upgrade to Pro
</button>
```

## Pro Features to Add

Once payment is successful, enable these features:

1. **Unlimited tasks** (remove 50-task limit)
2. **Cloud sync** (save to external service)
3. **Advanced exports** (PDF, CSV, etc.)
4. **Priority support** (email/chat)
5. **Team sharing** (future feature)

## Going Live

When ready for real customers:
1. Complete Stripe business verification
2. Replace `pk_test_` keys with `pk_live_` keys
3. Replace `sk_test_` keys with `sk_live_` keys
4. Set up webhook endpoints
5. Add terms of service and privacy policy

## Revenue Potential

- **€49.98/user** (one-time payment)
- **100 users** = €4,998 total
- **1,000 users** = €49,980 total
- **10,000 users** = €499,800 total

Start charging immediately to validate demand! 🚀