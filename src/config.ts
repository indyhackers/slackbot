const make = (env: Record<string, string | undefined> = process.env) => {
  const required = (name: string) => {
    const value = env[name]?.trim();

    if (!value) {
      throw new Error(`missing required environment variable: ${name}`);
    }

    return value;
  };

  const ONBOARDING_INTERVAL_MS = Number(env.ONBOARDING_INTERVAL_MS ?? 86_400_000);

  if (!Number.isSafeInteger(ONBOARDING_INTERVAL_MS) || ONBOARDING_INTERVAL_MS <= 0) {
    throw new Error("ONBOARDING_INTERVAL_MS must be a positive integer");
  }

  return {
    SLACK_BOT_TOKEN: required("SLACK_BOT_TOKEN"),
    SLACK_APP_TOKEN: required("SLACK_APP_TOKEN"),
    ONBOARDING_INTERVAL_MS,
  } as const;
};

export const Config = { make };
export type Config = ReturnType<typeof make>;
