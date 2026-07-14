import { App, type AppOptions } from "@slack/bolt";
import type { KnownBlock } from "@slack/types";
import { onboarding } from "./onboarding.ts";

export function createApp(options: AppOptions): App {
  const app = new App(options);
  const intervalMs = Number(process.env.ONBOARDING_INTERVAL_MS ?? 86_400_000);

  app.event("team_join", async ({ event, client }) => {
    if (event.user.is_bot) {
      return;
    }

    for (const { offset, text } of onboarding.steps) {
      const blocks: KnownBlock[] = [
        {
          type: "section",
          text: { type: "mrkdwn", text },
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

      if (offset === 0) {
        await client.chat.postMessage({
          channel: event.user.id,
          text,
          blocks,
        });
        continue;
      }

      await client.chat.scheduleMessage({
        channel: event.user.id,
        text,
        blocks,
        post_at: Math.floor((Date.now() + offset * intervalMs) / 1_000),
      });
    }
  });

  app.action("stop_onboarding", async ({ ack, body, client, logger }) => {
    await ack();

    const channel = body.channel?.id;
    if (!channel) {
      logger.error("failed to stop onboarding: action is missing its channel");
      await client.chat.postMessage({
        channel: body.user.id,
        text: onboarding.stop.failure,
      });
      return;
    }

    const page = await client.chat.scheduledMessages
      .list({ channel, limit: onboarding.steps.length })
      .catch((error) => {
        logger.error("failed to list scheduled onboarding messages", error);
      });
    if (!page) {
      await client.chat.postMessage({
        channel,
        text: onboarding.stop.failure,
      });
      return;
    }

    const deletionResults = await Promise.all(
      (page.scheduled_messages ?? []).map(({ id }) => {
        if (!id) {
          logger.error("failed to delete scheduled onboarding message: Slack response is missing its ID");
          return false;
        }

        return client.chat
          .deleteScheduledMessage({ channel, scheduled_message_id: id })
          .then(() => true)
          .catch((error) => {
            logger.error(`failed to delete scheduled message ${id}`, error);
            return false;
          });
      }),
    );

    await client.chat.postMessage({
      channel,
      text: deletionResults.some((isDeleted) => !isDeleted)
        ? onboarding.stop.failure
        : onboarding.stop.success,
    });
  });

  return app;
}
