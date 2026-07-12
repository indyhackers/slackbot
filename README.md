# Indy Hackers Slack bot

minimal [Bolt for JavaScript](https://docs.slack.dev/tools/bolt-js/) application for the Indy Hackers Slack workspace. it runs on Node.js 24 using native TypeScript type stripping and connects to Slack through Socket Mode.

## Slack app setup

1. go to [Your Apps](https://api.slack.com/apps), select **Create New App**, then **From an app manifest**.
2. select the development workspace and paste the contents of [`manifest.yaml`](./manifest.yaml).
3. create the app, then select **Install to Workspace** under **OAuth & Permissions**.
4. copy the **Bot User OAuth Token** (`xoxb-...`).
5. under **Basic Information**, create an app-level token named `socket-mode` with the `connections:write` scope, then copy the token (`xapp-...`).

## local setup

Node.js 24.18.0 and npm 11.16.0 are required.

```sh
npm install
cp .env.example .env
```

set `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` in `.env`, then start the bot:

```sh
npm run dev
```

set `ONBOARDING_DELAY_UNIT_MS=60000` to test the day 1, 3, 5, and 7 follow-ups at minute-scale delays. when unset, each delay unit is one day.

the process logs `Indy Hackers Slack bot connected` after opening its Socket Mode connection. stop it with `Ctrl+C`.

## container

build the production image:

```sh
docker build --tag indyhackers-slackbot .
```

run it with Slack credentials supplied through environment variables:

```sh
docker run --rm \
  --env SLACK_BOT_TOKEN \
  --env SLACK_APP_TOKEN \
  indyhackers-slackbot
```

the container runs as a non-root user and stops the Bolt app gracefully when it receives `SIGTERM` or `SIGINT`.

## commands

```sh
npm start            # start once
npm run dev          # start and restart when files change
npm run check-types  # run TypeScript checks without emitting files
npm test             # run the Node.js test runner
```
