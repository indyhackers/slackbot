import channels from "./onboarding/steps/channels.txt";
import communityGoals from "./onboarding/steps/community-goals.txt";
import events from "./onboarding/steps/events.txt";
import introductions from "./onboarding/steps/introductions.txt";
import welcome from "./onboarding/steps/welcome.txt";

import startActive from "./onboarding/responses/start-active.txt";
import startFailure from "./onboarding/responses/start-failure.txt";
import startSuccess from "./onboarding/responses/start-success.txt";
import stopEmpty from "./onboarding/responses/stop-empty.txt";
import stopFailure from "./onboarding/responses/stop-failure.txt";
import stopSuccess from "./onboarding/responses/stop-success.txt";
import usage from "./onboarding/responses/usage.txt";

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
    noop: startActive.trim(),
    success: startSuccess.trim(),
    failure: startFailure.trim(),
  },
  stop: {
    noop: stopEmpty.trim(),
    success: stopSuccess.trim(),
    failure: stopFailure.trim(),
  },
} as const;
