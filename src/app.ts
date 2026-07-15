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

    const action = command.text.trim();
    if (action !== "start" && action !== "stop") {
      await respond({
        response_type: "ephemeral",
        text: onboarding.usage,
      });
      return;
    }

    const run = action === "start" ? onboardingStart : onboardingStop;
    const unchanged = action === "start" ? onboarding.start.active : onboarding.stop.empty;
    const text = await run(args)
      .then((changed) => changed ? onboarding[action].success : unchanged)
      .catch((error: unknown) => {
        logger.error(`failed to ${action} onboarding`, error);
        return onboarding[action].failure;
      });

    await respond({
      response_type: "ephemeral",
      text,
    });
  });

  return app;
}

async function onboardingStart(args: AllMiddlewareArgs) {
  const { client } = args;
  const channel = await openOnboardingChannel(args);

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

async function onboardingStop(args: AllMiddlewareArgs) {
  const { client } = args;
  const channel = await openOnboardingChannel(args);

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

async function openOnboardingChannel({ client, context }: AllMiddlewareArgs) {
  if (!context.userId) {
    throw new Error("Slack context is missing the onboarding user ID");
  }

  const channel = (await client.conversations.open({ users: context.userId })).channel?.id;
  if (!channel) {
    throw new Error("Slack response is missing the onboarding DM channel ID");
  }

  return channel;
}
