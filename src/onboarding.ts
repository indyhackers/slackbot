import type { App, RespondArguments } from "@slack/bolt";
import { prose } from "./prose.ts";

export function registerOnboarding(app: App, intervalMs: number) {
  app.event("team_join", async ({ event }) => {
    if (!event.user.is_bot) {
      await start(event.user.id);
    }
  });

  app.command("/onboarding", async ({ ack, command, logger, respond }) => {
    await ack();

    const action = command.text.trim();
    if (action !== "start" && action !== "stop") {
      await respond({
        response_type: "ephemeral",
        text: prose.onboarding.usage,
      });
      return;
    }

    let responseType: RespondArguments["response_type"] = "ephemeral";
    let text = prose.onboarding[action].failure;

    try {
      const result = action === "start" ? await start(command.user_id) : await stop(command.user_id);
      responseType = result.channel === command.channel_id ? "in_channel" : "ephemeral";

      if (action === "start" && result.changed && responseType === "in_channel") {
        return;
      }

      text = prose.onboarding[action][result.changed ? "success" : "noop"];
    } catch (error) {
      logger.error(`failed onboarding ${action}`, error);
    }

    await respond({
      response_type: responseType,
      text,
    });
  });

  async function openConversation(userId: string) {
    const conversation = await app.client.conversations.open({ users: userId });
    const channel = conversation.channel?.id;

    if (!channel) {
      throw new Error("Slack response is missing the onboarding DM channel ID");
    }

    return channel;
  }

  async function start(userId: string) {
    const channel = await openConversation(userId);
    const { scheduled_messages: scheduledMessages = [] } = await app.client.chat.scheduledMessages.list({
      channel,
      limit: 1,
    });

    if (scheduledMessages.length) {
      return { channel, changed: false };
    }

    for (const { offset, text } of prose.onboarding.steps) {
      if (offset === 0) {
        await app.client.chat.postMessage({
          channel,
          link_names: true,
          text,
        });
      } else {
        await app.client.chat.scheduleMessage({
          channel,
          link_names: true,
          text,
          post_at: Math.floor((Date.now() + offset * intervalMs) / 1_000),
        });
      }
    }

    return { channel, changed: true };
  }

  async function stop(userId: string) {
    const channel = await openConversation(userId);
    const { scheduled_messages: scheduledMessages = [] } = await app.client.chat.scheduledMessages.list({
      channel,
      limit: prose.onboarding.steps.length,
    });

    if (!scheduledMessages.length) {
      return { channel, changed: false };
    }

    await Promise.all(
      scheduledMessages.map(({ id }) => {
        if (!id) {
          throw new Error("Slack response is missing a scheduled onboarding message ID");
        }

        return app.client.chat.deleteScheduledMessage({
          channel,
          scheduled_message_id: id,
        });
      }),
    );

    return { channel, changed: true };
  }
}
