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

    switch (command.text.trim()) {
      case "stop": {
        try {
          const channel = (
            await client.conversations.open({ users: command.user_id })
          ).channel?.id;
          if (!channel) {
            throw new Error("Slack response is missing the onboarding DM channel ID");
          }

          const { scheduled_messages: scheduledMessages = [] } = await client.chat.scheduledMessages.list({
            channel,
            limit: onboarding.steps.length,
          });

          await Promise.all(
            scheduledMessages.map(async ({ id }) => {
              if (!id) {
                throw new Error("Slack response is missing a scheduled onboarding message ID");
              }

              await client.chat.deleteScheduledMessage({
                channel,
                scheduled_message_id: id,
              });
            }),
          );
        } catch (error) {
          logger.error("failed to stop onboarding", error);

          await respond({
            response_type: "ephemeral",
            text: onboarding.stop.failure,
          });
          return;
        }

        await respond({
          response_type: "ephemeral",
          text: onboarding.stop.success,
        });
        return;
      }

      default:
        await respond({
          response_type: "ephemeral",
          text: onboarding.stop.usage,
        });
    }
  });

  return app;
}
