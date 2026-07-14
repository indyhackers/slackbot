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
  insert: (() => {
    const statement = database.query<
      unknown,
      [
        userId: ScheduledMessage["user_id"],
        channel: ScheduledMessage["channel"],
        scheduledMessageId: ScheduledMessage["scheduled_message_id"],
      ]
    >(
      "INSERT INTO scheduled_messages VALUES (?, ?, ?)",
    );
    return statement.run.bind(statement);
  })(),
  select: (() => {
    const statement = database.query<
      ScheduledMessage,
      [userId: ScheduledMessage["user_id"]]
    >(
      "SELECT * FROM scheduled_messages WHERE user_id = ?",
    );
    return statement.all.bind(statement);
  })(),
  delete: (() => {
    const statement = database.query<unknown, [userId: ScheduledMessage["user_id"]]>(
      "DELETE FROM scheduled_messages WHERE user_id = ?",
    );
    return statement.run.bind(statement);
  })(),
};
