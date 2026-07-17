import { App } from "@slack/bolt";
import type { AllMiddlewareArgs, AppOptions, RespondArguments } from "@slack/bolt";
import messages from "./messages.toml";

export function createApp(options: AppOptions): App {
  const app = new App(options);

  app.event("team_join", async (args) => {
    if (!args.event.user.is_bot) {
      const conversation = await openConversation(args);
      await conversation.onboarding("start");
    }
  });

  app.command("/onboarding", async (args) => {
    const { ack, command, logger, respond } = args;
    await ack();

    const action = command.text.trim();
    switch (action) {
      case "start":
      case "stop": {
        let responseType: RespondArguments["response_type"] = "ephemeral";
        let text = messages.onboarding[action].failure;
        try {
          const conversation = await openConversation(args);
          responseType = conversation.matches(command.channel_id) ? "in_channel" : "ephemeral";
          const changed = await conversation.onboarding(action);
          if (action === "start" && changed && responseType === "in_channel") {
            return;
          }
          text = messages.onboarding[action][changed ? "success" : "noop"];
        } catch (error) {
          logger.error(`failed onboarding ${action}`, error);
        }

        await respond({
          response_type: responseType,
          text,
        });
        return;
      }

      default:
        await respond({
          response_type: "ephemeral",
          text: messages.onboarding.usage,
        });
        return;
    }
  });

  return app;
}

async function openConversation({ client, context }: AllMiddlewareArgs) {
  if (!context.userId) {
    throw new Error("Slack context is missing the onboarding user ID");
  }

  const conversation = await client.conversations.open({ users: context.userId });
  const channel = conversation.channel?.id;
  if (!channel) {
    throw new Error("Slack response is missing the onboarding DM channel ID");
  }

  const onboardingStart = async () => {
    const { scheduled_messages: scheduledMessages } = await client.chat.scheduledMessages.list({
      channel,
      limit: 1,
    });
    if (scheduledMessages?.length) {
      return false;
    }

    const intervalMs = Number(process.env.ONBOARDING_INTERVAL_MS ?? 86_400_000);

    for (const { offset, text } of messages.onboarding.steps) {
      if (offset === 0) {
        await client.chat.postMessage({
          channel,
          link_names: true,
          text,
        });
      } else {
        await client.chat.scheduleMessage({
          channel,
          link_names: true,
          text,
          post_at: Math.floor((Date.now() + offset * intervalMs) / 1_000),
        });
      }
    }

    return true;
  };

  const onboardingStop = async () => {
    const { scheduled_messages: scheduledMessages } = await client.chat.scheduledMessages.list({
      channel,
      limit: messages.onboarding.steps.length,
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
  };

  return {
    matches: (channelId: string) => channel === channelId,
    onboarding: (action: "start" | "stop") => action === "start" ? onboardingStart() : onboardingStop(),
  };
}
