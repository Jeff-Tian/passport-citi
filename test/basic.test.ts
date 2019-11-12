import assert = require("assert");
import Strategy from "../lib/";

describe("basic usages", () => {
  it("create instance", () => {
    const instance = new Strategy(
      {
        appId: "xxx",
        appSecret: "yyy",
        redirectUri: "zzz"
      },
      () => {}
    );

    assert.ok(instance);
  });
});
