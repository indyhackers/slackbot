import { type AllMiddlewareArgs, App, type AppOptions, type webApi } from "@slack/bolt";
import { onboarding } from "./onboarding.ts";

type ScheduledMessages = NonNullable<webApi.ChatScheduledMessagesListResponse["scheduled_messages"]>;

export function createApp(options: AppOptions): App {
  const app = new App(options);

  app.event("team_join", async (args) => {
    if (args.event.user.is_bot) {
      return;
    }

    await onboardingAction("start", args);
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

    const { failure, noop, success } = onboarding[action];
    const text = await onboardingAction(action, args)
      .then((changed) => changed ? success : noop)
      .catch((error: unknown) => {
        logger.error(`failed to ${action} onboarding`, error);
        return failure;
      });

    await respond({
      response_type: "ephemeral",
      text,
    });
  });

  return app;
}

async function onboardingAction(action: "start" | "stop", args: AllMiddlewareArgs) {
  const { client, context } = args;
  if (!context.userId) {
    throw new Error("Slack context is missing the onboarding user ID");
  }

  const channel = (await client.conversations.open({ users: context.userId })).channel?.id;
  if (!channel) {
    throw new Error("Slack response is missing the onboarding DM channel ID");
  }

  const { scheduled_messages: scheduledMessages = [] } = await client.chat.scheduledMessages.list({
    channel,
    limit: action === "start" ? 1 : onboarding.steps.length,
  });

  if (action === "start") {
    if (scheduledMessages.length > 0) {
      return false;
    }

    await onboardingStart(args, channel);
  } else {
    if (scheduledMessages.length === 0) {
      return false;
    }

    await onboardingStop(args, channel, scheduledMessages);
  }

  return true;
}

async function onboardingStart({ client }: AllMiddlewareArgs, channel: string) {
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
}

async function onboardingStop(
  { client }: AllMiddlewareArgs,
  channel: string,
  scheduledMessages: ScheduledMessages,
) {
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
}
