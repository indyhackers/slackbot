import channels from "./onboarding/channels.txt";
import communityGoals from "./onboarding/community-goals.txt";
import events from "./onboarding/events.txt";
import introductions from "./onboarding/introductions.txt";
import welcome from "./onboarding/welcome.txt";

export const onboarding = [
  { days: 0, text: welcome.trim() },
  { days: 1, text: introductions.trim() },
  { days: 3, text: channels.trim() },
  { days: 5, text: events.trim() },
  { days: 7, text: communityGoals.trim() },
] as const;
