import { beforeEach, describe, expect, it } from "vitest";
import { _resetDedupe, deliverOnce, payloadKey } from "./send-dedupe.server";
import { buildPrompt, getScene, isValidName } from "./kiosk";

describe("email delivery dedupe", () => {
  beforeEach(() => _resetDedupe());

  it("concurrent duplicates share one delivery and its success", async () => {
    let calls = 0;
    let release!: (v: boolean) => void;
    const send = () => { calls++; return new Promise<boolean>((r) => (release = r)); };
    const a = deliverOnce("k", send);
    const b = deliverOnce("k", send);
    release(true);
    expect(await Promise.all([a, b])).toEqual([true, true]);
    expect(calls).toBe(1);
  });

  it("concurrent duplicates share failure; a later retry sends again", async () => {
    let calls = 0;
    let release!: (v: boolean) => void;
    const send = () => { calls++; return new Promise<boolean>((r) => (release = r)); };
    const a = deliverOnce("k", send);
    const b = deliverOnce("k", send);
    release(false);
    expect(await Promise.all([a, b])).toEqual([false, false]);
    expect(await deliverOnce("k", async () => { calls++; return true; })).toBe(true);
    expect(calls).toBe(2);
  });

  it("a confirmed success is not re-sent", async () => {
    let calls = 0;
    await deliverOnce("k", async () => { calls++; return true; });
    await deliverOnce("k", async () => { calls++; return true; });
    expect(calls).toBe(1);
  });

  it("keys cover the whole payload and support long emails", async () => {
    const long = "a".repeat(200) + "@example.com";
    const k1 = await payloadKey(long, "Ann", "/9j/AAA");
    expect(k1).toMatch(/^rwm-[0-9a-f]{64}$/);
    expect(await payloadKey(long, "Ann", "/9j/AAB")).not.toBe(k1);
    expect(await payloadKey(long, "Bob", "/9j/AAA")).not.toBe(k1);
  });
});

describe("name rule (contactVersion 1)", () => {
  it("requires 2–120 trimmed characters", () => {
    expect(isValidName("")).toBe(false);
    expect(isValidName(" A ")).toBe(false);
    expect(isValidName("Al")).toBe(true);
    expect(isValidName("x".repeat(120))).toBe(true);
    expect(isValidName("x".repeat(121))).toBe(false);
  });
});

describe("foreground-only prompt", () => {
  it("excludes background bystanders", () => {
    expect(buildPrompt(getScene("black-irish")!, ["tuxedo"])).toContain("exclude any background bystanders");
  });
});
