export interface SlackConfig {
  readonly botToken: string;
  readonly appToken: string;
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
): SlackConfig {
  const botToken = env.SLACK_BOT_TOKEN;
  const appToken = env.SLACK_APP_TOKEN;

  const missing = [
    ["SLACK_BOT_TOKEN", botToken],
    ["SLACK_APP_TOKEN", appToken],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return { botToken: botToken!, appToken: appToken! };
}
