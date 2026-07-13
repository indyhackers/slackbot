import { Database } from "bun:sqlite";

const database = new Database(process.env.SLACKBOT_DB_PATH ?? "slackbot.db");

database.run(`
  CREATE TABLE IF NOT EXISTS scheduled_messages (
    user_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    scheduled_message_id TEXT PRIMARY KEY
  ) STRICT
`);

export interface ScheduledMessage {
  user_id: string;
  channel: string;
  scheduled_message_id: string;
}

const insert = database.query<
  unknown,
  [userId: string, channel: string, scheduledMessageId: string]
>(
  "INSERT INTO scheduled_messages VALUES (?, ?, ?)",
);
const select = database.query<ScheduledMessage, [userId: string]>(
  "SELECT * FROM scheduled_messages WHERE user_id = ?",
);
const remove = database.query<unknown, [userId: string]>(
  "DELETE FROM scheduled_messages WHERE user_id = ?",
);

export function insertScheduledMessage(message: ScheduledMessage): void {
  insert.run(message.user_id, message.channel, message.scheduled_message_id);
}

export function selectScheduledMessages(userId: string): ScheduledMessage[] {
  return select.all(userId);
}

export function deleteScheduledMessages(userId: string): void {
  remove.run(userId);
}
