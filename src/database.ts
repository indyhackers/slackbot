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
  insert: (...params: [
    userId: ScheduledMessage["user_id"],
    channel: ScheduledMessage["channel"],
    scheduledMessageId: ScheduledMessage["scheduled_message_id"],
  ]) =>
    database
      .query<unknown, typeof params>("INSERT INTO scheduled_messages VALUES (?, ?, ?)")
      .run(...params),

  select: (...params: [userId: ScheduledMessage["user_id"]]) =>
    database
      .query<ScheduledMessage, typeof params>("SELECT * FROM scheduled_messages WHERE user_id = ?")
      .all(...params),

  delete: (...params: [userId: ScheduledMessage["user_id"]]) =>
    database
      .query<unknown, typeof params>("DELETE FROM scheduled_messages WHERE user_id = ?")
      .run(...params),
};
