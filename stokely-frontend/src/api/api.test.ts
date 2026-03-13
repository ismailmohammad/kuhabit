import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("api request wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.cookie = "stokely-csrf=test-csrf-token; path=/";
  });

  it("attaches CSRF header on mutating requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "",
    } as Response);

    await api.auth.logout();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect(options?.credentials).toBe("include");
    expect((options?.headers as Record<string, string>)["X-CSRF-Token"]).toBe("test-csrf-token");
  });

  it("does not attach CSRF header on GET requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: "u1", username: "demo", e2eeEnabled: false }),
    } as Response);

    await api.auth.me();

    const [, options] = fetchMock.mock.calls[0];
    expect((options?.headers as Record<string, string>)["X-CSRF-Token"]).toBeUndefined();
  });

  it("surfaces backend error messages", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      statusText: "Bad Request",
      json: async () => ({ error: "Invalid username or password" }),
    } as Response);

    await expect(api.auth.login("bad", "bad")).rejects.toThrow("Invalid username or password");
  });
});

