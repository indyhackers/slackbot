import channels from "./onboarding/channels.txt";
import communityGoals from "./onboarding/community-goals.txt";
import events from "./onboarding/events.txt";
import introductions from "./onboarding/introductions.txt";
import startActive from "./onboarding/start-active.txt";
import startFailure from "./onboarding/start-failure.txt";
import startSuccess from "./onboarding/start-success.txt";
import stopEmpty from "./onboarding/stop-empty.txt";
import stopFailure from "./onboarding/stop-failure.txt";
import stopSuccess from "./onboarding/stop-success.txt";
import usage from "./onboarding/usage.txt";
import welcome from "./onboarding/welcome.txt";

export const onboarding = {
  steps: [
    { offset: 0, text: welcome.trim() },
    { offset: 1, text: introductions.trim() },
    { offset: 3, text: channels.trim() },
    { offset: 5, text: events.trim() },
    { offset: 7, text: communityGoals.trim() },
  ],
  usage: usage.trim(),
  start: {
    active: startActive.trim(),
    success: startSuccess.trim(),
    failure: startFailure.trim(),
  },
  stop: {
    empty: stopEmpty.trim(),
    success: stopSuccess.trim(),
    failure: stopFailure.trim(),
  },
} as const;
