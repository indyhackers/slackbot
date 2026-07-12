import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadConfig } from "../src/config.ts";

describe("loadConfig", () => {
  it("loads Slack credentials", () => {
    assert.deepEqual(
      loadConfig({
        SLACK_BOT_TOKEN: "xoxb-test",
        SLACK_APP_TOKEN: "xapp-test",
      }),
      {
        botToken: "xoxb-test",
        appToken: "xapp-test",
      },
    );
  });

  it("reports all missing credentials", () => {
    assert.throws(
      () => loadConfig({}),
      new Error(
        "Missing required environment variables: SLACK_BOT_TOKEN, SLACK_APP_TOKEN",
      ),
    );
  });
});
