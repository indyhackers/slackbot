export const connectedMessage = "Indy Hackers Slack bot connected";
export const stoppingMessage = "received %s; stopping Indy Hackers Slack bot";
export const stopFailedMessage = "failed to stop Indy Hackers Slack bot";
export const onboardingStoppedMessage = "your Indy Hackers onboarding has stopped. you're all set!";

const channel = (name: string): string =>
  `<https://slack.com/app_redirect?channel=${name}|#${name}>`;

export const onboardingMessages = [
  {
    day: 0,
    text: `welcome to Indy Hackers! we're an Indiana tech community where people meet, learn, and build together.

please read our <https://www.indyhackers.org/code-of-conduct|Code of Conduct>. be constructive, respect each channel's topic, and avoid unsolicited DMs or promotion. if something feels wrong, privately email help@indyhackers.org or contact an Indy Hackers board member.

we'll send a few tips this week. use the button below at any time to stop onboarding.`,
  },
  {
    day: 1,
    text: `ready to say hello? introduce yourself in ${channel("intros")}.

here's an easy template:
• name and pronouns
• what you build or want to learn
• where you are in Indiana
• what you'd like help with`,
  },
  {
    day: 3,
    text: `find the conversations that fit you. ${channel("general")} is the community commons, and ${channel("random")} is for everything else.

by interest: ${channel("ai")}, ${channel("devops")}, ${channel("side-projects")}, ${channel("community-projects")}, ${channel("jobs")}, ${channel("career-advice")}, and ${channel("code_and_coffee")}.`,
  },
  {
    day: 5,
    text: `meet people in person through the <https://www.indyhackers.org/events|live Indy Hackers event calendar>.

you'll find recurring Code & Coffee gatherings, language and platform meetups, AI/cloud/data/DevOps groups, workshops, and project events.`,
  },
  {
    day: 7,
    text: `one last check-in: what do you want from the community?

• meet people → ${channel("intros")}
• learn → ${channel("career-advice")}
• build projects → ${channel("side-projects")}
• career help → ${channel("jobs")}
• all set → no action needed

that's the end of onboarding. we're glad you're here!`,
  },
] as const;
