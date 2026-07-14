import channels from "./onboarding/channels.txt";
import communityGoals from "./onboarding/community-goals.txt";
import events from "./onboarding/events.txt";
import introductions from "./onboarding/introductions.txt";
import stopFailed from "./onboarding/stop-failed.txt";
import stopped from "./onboarding/stopped.txt";
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
    succeeded: stopped.trim(),
    failed: stopFailed.trim(),
  },
} as const;
