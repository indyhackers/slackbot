import { type AllMiddlewareArgs, App, type AppOptions } from "@slack/bolt";
import { copy, steps } from "./onboarding.ts";

export function createApp(options: AppOptions): App {
  const app = new App(options);

  app.event("team_join", async (args) => {
    if (args.event.user.is_bot) {
      return;
    }

    const conversation = await openConversation(args);
    await conversation.onboarding("start");
  });

  app.command("/onboarding", async (args) => {
    const { ack, command, logger, respond } = args;
    await ack();

    const action = command.text.trim();
    if (action !== "start" && action !== "stop") {
      await respond({
        response_type: "ephemeral",
        text: copy.usage,
      });
      return;
    }

    let responseType: "in_channel" | "ephemeral" = "ephemeral";
    const text = await openConversation(args)
      .then((conversation) => {
        responseType = conversation.channel === command.channel_id ? "in_channel" : "ephemeral";
        return conversation.onboarding(action);
      })
      .then((changed) => copy[action][changed ? "success" : "noop"])
      .catch((error) => {
        logger.error(`failed onboarding ${action}`, error);
        return copy[action].failure;
      });

    await respond({
      response_type: responseType,
      text,
    });
  });

  return app;
}

async function openConversation({ client, context }: AllMiddlewareArgs) {
  if (!context.userId) {
    throw new Error("Slack context is missing the onboarding user ID");
  }

  const conversation = await client.conversations.open({ users: context.userId });
  if (!conversation.channel?.id) {
    throw new Error("Slack response is missing the onboarding DM channel ID");
  }
  const { id: channel } = conversation.channel;

  async function onboardingStart() {
    const { scheduled_messages: scheduledMessages } = await client.chat.scheduledMessages.list({
      channel,
      limit: 1,
    });
    if (scheduledMessages?.length) {
      return false;
    }

    const intervalMs = Number(process.env.ONBOARDING_INTERVAL_MS ?? 86_400_000);

    for (const { offset, text } of steps) {
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

  async function onboardingStop() {
    const { scheduled_messages: scheduledMessages } = await client.chat.scheduledMessages.list({
      channel,
      limit: steps.length,
    });
    if (!scheduledMessages?.length) {
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

  function onboarding(action: "start" | "stop") {
    return action === "start" ? onboardingStart() : onboardingStop();
  }

  return { channel, onboarding };
}
