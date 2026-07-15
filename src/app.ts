import { type AllMiddlewareArgs, App, type AppOptions } from "@slack/bolt";
import { onboarding } from "./onboarding.ts";

export function createApp(options: AppOptions): App {
  const app = new App(options);

  app.event("team_join", async (args) => {
    if (args.event.user.is_bot) {
      return;
    }

    await onboardingStart(args);
  });

  app.command("/onboarding", async (args) => {
    const { ack, command, logger, respond } = args;
    await ack();

    switch (command.text.trim()) {
      case "start": {
        let started: boolean;

        try {
          started = await onboardingStart(args);
        } catch (error) {
          logger.error("failed to start onboarding", error);

          await respond({
            response_type: "ephemeral",
            text: onboarding.start.failure,
          });
          return;
        }

        await respond({
          response_type: "ephemeral",
          text: started ? onboarding.start.success : onboarding.start.noop,
        });
        return;
      }

      case "stop": {
        let hadScheduledMessages: boolean;

        try {
          hadScheduledMessages = await onboardingStop(args);
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
          text: hadScheduledMessages ? onboarding.stop.success : onboarding.stop.noop,
        });
        return;
      }

      default:
        await respond({
          response_type: "ephemeral",
          text: onboarding.usage,
        });
    }
  });

  return app;
}

async function onboardingStart({ client, context }: AllMiddlewareArgs) {
  if (!context.userId) {
    throw new Error("Slack context is missing the onboarding user ID");
  }

  const channel = (await client.conversations.open({ users: context.userId })).channel?.id;
  if (!channel) {
    throw new Error("Slack response is missing the onboarding DM channel ID");
  }

  const { scheduled_messages: scheduledMessages = [] } = await client.chat.scheduledMessages.list({
    channel,
    limit: 1,
  });
  if (scheduledMessages.length > 0) {
    return false;
  }

  const intervalMs = Number(process.env.ONBOARDING_INTERVAL_MS ?? 86_400_000);

  for (const { offset, text } of onboarding.steps) {
    if (offset === 0) {
      await client.chat.postMessage({
        channel,
        text,
      });
    } else {
      await client.chat.scheduleMessage({
        channel,
        text,
        post_at: Math.floor((Date.now() + offset * intervalMs) / 1_000),
      });
    }
  }

  return true;
}

async function onboardingStop({ client, context }: AllMiddlewareArgs) {
  if (!context.userId) {
    throw new Error("Slack context is missing the onboarding user ID");
  }

  const channel = (await client.conversations.open({ users: context.userId })).channel?.id;
  if (!channel) {
    throw new Error("Slack response is missing the onboarding DM channel ID");
  }

  const { scheduled_messages: scheduledMessages = [] } = await client.chat.scheduledMessages.list({
    channel,
    limit: onboarding.steps.length,
  });
  if (scheduledMessages.length === 0) {
    return false;
  }

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

  return true;
}
