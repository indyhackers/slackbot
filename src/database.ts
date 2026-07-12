import { DatabaseSync } from "node:sqlite";

const database = new DatabaseSync(
  process.env.SLACKBOT_DB_PATH ?? "slackbot.db",
);

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
  database
    .prepare("INSERT INTO scheduled_messages VALUES (?, ?, ?)")
    .run(userId, channel, scheduledMessageId);
}

export function getScheduledMessages(userId: string) {
  return database
    .prepare(
      "SELECT channel, scheduled_message_id FROM scheduled_messages WHERE user_id = ?",
    )
    .all(userId)
    .map((message) => ({
      channel: String(message.channel),
      scheduled_message_id: String(message.scheduled_message_id),
    }));
}

export function deleteScheduledMessages(userId: string): void {
  database
    .prepare("DELETE FROM scheduled_messages WHERE user_id = ?")
    .run(userId);
}
