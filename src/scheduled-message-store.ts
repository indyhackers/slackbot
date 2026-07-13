import { SqliteClient } from "@effect/sql-sqlite-bun";
import { Config, Context, Data, Effect, Function, Layer, Schema, String } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";

export class ScheduledMessage extends Schema.Class<ScheduledMessage>("ScheduledMessage")({
  scheduledMessageId: Schema.String,
  userId: Schema.String,
  channel: Schema.String,
}) { }

export class ScheduledMessageStoreError extends Data.TaggedError("ScheduledMessageStoreError")<{
  readonly op: keyof ScheduledMessageStore;
  readonly cause: unknown;
}> { }

export interface ScheduledMessageStore {
  insert(message: ScheduledMessage): Effect.Effect<void, ScheduledMessageStoreError>;
  select(userId: ScheduledMessage["userId"]): Effect.Effect<ScheduledMessage[], ScheduledMessageStoreError>;
  delete(userId: ScheduledMessage["userId"]): Effect.Effect<void, ScheduledMessageStoreError>;
}

export const ScheduledMessageStore = Context.Service<ScheduledMessageStore>("@indyhackers/slackbot/ScheduledMessageStore");

const makeFn = (op: ScheduledMessageStoreError["op"]) =>
  <Req, A, R>(f: Function.FunctionN<[Req], Effect.Effect<A, unknown, R>>) =>
    Effect.fn(`${ScheduledMessageStore.key}.${op}`)((request: Req) =>
      Effect.mapError(f(request), (cause) => new ScheduledMessageStoreError({ op, cause })),
    );

const makeSql = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE IF NOT EXISTS scheduled_messages (
      scheduled_message_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      channel TEXT NOT NULL
    ) STRICT
  `;

  return ScheduledMessageStore.of({
    insert: makeFn("insert")(
      SqlSchema.void({
        Request: Schema.toEncoded(ScheduledMessage),
        execute: (message) => sql`INSERT INTO scheduled_messages ${sql.insert(message)}`,
      }),
    ),
    select: makeFn("select")(
      SqlSchema.findAll({
        Request: ScheduledMessage.fields.userId,
        Result: ScheduledMessage,
        execute: (userId) => sql`SELECT * FROM scheduled_messages WHERE user_id = ${userId}`,
      }),
    ),
    delete: makeFn("delete")(
      SqlSchema.void({
        Request: ScheduledMessage.fields.userId,
        execute: (userId) => sql`DELETE FROM scheduled_messages WHERE user_id = ${userId}`,
      }),
    ),
  });
});

export const layerSql = makeSql.pipe(
  Layer.effect(ScheduledMessageStore),
  Layer.provide(
    SqliteClient.layerConfig({
      filename: Function.pipe(
        Config.string("SLACKBOT_DB_PATH"),
        Config.withDefault("slackbot.db"),
      ),
      transformQueryNames: Config.succeed(String.camelToSnake),
      transformResultNames: Config.succeed(String.snakeToCamel),
    }),
  ),
);
