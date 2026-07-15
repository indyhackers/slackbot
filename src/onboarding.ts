import channels from "./onboarding/channels.txt";
import communityGoals from "./onboarding/community-goals.txt";
import events from "./onboarding/events.txt";
import introductions from "./onboarding/introductions.txt";
import stopEmpty from "./onboarding/stop-empty.txt";
import stopFailure from "./onboarding/stop-failure.txt";
import stopSuccess from "./onboarding/stop-success.txt";
import stopUsage from "./onboarding/stop-usage.txt";
import welcome from "./onboarding/welcome.txt";

export const onboarding = {
  steps: [
    { offset: 0, text: welcome.trim() },
    { offset: 1, text: introductions.trim() },
    { offset: 3, text: channels.trim() },
    { offset: 5, text: events.trim() },
    { offset: 7, text: communityGoals.trim() },
  ],
  stop: {
    usage: stopUsage.trim(),
    empty: stopEmpty.trim(),
    success: stopSuccess.trim(),
    failure: stopFailure.trim(),
  },
} as const;
