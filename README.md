# Indy Hackers Slack bot

minimal [Bolt for JavaScript](https://docs.slack.dev/tools/bolt-js/) application for the Indy Hackers Slack workspace. it runs on Bun and connects to Slack through Socket Mode.

## Slack app setup

1. go to [Your Apps](https://api.slack.com/apps), select **Create New App**, then **From an app manifest**.
2. select the development workspace and paste the contents of [`manifest.yaml`](./manifest.yaml).
3. create the app, then select **Install to Workspace** under **OAuth & Permissions**.
4. copy the **Bot User OAuth Token** (`xoxb-...`).
5. under **Basic Information**, create an app-level token named `socket-mode` with the `connections:write` scope, then copy the token (`xapp-...`).

## local setup

Bun 1.3.14 is required.

```sh
bun install
cp .env.example .env
```

set `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` in `.env`, then start the bot:

```sh
bun run dev
```

set `ONBOARDING_INTERVAL_MS=60000` to test the 1, 3, 5, and 7 offsets at minute-scale intervals. when unset, the interval is 86,400,000 ms (one day).

the process logs `Indy Hackers Slack bot connected` after opening its Socket Mode connection. stop it with `Ctrl+C`.

## current limitations

currently, every message this app schedules in a user DM is treated as an onboarding message. `/onboarding start` won't create an overlapping run when the caller's app DM already has pending messages scheduled by the app, and `/onboarding stop` deletes all of them. don't use the same Slack bot token to schedule other user DM messages until they can be distinguished.

## contributing

use sentence case for all copy in `src/onboarding/*.txt`.

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
bun start            # start once
bun run dev          # start and restart when files change
bun run format       # format supported files with dprint
bun run check-format # check dprint formatting without changing files
bun run check-types  # run TypeScript checks without emitting files
bun run test         # run the Bun test runner
```
