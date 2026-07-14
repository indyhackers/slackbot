import { App, type AppOptions } from "@slack/bolt";
import { onboarding } from "./onboarding.ts";

export function createApp(options: AppOptions): App {
  const app = new App(options);
  const intervalMs = Number(process.env.ONBOARDING_INTERVAL_MS ?? 86_400_000);

  app.event("team_join", async ({ event, client }) => {
    if (event.user.is_bot) {
      return;
    }

    for (const { offset, text } of onboarding.steps) {
      if (offset === 0) {
        await client.chat.postMessage({
          channel: event.user.id,
          text,
        });
      } else {
        await client.chat.scheduleMessage({
          channel: event.user.id,
          text,
          post_at: Math.floor((Date.now() + offset * intervalMs) / 1_000),
        });
      }
    }
  });

  app.command("/onboarding", async ({ ack, command, client, logger, respond }) => {
    await ack();

    if (command.text.trim() !== "stop") {
      await respond({
        response_type: "ephemeral",
        text: onboarding.stop.usage,
      });
      return;
    }

    const conversation = await client.conversations
      .open({ users: command.user_id })
      .catch((error) => {
        logger.error("failed to open onboarding DM", error);
      });
    const channel = conversation?.channel?.id;
    if (!channel) {
      if (conversation) {
        logger.error("failed to open onboarding DM: Slack response is missing its channel ID");
      }
      await respond({
        response_type: "ephemeral",
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
      await respond({
        response_type: "ephemeral",
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

    await respond({
      response_type: "ephemeral",
      text: deletionResults.some((isDeleted) => !isDeleted)
        ? onboarding.stop.failure
        : onboarding.stop.success,
    });
  });

  return app;
}
