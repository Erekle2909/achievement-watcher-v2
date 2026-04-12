import { describe, it, expect, vi } from "vitest";
import { createEventBus } from "../event-bus.js";
import type { GameEntry } from "@achievement-watcher/shared";

const mockGame: GameEntry = {
  id: "goldberg:12345",
  appId: "12345",
  name: "Test Game",
  source: "steam-emu",
  installPath: "/fake/path/12345",
  playtime: 0,
};

describe("EventBus", () => {
  it("emits and receives events", () => {
    const bus = createEventBus();
    const listener = vi.fn();
    bus.on("game:discovered", listener);
    bus.emit("game:discovered", { game: mockGame });
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ game: mockGame });
  });

  it("supports multiple listeners for the same event", () => {
    const bus = createEventBus();
    const l1 = vi.fn();
    const l2 = vi.fn();
    bus.on("game:discovered", l1);
    bus.on("game:discovered", l2);
    bus.emit("game:discovered", { game: mockGame });
    expect(l1).toHaveBeenCalledOnce();
    expect(l2).toHaveBeenCalledOnce();
  });

  it("off removes a specific listener", () => {
    const bus = createEventBus();
    const l1 = vi.fn();
    const l2 = vi.fn();
    bus.on("game:discovered", l1);
    bus.on("game:discovered", l2);
    bus.off("game:discovered", l1);
    bus.emit("game:discovered", { game: mockGame });
    expect(l1).not.toHaveBeenCalled();
    expect(l2).toHaveBeenCalledOnce();
  });

  it("emit on event with no listeners does nothing", () => {
    const bus = createEventBus();
    expect(() => {
      bus.emit("game:discovered", { game: mockGame });
    }).not.toThrow();
  });

  it("emits scan:started with undefined", () => {
    const bus = createEventBus();
    const listener = vi.fn();
    bus.on("scan:started", listener);
    bus.emit("scan:started", undefined);
    expect(listener).toHaveBeenCalledWith(undefined);
  });

  it("emits scan:completed with gamesFound", () => {
    const bus = createEventBus();
    const listener = vi.fn();
    bus.on("scan:completed", listener);
    bus.emit("scan:completed", { gamesFound: 5 });
    expect(listener).toHaveBeenCalledWith({ gamesFound: 5 });
  });

  it("emits error events", () => {
    const bus = createEventBus();
    const listener = vi.fn();
    bus.on("error", listener);
    const errData = {
      source: "discovery",
      code: "PARSE_FAIL",
      severity: "warn" as const,
      message: "Failed to parse",
    };
    bus.emit("error", errData);
    expect(listener).toHaveBeenCalledWith(errData);
  });

  it("different event types are independent", () => {
    const bus = createEventBus();
    const discovered = vi.fn();
    const removed = vi.fn();
    bus.on("game:discovered", discovered);
    bus.on("game:removed", removed);
    bus.emit("game:discovered", { game: mockGame });
    expect(discovered).toHaveBeenCalledOnce();
    expect(removed).not.toHaveBeenCalled();
  });
});
