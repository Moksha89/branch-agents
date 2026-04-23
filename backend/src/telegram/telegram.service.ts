import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly apiBase: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.apiBase = `https://api.telegram.org/bot${this.botToken}`;
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not set — OTP sending will fail');
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
