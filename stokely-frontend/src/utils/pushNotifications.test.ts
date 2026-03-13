import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncPushSubscriptionOnDevice } from "./pushNotifications";

const getVapidKeyMock = vi.fn();
const subscribeApiMock = vi.fn();
const unsubscribeApiMock = vi.fn();

vi.mock("../api/api", () => ({
  api: {
    push: {
      getVapidKey: (...args: unknown[]) => getVapidKeyMock(...args),
      subscribe: (...args: unknown[]) => subscribeApiMock(...args),
      unsubscribe: (...args: unknown[]) => unsubscribeApiMock(...args),
    },
  },
}));

function setNotification(permission: NotificationPermission, requestResult: NotificationPermission = permission) {
  const requestPermission = vi.fn().mockResolvedValue(requestResult);
  const notificationStub = { permission, requestPermission };
  Object.defineProperty(window, "Notification", {
    value: notificationStub,
    configurable: true,
    writable: true,
  });
  return requestPermission;
}

function setNavigatorUA(ua: string, platform = "Linux x86_64", maxTouchPoints = 0) {
  Object.defineProperty(navigator, "userAgent", { value: ua, configurable: true });
  Object.defineProperty(navigator, "platform", { value: platform, configurable: true });
  Object.defineProperty(navigator, "maxTouchPoints", { value: maxTouchPoints, configurable: true });
}

function setStandalone(matches: boolean, standalone?: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches,
      media: "(display-mode: standalone)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
  Object.defineProperty(navigator, "standalone", { value: standalone, configurable: true });
}

describe("syncPushSubscriptionOnDevice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setNavigatorUA("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Win32", 0);
    setStandalone(false, false);
    setNotification("granted");
  });

  it("returns false when notification permission is denied", async () => {
    setNotification("denied");
    const register = vi.fn();
    Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true });

    const ok = await syncPushSubscriptionOnDevice({ requestPermission: true });
    expect(ok).toBe(false);
    expect(register).not.toHaveBeenCalled();
  });

  it("returns false on iOS when not installed as standalone", async () => {
    setNavigatorUA("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)", "iPhone", 1);
    setStandalone(false, false);
    const register = vi.fn();
    Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true });

    const ok = await syncPushSubscriptionOnDevice({ requestPermission: true });
    expect(ok).toBe(false);
    expect(register).not.toHaveBeenCalled();
  });

  it("subscribes device and sends endpoint to backend", async () => {
    const subscription = {
      endpoint: "https://push.example/sub-1",
      toJSON: () => ({ keys: { p256dh: "p256", auth: "auth" } }),
    } as unknown as PushSubscription;

    const reg = {
      update: vi.fn().mockResolvedValue(undefined),
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue(subscription),
      },
    };

    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: vi.fn().mockResolvedValue(reg) },
      configurable: true,
    });
    getVapidKeyMock.mockResolvedValueOnce({ publicKey: "AQAB" });
    subscribeApiMock.mockResolvedValueOnce(undefined);

    const ok = await syncPushSubscriptionOnDevice({ requestPermission: true });
    expect(ok).toBe(true);
    expect(getVapidKeyMock).toHaveBeenCalled();
    expect(subscribeApiMock).toHaveBeenCalledWith({
      endpoint: "https://push.example/sub-1",
      p256dh: "p256",
      auth: "auth",
      deviceLabel: "Windows PC",
    });
  });

  it("forceRefresh unsubscribes stale endpoint before re-subscribing", async () => {
    const stale = {
      endpoint: "https://push.example/old",
      unsubscribe: vi.fn().mockResolvedValue(true),
    } as unknown as PushSubscription;
    const fresh = {
      endpoint: "https://push.example/new",
      toJSON: () => ({ keys: { p256dh: "new-p", auth: "new-a" } }),
    } as unknown as PushSubscription;

    const getSubscription = vi.fn().mockResolvedValueOnce(stale).mockResolvedValueOnce(null);
    const reg = {
      update: vi.fn().mockResolvedValue(undefined),
      pushManager: {
        getSubscription,
        subscribe: vi.fn().mockResolvedValue(fresh),
      },
    };

    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: vi.fn().mockResolvedValue(reg) },
      configurable: true,
    });
    getVapidKeyMock.mockResolvedValueOnce({ publicKey: "AQAB" });
    unsubscribeApiMock.mockResolvedValueOnce(undefined);
    subscribeApiMock.mockResolvedValueOnce(undefined);

    const ok = await syncPushSubscriptionOnDevice({ requestPermission: true, forceRefresh: true });
    expect(ok).toBe(true);
    expect(stale.unsubscribe).toHaveBeenCalled();
    expect(unsubscribeApiMock).toHaveBeenCalledWith("https://push.example/old");
    expect(subscribeApiMock).toHaveBeenCalledWith({
      endpoint: "https://push.example/new",
      p256dh: "new-p",
      auth: "new-a",
      deviceLabel: "Windows PC",
    });
  });
});
