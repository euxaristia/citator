/**
 * Daily Verse Scheduler
 * Automatically posts verse of the day to configured channels
 */

import { BibleService } from "../services/bible.ts";

export interface ScheduledChannel {
  channelId: string;
  guildId: string;
}

export class DailyVerseScheduler {
  private bibleService: BibleService;
  private schedule: string;
  private timezone: string;
  private channels: ScheduledChannel[] = [];
  private sendToChannel: (channelId: string, message: string) => Promise<void>;
  private timerId: number | null = null;

  constructor(
    bibleService: BibleService,
    schedule: string,
    timezone: string,
    sendToChannel: (channelId: string, message: string) => Promise<void>
  ) {
    this.bibleService = bibleService;
    this.schedule = schedule;
    this.timezone = timezone;
    this.sendToChannel = sendToChannel;
  }

  /**
   * Add a channel to receive daily verses
   */
  addChannel(channelId: string, guildId: string): void {
    if (!this.channels.find((c) => c.channelId === channelId)) {
      this.channels.push({ channelId, guildId });
    }
  }

  /**
   * Remove a channel from daily verse distribution
   */
  removeChannel(channelId: string): void {
    this.channels = this.channels.filter((c) => c.channelId !== channelId);
  }

  /**
   * Start the scheduler
   */
  start(): void {
    this.scheduleNextRun();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Schedule the next daily verse run
   */
  private scheduleNextRun(): void {
    const now = new Date();
    const nextRun = this.getNextRunTime(now);
    const delay = nextRun.getTime() - now.getTime();

    console.log(
      `[Scheduler] Next daily verse scheduled for: ${nextRun.toISOString()} (in ${Math.round(delay / 1000 / 60)} minutes)`
    );

    this.timerId = setTimeout(() => {
      this.sendDailyVerse();
      this.scheduleNextRun(); // Schedule the next run
    }, delay) as unknown as number;
  }

  /**
   * Get the next run time based on cron-like schedule
   */
  private getNextRunTime(now: Date): Date {
    // Parse simple cron format: "minute hour * * *"
    const parts = this.schedule.split(" ");
    const minute = parseInt(parts[0]);
    const hour = parseInt(parts[1]);

    const next = new Date(
      now.toLocaleString("en-US", { timeZone: this.timezone })
    );

    // Set to scheduled time today
    next.setHours(hour, minute, 0, 0);

    // If already passed for today, schedule for tomorrow
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Send daily verse to all configured channels
   */
  private async sendDailyVerse(): Promise<void> {
    console.log(`[Scheduler] Sending daily verse to ${this.channels.length} channel(s)`);

    try {
      const verse = await this.bibleService.getVerseOfTheDay();
      const message = `🌟 **Daily Verse**\n\n${verse.text}\n\n*${verse.reference} (${verse.version})*\n\n_Have a blessed day!_ ✨`;

      // Send to all channels
      for (const channel of this.channels) {
        try {
          await this.sendToChannel(channel.channelId, message);
          console.log(`[Scheduler] Sent to channel ${channel.channelId}`);
        } catch (error) {
          console.error(
            `[Scheduler] Failed to send to channel ${channel.channelId}:`,
            error instanceof Error ? error.message : error
          );
        }
      }
    } catch (error) {
      console.error(
        "[Scheduler] Error fetching daily verse:",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Manually trigger daily verse send
   */
  async triggerNow(): Promise<void> {
    await this.sendDailyVerse();
  }
}
