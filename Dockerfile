FROM oven/bun:1.3.14-slim

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src ./src

RUN mkdir /data && chown bun:bun /data
ENV SLACKBOT_DB_PATH=/data/slackbot.db

USER bun

CMD ["bun", "src/index.ts"]
