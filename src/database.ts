import { Database } from "bun:sqlite";

const database = new Database(process.env.SLACKBOT_DB_PATH ?? "slackbot.db");

database.run(`
  CREATE TABLE IF NOT EXISTS scheduled_messages (
    user_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    scheduled_message_id TEXT PRIMARY KEY
  ) STRICT
`);

interface ScheduledMessage {
  user_id: string;
  channel: string;
  scheduled_message_id: string;
}

export const scheduledMessages = {
  insert(message: ScheduledMessage): void {
    database.query<
      unknown,
      [
        userId: typeof message.user_id,
        channel: typeof message.channel,
        scheduledMessageId: typeof message.scheduled_message_id,
      ]
    >(
      "INSERT INTO scheduled_messages VALUES (?, ?, ?)",
    ).run(message.user_id, message.channel, message.scheduled_message_id);
  },

  select(userId: ScheduledMessage["user_id"]): ScheduledMessage[] {
    return database.query<ScheduledMessage, [userId: typeof userId]>(
      "SELECT * FROM scheduled_messages WHERE user_id = ?",
    ).all(userId);
  },

  delete(userId: ScheduledMessage["user_id"]): void {
    database.query<unknown, [userId: typeof userId]>(
      "DELETE FROM scheduled_messages WHERE user_id = ?",
    ).run(userId);
  },
};
