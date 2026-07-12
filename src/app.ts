import { App, type AppOptions } from "@slack/bolt";
import { onboardingStoppedMessage } from "./lang.ts";
import {
  startOnboarding,
  stopOnboarding,
  stopOnboardingActionId,
  type ScheduledMessage,
} from "./onboarding.ts";

export function createApp(options: AppOptions): App {
  const app = new App(options);
  const scheduledMessagesByUser = new Map<string, ScheduledMessage[]>();
  const delayUnitMilliseconds = Number(
    process.env.ONBOARDING_DELAY_UNIT_MS ?? 24 * 60 * 60 * 1_000,
  );

  app.event("team_join", async ({ event, client }) => {
    if (!event.user.is_bot) {
      scheduledMessagesByUser.set(
        event.user.id,
        await startOnboarding(client, event.user.id, Date.now(), delayUnitMilliseconds),
      );
    }
  });

  app.action(stopOnboardingActionId, async ({ ack, body, client }) => {
    await ack();

    const userId = body.user.id;
    await stopOnboarding(client, scheduledMessagesByUser.get(userId) ?? []);
    scheduledMessagesByUser.delete(userId);
    await client.chat.postMessage({
      channel: userId,
      text: onboardingStoppedMessage,
    });
  });

  return app;
}
