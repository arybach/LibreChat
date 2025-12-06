const axios = require('axios');

/**
 * Notification service for Telegram and WhatsApp alerts
 */

class NotificationService {
  constructor() {
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramApiUrl = 'https://api.telegram.org/bot';
    this.whatsappApiUrl = process.env.WHATSAPP_API_URL; // Twilio or similar
    this.whatsappAccountSid = process.env.WHATSAPP_ACCOUNT_SID;
    this.whatsappAuthToken = process.env.WHATSAPP_AUTH_TOKEN;
    this.whatsappFromNumber = process.env.WHATSAPP_FROM_NUMBER;
  }

  /**
   * Send Telegram notification
   */
  async sendTelegram(chatId, message, listing = null) {
    if (!this.telegramBotToken) {
      console.warn('⚠️  Telegram bot token not configured');
      return { success: false, error: 'No bot token' };
    }

    try {
      const url = `${this.telegramApiUrl}${this.telegramBotToken}/sendMessage`;
      
      let text = `🔔 *New Listing Alert*\n\n${message}`;
      
      if (listing) {
        text += `\n\n*${listing.title}*\n`;
        text += `💰 Price: $${listing.price}\n`;
        text += `📍 Location: ${listing.location}\n`;
        text += `🏷️ Platform: ${listing.platform}\n`;
        text += `🔗 [View Listing](${listing.url})`;
      }

      const response = await axios.post(url, {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      });

      console.log(`✅ Telegram notification sent to ${chatId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Telegram send error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send WhatsApp notification via Twilio
   */
  async sendWhatsApp(phoneNumber, message, listing = null) {
    if (!this.whatsappApiUrl || !this.whatsappAccountSid || !this.whatsappAuthToken) {
      console.warn('⚠️  WhatsApp API not configured');
      return { success: false, error: 'WhatsApp not configured' };
    }

    try {
      let body = `🔔 New Listing Alert\n\n${message}`;
      
      if (listing) {
        body += `\n\n${listing.title}\n`;
        body += `💰 Price: $${listing.price}\n`;
        body += `📍 Location: ${listing.location}\n`;
        body += `🏷️ Platform: ${listing.platform}\n`;
        body += `🔗 ${listing.url}`;
      }

      const response = await axios.post(
        `${this.whatsappApiUrl}/2010-04-01/Accounts/${this.whatsappAccountSid}/Messages.json`,
        new URLSearchParams({
          From: `whatsapp:${this.whatsappFromNumber}`,
          To: `whatsapp:${phoneNumber}`,
          Body: body,
        }),
        {
          auth: {
            username: this.whatsappAccountSid,
            password: this.whatsappAuthToken,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.log(`✅ WhatsApp notification sent to ${phoneNumber}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ WhatsApp send error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification via all enabled channels
   */
  async sendMultiChannel(alert, listing) {
    const results = {
      telegram: { sent: false, error: null },
      whatsapp: { sent: false, error: null },
    };

    const message = `Your search alert "${alert.name}" has a new match!`;

    // Send Telegram if enabled
    if (alert.notificationChannels.telegram?.enabled && alert.notificationChannels.telegram?.chatId) {
      const result = await this.sendTelegram(
        alert.notificationChannels.telegram.chatId,
        message,
        listing
      );
      results.telegram.sent = result.success;
      results.telegram.error = result.error || null;
    }

    // Send WhatsApp if enabled
    if (alert.notificationChannels.whatsapp?.enabled && alert.notificationChannels.whatsapp?.phoneNumber) {
      const result = await this.sendWhatsApp(
        alert.notificationChannels.whatsapp.phoneNumber,
        message,
        listing
      );
      results.whatsapp.sent = result.success;
      results.whatsapp.error = result.error || null;
    }

    return results;
  }
}

module.exports = new NotificationService();
