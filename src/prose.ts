const welcome = `
Welcome to Indy Hackers! We're an Indiana tech community where people meet, learn, and build together.

Please read our <https://www.indyhackers.org/code-of-conduct|Code of Conduct>. Be constructive, respect each channel's topic, and avoid unsolicited DMs or promotion. If something feels wrong, privately email help@indyhackers.org or contact an Indy Hackers board member.

We'll send a few tips this week. Run \`/onboarding stop\` at any time to stop onboarding.
`.trim();

const introductions = `
Ready to say hello? Introduce yourself in #intros.

Here's an easy template:
- Name and pronouns
- What you build or want to learn
- Where you are in Indiana
- What you'd like help with
`.trim();

const channels = `
Find the conversations that fit you. #general is the community commons, and #random is for everything else.

By interest: #ai, #devops, #side-projects, #community-projects, #jobs, #career-advice, and #code_and_coffee.
`.trim();

const events = `
Meet people in person through the <https://www.indyhackers.org/events|live Indy Hackers event calendar>.

You'll find recurring Code & Coffee gatherings, language and platform meetups, AI/cloud/data/DevOps groups, workshops, and project events.
`.trim();

const communityGoals = `
One last check-in: what do you want from the community?

- Meet people → #intros
- Learn → #career-advice
- Build projects → #side-projects
- Career help → #jobs
- All set → no action needed

That's the end of onboarding. We're glad you're here!
`.trim();

export const prose = {
  onboarding: {
    usage: "Run `/onboarding start` to start your onboarding or `/onboarding stop` to stop it.",

    start: {
      failure:
        "We couldn't fully start onboarding. Some messages may still arrive. Run `/onboarding stop` before trying again.",
      noop: "Onboarding is already in progress. Run `/onboarding stop` before starting again.",
      success: "Onboarding started. Check your DMs for the first message.",
    },

    stop: {
      failure: "We couldn't fully stop onboarding. Some messages may still arrive. Please try again.",
      noop: "Onboarding is not in progress.",
      success: "Onboarding stopped. You won't receive any more scheduled messages.",
    },

    steps: [
      { offset: 0, text: welcome },
      { offset: 1, text: introductions },
      { offset: 3, text: channels },
      { offset: 5, text: events },
      { offset: 7, text: communityGoals },
    ],
  },
};
