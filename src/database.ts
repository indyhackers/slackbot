import { DatabaseSync } from "node:sqlite";

const database = new DatabaseSync(
  process.env.SLACKBOT_DB_PATH ?? "slackbot.db",
);
const sql = database.createTagStore();

database.exec(`
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

export function insert(message: ScheduledMessage): void {
  sql.run`INSERT INTO scheduled_messages VALUES (${message.user_id}, ${message.channel}, ${message.scheduled_message_id})`;
}

export function select(userId: string): ScheduledMessage[] {
  return sql
    .all`SELECT * FROM scheduled_messages WHERE user_id = ${userId}`
    .map((message) => ({
      user_id: String(message.user_id),
      channel: String(message.channel),
      scheduled_message_id: String(message.scheduled_message_id),
    }));
}

export function deleteScheduledMessages(userId: string): void {
  sql.run`DELETE FROM scheduled_messages WHERE user_id = ${userId}`;
}
