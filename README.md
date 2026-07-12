# Indy Hackers Slack bot

Minimal [Bolt for JavaScript](https://docs.slack.dev/tools/bolt-js/) application for the Indy Hackers Slack workspace. It runs on Node.js 24 using native TypeScript type stripping and connects to Slack through Socket Mode.

## Slack app setup

1. Go to [Your Apps](https://api.slack.com/apps), select **Create New App**, then **From an app manifest**.
2. Select the development workspace and paste the contents of [`manifest.yaml`](./manifest.yaml).
3. Create the app, then select **Install to Workspace** under **OAuth & Permissions**.
4. Copy the **Bot User OAuth Token** (`xoxb-...`).
5. Under **Basic Information**, create an app-level token named `socket-mode` with the `connections:write` scope, then copy the token (`xapp-...`).

## Local setup

Node.js 24.18.0 and npm 11.16.0 are required.

```sh
npm install
cp .env.example .env
```

Set `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` in `.env`, then start the bot:

```sh
npm run dev
```

The process logs `Indy Hackers Slack bot connected` after opening its Socket Mode connection. Stop it with `Ctrl+C`.

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

## Commands

```sh
npm start            # start once
npm run dev          # start and restart when files change
npm run check-types  # run TypeScript checks without emitting files
npm test             # run the Node.js test runner
```
