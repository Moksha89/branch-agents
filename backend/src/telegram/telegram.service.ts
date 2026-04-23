import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly apiBase: string;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private lastUpdateId = 0;

  constructor(private prisma: PrismaService) {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.apiBase = `https://api.telegram.org/bot${this.botToken}`;
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not set — OTP sending will fail');
    }
  }

  onModuleInit() {
    if (this.botToken) {
      this.startPolling();
    }
  }

  onModuleDestroy() {
    this.stopPolling();
  }

  private startPolling() {
    this.logger.log('Starting Telegram bot polling for link codes...');
    this.pollingInterval = setInterval(() => this.pollUpdates(), 3000);
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async pollUpdates() {
    try {
      const res = await fetch(
        `${this.apiBase}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=1&allowed_updates=["message"]`,
      );
      const data = await res.json();

      if (!data.ok || !data.result?.length) return;

      for (const update of data.result) {
        this.lastUpdateId = update.update_id;
        await this.handleUpdate(update);
      }
    } catch (error) {
      this.logger.error(`Polling error: ${error}`);
    }
  }

  private async handleUpdate(update: { message?: { chat: { id: number }; text?: string; from?: { first_name?: string } } }) {
    const message = update.message;
    if (!message?.text) return;

    const chatId = message.chat.id.toString();
    const text = message.text.trim();
    const firstName = message.from?.first_name || 'there';

    // Handle /start command
    if (text === '/start') {
      await this.sendMessage(
        chatId,
        `👋 Hello ${firstName}!\n\n` +
          `This bot sends login OTPs for <b>Systematic Web</b>.\n\n` +
          `To link your account:\n` +
          `1. Login to Systematic Web with your password\n` +
          `2. Click "Link Telegram 2FA" on the dashboard\n` +
          `3. Send the link code here\n\n` +
          `Your Chat ID: <code>${chatId}</code>`,
      );
      return;
    }

    // Check if message is a link code (format: SW-XXXXXX)
    if (text.toUpperCase().startsWith('SW-')) {
      await this.handleLinkCode(chatId, text.toUpperCase(), firstName);
      return;
    }

    // Unknown message
    await this.sendMessage(
      chatId,
      `I only accept link codes from Systematic Web.\n\n` +
        `Your Chat ID: <code>${chatId}</code>\n\n` +
        `To link your account, login to Systematic Web and click "Link Telegram 2FA".`,
    );
  }

  private async handleLinkCode(chatId: string, code: string, firstName: string) {
    try {
      // Find valid link code
      const linkCode = await this.prisma.telegramLinkCode.findFirst({
        where: {
          code,
          used: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!linkCode) {
        await this.sendMessage(
          chatId,
          `❌ Invalid or expired link code.\n\nPlease generate a new code from Systematic Web.`,
        );
        return;
      }

      // Update user's telegramChatId
      await this.prisma.user.update({
        where: { id: linkCode.userId },
        data: { telegramChatId: chatId },
      });

      // Mark code as used
      await this.prisma.telegramLinkCode.update({
        where: { id: linkCode.id },
        data: { used: true },
      });

      // Get user info for confirmation
      const user = await this.prisma.user.findUnique({
        where: { id: linkCode.userId },
        select: { username: true, fullName: true },
      });

      await this.sendMessage(
        chatId,
        `✅ <b>Telegram 2FA Linked Successfully!</b>\n\n` +
          `Account: <b>${user?.fullName}</b> (@${user?.username})\n\n` +
          `From now on, you'll receive OTP codes here when you login.\n` +
          `Keep this chat — do not block or delete it.`,
      );

      this.logger.log(`Telegram linked for user ${user?.username} (chatId: ${chatId})`);
    } catch (error) {
      this.logger.error(`Failed to handle link code: ${error}`);
      await this.sendMessage(chatId, `❌ Something went wrong. Please try again.`);
    }
  }

  async sendMessage(chatId: string, text: string): Promise<boolean> {
    if (!this.botToken) {
      this.logger.error('Cannot send Telegram message: TELEGRAM_BOT_TOKEN not set');
      return false;
    }

    try {
      const res = await fetch(`${this.apiBase}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        this.logger.error(`Telegram API error: ${JSON.stringify(data)}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send Telegram message: ${error}`);
      return false;
    }
  }

  async sendOtp(chatId: string, otp: string, username: string): Promise<boolean> {
    const message =
      `🔐 <b>Systematic Web Login OTP</b>\n\n` +
      `Your one-time password is:\n\n` +
      `<code>${otp}</code>\n\n` +
      `User: <b>${username}</b>\n` +
      `Valid for 5 minutes. Do not share this code.`;

    return this.sendMessage(chatId, message);
  }
}
