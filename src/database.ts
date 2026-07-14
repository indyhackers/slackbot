import { Database } from "bun:sqlite";

const database = new Database(process.env.SLACKBOT_DB_PATH ?? "slackbot.db", {
  strict: true,
});

database.run(`
  CREATE TABLE IF NOT EXISTS scheduled_messages (
    user_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    scheduled_message_id TEXT PRIMARY KEY,
    post_at INTEGER NOT NULL
  ) STRICT
`);

type ScheduledMessage = {
  user_id: string;
  channel: string;
  scheduled_message_id: string;
  post_at: number;
};

export const scheduledMessages = {
  insert: (message: ScheduledMessage) =>
    database
      .query<unknown, ScheduledMessage>(
        "INSERT INTO scheduled_messages VALUES ($user_id, $channel, $scheduled_message_id, $post_at)",
      )
      .run(message),

  select: (...params: [userId: ScheduledMessage["user_id"]]) =>
    database
      .query<ScheduledMessage, typeof params>("SELECT * FROM scheduled_messages WHERE user_id = ?")
      .all(...params),

  delete: (...params: [scheduledMessageId: ScheduledMessage["scheduled_message_id"]]) =>
    database
      .query<unknown, typeof params>("DELETE FROM scheduled_messages WHERE scheduled_message_id = ?")
      .run(...params),
};
