import type { Block, KnownBlock } from "@slack/types";

import { onboardingMessages } from "./lang.ts";

export const stopOnboardingActionId = "stop_onboarding";

export interface ScheduledMessage {
  channel: string;
  scheduled_message_id: string;
}

interface OnboardingClient {
  chat: {
    deleteScheduledMessage(message: ScheduledMessage): Promise<unknown>;
    postMessage(message: OnboardingMessage): Promise<unknown>;
    scheduleMessage(
      message: OnboardingMessage & { post_at: number },
    ): Promise<{ channel?: string; scheduled_message_id?: string }>;
  };
}

interface OnboardingMessage {
  channel: string;
  text: string;
  blocks: (Block | KnownBlock)[];
}

const dayMilliseconds = 24 * 60 * 60 * 1_000;

function message(channel: string, text: string): OnboardingMessage {
  return {
    channel,
    text,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            action_id: stopOnboardingActionId,
            text: { type: "plain_text", text: "stop onboarding" },
            value: "stop",
          },
        ],
      },
    ],
  };
}

export async function startOnboarding(
  client: OnboardingClient,
  userId: string,
  now = Date.now(),
  delayUnitMilliseconds = dayMilliseconds,
): Promise<ScheduledMessage[]> {
  const [welcome, ...followUps] = onboardingMessages;
  await client.chat.postMessage(message(userId, welcome.text));

  const scheduledMessages: ScheduledMessage[] = [];
  for (const followUp of followUps) {
    const scheduled = await client.chat.scheduleMessage({
      ...message(userId, followUp.text),
      post_at: Math.floor((now + followUp.day * delayUnitMilliseconds) / 1_000),
    });

    if (scheduled.channel && scheduled.scheduled_message_id) {
      scheduledMessages.push({
        channel: scheduled.channel,
        scheduled_message_id: scheduled.scheduled_message_id,
      });
    }
  }

  return scheduledMessages;
}

export async function stopOnboarding(
  client: OnboardingClient,
  scheduledMessages: ScheduledMessage[],
): Promise<void> {
  await Promise.allSettled(
    scheduledMessages.map((scheduledMessage) =>
      client.chat.deleteScheduledMessage(scheduledMessage),
    ),
  );
}
