import assert from "node:assert/strict";
import test from "node:test";

import { startOnboarding, stopOnboarding } from "./onboarding.ts";

test("posts the welcome and schedules four follow-ups", async () => {
  const posted: unknown[] = [];
  const scheduled: Array<{ post_at: number }> = [];
  const client = {
    chat: {
      async postMessage(input: unknown) {
        posted.push(input);
      },
      async scheduleMessage(input: { post_at: number }) {
        scheduled.push(input);
        return {
          channel: "U123",
          scheduled_message_id: `Q${scheduled.length}`,
        };
      },
      async deleteScheduledMessage() {},
    },
  };

  const result = await startOnboarding(client, "U123", 1_000_000, 60_000);

  assert.equal(posted.length, 1);
  assert.deepEqual(
    scheduled.map(({ post_at }) => post_at),
    [1_060, 1_180, 1_300, 1_420],
  );
  assert.deepEqual(result, [
    { channel: "U123", scheduled_message_id: "Q1" },
    { channel: "U123", scheduled_message_id: "Q2" },
    { channel: "U123", scheduled_message_id: "Q3" },
    { channel: "U123", scheduled_message_id: "Q4" },
  ]);
});

test("attempts to cancel every remaining scheduled message", async () => {
  const deleted: string[] = [];
  const client = {
    chat: {
      async postMessage() {},
      async scheduleMessage() {
        return {};
      },
      async deleteScheduledMessage(message: { scheduled_message_id: string }) {
        deleted.push(message.scheduled_message_id);
        if (message.scheduled_message_id === "past") {
          throw new Error("already sent");
        }
      },
    },
  };

  await stopOnboarding(client, [
    { channel: "U123", scheduled_message_id: "past" },
    { channel: "U123", scheduled_message_id: "future" },
  ]);

  assert.deepEqual(deleted, ["past", "future"]);
});
