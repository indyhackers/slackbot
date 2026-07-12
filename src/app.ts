import { App, type AppOptions } from "@slack/bolt";
import type { KnownBlock } from "@slack/types";
import { onboardingMessages, onboardingStoppedMessage } from "./lang.ts";

export function createApp(options: AppOptions): App {
  const app = new App(options);
  const scheduledMessagesByUser = new Map<
    string,
    { channel: string; scheduled_message_id: string }[]
  >();
  const day = Number(process.env.ONBOARDING_DELAY_UNIT_MS ?? 86_400_000);

  app.event("team_join", async ({ event, client }) => {
    if (event.user.is_bot) {
      return;
    }

    const scheduledMessages = [];
    for (const message of onboardingMessages) {
      const blocks: KnownBlock[] = [
        {
          type: "section",
          text: { type: "mrkdwn", text: message.text },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              action_id: "stop_onboarding",
              text: { type: "plain_text", text: "stop onboarding" },
            },
          ],
        },
      ];

      if (message.day === 0) {
        await client.chat.postMessage({
          channel: event.user.id,
          text: message.text,
          blocks,
        });
        continue;
      }

      const scheduled = await client.chat.scheduleMessage({
        channel: event.user.id,
        text: message.text,
        blocks,
        post_at: Math.floor((Date.now() + message.day * day) / 1_000),
      });
      if (scheduled.channel && scheduled.scheduled_message_id) {
        scheduledMessages.push({
          channel: scheduled.channel,
          scheduled_message_id: scheduled.scheduled_message_id,
        });
      }
    }
    scheduledMessagesByUser.set(event.user.id, scheduledMessages);
  });

  app.action("stop_onboarding", async ({ ack, body, client }) => {
    await ack();

    const userId = body.user.id;
    await Promise.allSettled(
      (scheduledMessagesByUser.get(userId) ?? []).map((message) =>
        client.chat.deleteScheduledMessage(message),
      ),
    );
    scheduledMessagesByUser.delete(userId);
    await client.chat.postMessage({
      channel: userId,
      text: onboardingStoppedMessage,
    });
  });

  return app;
}
