FROM node:24.18.0-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

RUN mkdir /data && chown node:node /data
ENV SLACKBOT_DB_PATH=/data/slackbot.db

USER node

CMD ["node", "src/index.ts"]
