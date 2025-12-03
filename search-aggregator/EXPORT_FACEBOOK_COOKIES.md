# How to Export Facebook Cookies

Since you're already logged into Facebook, follow these steps to export your cookies:

## Step 1: Install Cookie Extension

### For Chrome/Edge:
1. Go to: https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg
2. Click "Add to Chrome/Edge"

### For Firefox:
1. Go to: https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/
2. Click "Add to Firefox"

## Step 2: Export Your Cookies

1. **Stay logged into Facebook** (keep your current tab open)
2. Click the cookie extension icon in your browser toolbar
3. Click "Export" or the export icon (📋)
4. The cookies will be copied to your clipboard as JSON

## Step 3: Save Cookies to File

On your server, run:

```bash
# Create directory
mkdir -p /projects/LibreChat/marketplace-cookies

# Create the cookies file
nano /projects/LibreChat/marketplace-cookies/facebook.json
```

Paste your cookies and save (Ctrl+X, then Y, then Enter)

## Step 4: Configure Facebook Groups

Add your group IDs to .env:

```bash
# Extract group ID from URL: https://www.facebook.com/groups/802339673139879/
# The ID is: 802339673139879

# Add to .env (comma-separated for multiple groups):
FACEBOOK_GROUP_IDS=802339673139879,another_group_id,yet_another_id
```

## Step 5: Update docker-compose.yml

Add this to the `search_aggregator` service:

```yaml
search_aggregator:
  volumes:
    - ./marketplace-cookies:/app/marketplace-cookies:ro
  environment:
    - FACEBOOK_COOKIES_FILE=/app/marketplace-cookies/facebook.json
    - FACEBOOK_GROUP_IDS=${FACEBOOK_GROUP_IDS}
```

## Step 6: Enable and Restart

Update .env:
```bash
ENABLE_FACEBOOK=true
```

Restart:
```bash
docker-compose restart search_aggregator
```

## Finding Your Group IDs

For each group you're in:
1. Visit the group page
2. Look at the URL: `https://www.facebook.com/groups/802339673139879/`
3. Copy the number (that's the group ID)
4. Add all group IDs to FACEBOOK_GROUP_IDS separated by commas

Example:
```bash
FACEBOOK_GROUP_IDS=802339673139879,123456789,987654321
```
