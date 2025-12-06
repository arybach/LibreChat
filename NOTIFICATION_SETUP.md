# Notification System Setup Guide

## Overview

LibreChat's Search Aggregator now supports real-time notifications via **Telegram** and **WhatsApp** when new listings match your search criteria.

## Architecture

The notification system has **two independent components**:

### 1. **Background Scraper** (Automatic, No LLM)
- Node.js cron job runs 3x/day (6 AM, 12 PM, 6 PM)
- Scrapes marketplaces → stores listings in MongoDB
- Checks user alerts → sends push notifications
- **Fully automated** - no user interaction needed

### 2. **LibreChat Agent Tools** (LLM-Powered, On-Demand)
- User talks to AI agent in chat
- Agent uses tools to:
  - **Search listings** (`marketplace_search`) - query MongoDB for recent results
  - **Create alerts** (`create_search_alert`) - set up notifications
  - **List alerts** (`list_search_alerts`) - view configured alerts
  - **Delete alerts** (`delete_search_alert`) - remove alerts
- Agent queries **already-scraped data** from MongoDB (doesn't scrape on-demand)

### How Data Flows

```
Background Process (automatic):
Scrapers → MongoDB → Alert Matcher → Telegram/WhatsApp

User-Initiated (via LLM agent):
User message → AI Agent → Tool call → MongoDB query → Results to user
```

**Key Point**: The LLM doesn't scrape - it queries MongoDB for listings that were scraped by the background job. Fresh data depends on cron schedule.

---

## Features

- 🔔 **Real-time alerts** when matching listings appear
- 📱 **Multi-channel support**: Telegram and WhatsApp
- 🎯 **Keyword-based matching** with price filters
- ⚙️ **Customizable alerts** per user with multiple search criteria
- 📊 **Multiple daily scrapes** (default: 6 AM, 12 PM, 6 PM)

---

## Setting Up Telegram Notifications

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow prompts to name your bot (e.g., "My Marketplace Alert Bot")
4. Copy the **Bot Token** (looks like: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`)

### 2. Get Your Chat ID

1. Start a chat with your new bot (click the link BotFather provides)
2. Send any message to the bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for `"chat":{"id":123456789}` in the JSON response
5. Copy your **Chat ID** (the number)

### 3. Configure LibreChat

Add to your `.env` file:
```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
```

---

## Setting Up WhatsApp Notifications

### Option 1: Twilio (Recommended)

1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Navigate to [WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
3. Follow instructions to connect your WhatsApp number
4. Get your credentials from [Twilio Console](https://console.twilio.com/)

Add to your `.env` file:
```bash
WHATSAPP_API_URL=https://api.twilio.com
WHATSAPP_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_AUTH_TOKEN=your_auth_token_here
WHATSAPP_FROM_NUMBER=+14155238886
```

### Option 2: Other WhatsApp Business API Providers

You can also use:
- [MessageBird](https://messagebird.com/)
- [Vonage (Nexmo)](https://www.vonage.com/)
- [WhatsApp Business API](https://business.whatsapp.com/) (direct)

Update the `notificationService.js` code accordingly for your provider's API.

---

## Creating Search Alerts

### Via LibreChat Agent (Recommended)

Users can talk to the AI agent naturally:

**User**: "Set up an alert for cheap sofas under $300 in New York, notify me on Telegram"

**Agent**: *Uses `create_search_alert` tool*
- Extracts: keywords=["sofa", "cheap"], maxPrice=300, location="New York"
- Creates alert with user's Telegram chat ID
- Returns confirmation

**User**: "Show me my alerts"

**Agent**: *Uses `list_search_alerts` tool*
- Displays all configured alerts with match counts

**User**: "Delete alert abc123"

**Agent**: *Uses `delete_search_alert` tool*
- Removes the alert

### Via API (Direct)

**Create a new alert:**

```bash
curl -X POST http://localhost:3001/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your_user_id",
    "name": "Cheap Furniture in NYC",
    "keywords": ["sofa", "couch", "sectional"],
    "categories": ["furniture"],
    "locations": ["New York"],
    "platforms": ["craigslist", "facebook", "ikea"],
    "priceMin": 0,
    "priceMax": 300,
    "notificationChannels": {
      "telegram": {
        "enabled": true,
        "chatId": "123456789"
      },
      "whatsapp": {
        "enabled": false,
        "phoneNumber": "+1234567890"
      }
    },
    "isActive": true
  }'
```

**List all alerts for a user:**

```bash
curl http://localhost:3001/api/alerts/your_user_id
```

**Update an alert:**

```bash
curl -X PUT http://localhost:3001/api/alerts/your_user_id/alert_id \
  -H "Content-Type: application/json" \
  -d '{"priceMax": 500}'
```

**Delete an alert:**

```bash
curl -X DELETE http://localhost:3001/api/alerts/your_user_id/alert_id
```

**Test an alert:**

```bash
curl -X POST http://localhost:3001/api/alerts/your_user_id/alert_id/test
```

---

## Getting Your Telegram Chat ID for Alerts

For alerts to work, you need your **Telegram Chat ID**:

1. Start a chat with your bot (from BotFather setup)
2. Send any message: "Hello"
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find: `"chat":{"id":123456789}`
5. **Give this Chat ID to the agent** when creating alerts

**Example conversation**:
- **User**: "My Telegram chat ID is 123456789, set up an alert for motorcycles under $5000 in Miami"
- **Agent**: Creates alert with `telegramChatId: "123456789"`

## How It Works

### Data Freshness

**Important**: The agent searches **already-scraped listings** stored in MongoDB. Listing freshness depends on the cron schedule:

- Last scrape at **6 AM** → data is current as of 6 AM
- Last scrape at **12 PM** → data is current as of 12 PM
- Next scrape at **6 PM** → new listings will appear then

If a user asks for "latest listings", the agent can only show what's been scraped so far.

### Scraping Schedule

By default, scrapers run **3 times per day**:
- 6:00 AM
- 12:00 PM (Noon)
- 6:00 PM

Configure via `.env`:
```bash
# Run every 6 hours
CRON_SCHEDULE=0 */6 * * *

# Run 4 times a day (6am, 12pm, 6pm, 12am)
CRON_SCHEDULE=0 6,12,18,0 * * *

# Run every 2 hours
CRON_SCHEDULE=0 */2 * * *
```

**Cron syntax**: `minute hour day month weekday`

### Alert Matching Logic

When scrapers find new listings, the system:

1. ✅ Checks each listing against all active alerts
2. ✅ Matches based on:
   - **Keywords** in title/description
   - **Price range** (min/max)
   - **Category** (furniture, autos, etc.)
   - **Location** (if specified)
   - **Platform** (Craigslist, Facebook, IKEA, etc.)
3. ✅ Sends notifications via enabled channels (Telegram/WhatsApp)
4. ✅ Updates alert statistics (match count, last notified time)

---

## Notification Format

### Telegram Message Example

```
🔔 *New Listing Alert*

Your search alert "Cheap Furniture in NYC" has a new match!

*Gray Sectional Sofa - Like New*
💰 Price: $250
📍 Location: Brooklyn, NY
🏷️ Platform: craigslist
🔗 [View Listing](https://newyork.craigslist.org/...)
```

### WhatsApp Message Example

```
🔔 New Listing Alert

Your search alert "Cheap Furniture in NYC" has a new match!

Gray Sectional Sofa - Like New
💰 Price: $250
📍 Location: Brooklyn, NY
🏷️ Platform: craigslist
🔗 https://newyork.craigslist.org/...
```

---

## Alert Best Practices

### Keyword Selection

- ✅ Use **specific terms**: "sectional sofa" vs "furniture"
- ✅ Include **brand names**: "herman miller", "ikea kallax"
- ✅ Add **condition keywords**: "like new", "barely used"
- ❌ Avoid overly broad terms that match everything

### Price Ranges

- Set realistic min/max to reduce noise
- Leave `priceMax: null` for open-ended search
- Use `priceMin: 0` if you don't want a minimum

### Multiple Alerts

Create separate alerts for different criteria:
- One for "couches under $300 in NYC"
- Another for "motorcycles 500-2000 in Miami"
- Different notification channels per alert

---

## Troubleshooting

### Not Receiving Notifications

1. **Check alert is active**: `isActive: true`
2. **Verify bot token**: Test with Telegram's `getMe` endpoint
3. **Confirm chat ID**: Send a test message to your bot
4. **Check logs**: `docker logs search_aggregator`
5. **Verify scraper is running**: Check cron schedule

### Telegram Bot Issues

- Make sure you've **started a chat** with the bot
- Bot must be able to **initiate conversations** (not in group privacy mode)
- Token must be valid and not revoked

### WhatsApp Issues

- Twilio sandbox requires **opt-in** message first
- Production WhatsApp API requires **business verification**
- Check Twilio console for delivery logs

### Too Many Notifications

- Narrow your keywords
- Increase `priceMin` or decrease `priceMax`
- Reduce `platforms` list
- Temporarily set `isActive: false`

---

## Database Schema

### SearchAlert Model

```javascript
{
  userId: String,              // LibreChat user ID
  name: String,                // Alert name
  keywords: [String],          // Search terms
  categories: [String],        // furniture, autos, etc.
  locations: [String],         // City names
  platforms: [String],         // craigslist, facebook, etc.
  priceMin: Number,            // Minimum price
  priceMax: Number,            // Maximum price (null = no limit)
  notificationChannels: {
    telegram: {
      enabled: Boolean,
      chatId: String
    },
    whatsapp: {
      enabled: Boolean,
      phoneNumber: String
    }
  },
  isActive: Boolean,           // Enable/disable alert
  lastNotifiedAt: Date,        // Last notification timestamp
  matchCount: Number,          // Total matches found
  createdAt: Date,
  updatedAt: Date
}
```

---

## Advanced Usage

### Manual Scrape Trigger

Force an immediate scrape:
```bash
curl -X POST http://localhost:3001/api/scrape/trigger
```

### Alert Stats

Query alert performance:
```javascript
const alert = await SearchAlert.findById(alertId);
console.log(`Matches: ${alert.matchCount}`);
console.log(`Last notified: ${alert.lastNotifiedAt}`);
```

### Custom Notification Templates

Edit `search-aggregator/services/notificationService.js` to customize message format.

---

## Security Notes

- 🔒 Store bot tokens in `.env` (never commit to git)
- 🔒 Validate user permissions before creating alerts
- 🔒 Rate limit notification endpoints to prevent abuse
- 🔒 Use HTTPS for Twilio webhooks in production

---

## Next Steps

1. Set up your Telegram bot
2. Configure `.env` with bot token
3. Create your first search alert
4. Test with sample listing
5. Monitor logs during next scheduled scrape

Happy hunting! 🎯
