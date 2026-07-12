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

export function saveScheduledMessage(
  userId: string,
  channel: string,
  scheduledMessageId: string,
): void {
  sql.run`INSERT INTO scheduled_messages VALUES (${userId}, ${channel}, ${scheduledMessageId})`;
}

export function getScheduledMessages(userId: string) {
  return sql
    .all`SELECT channel, scheduled_message_id FROM scheduled_messages WHERE user_id = ${userId}`
    .map((message) => ({
      channel: String(message.channel),
      scheduled_message_id: String(message.scheduled_message_id),
    }));
}

export function deleteScheduledMessages(userId: string): void {
  sql.run`DELETE FROM scheduled_messages WHERE user_id = ${userId}`;
}
