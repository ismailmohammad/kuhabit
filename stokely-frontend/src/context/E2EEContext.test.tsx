import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { E2EEProvider, useE2EE } from "./E2EEContext";

let mockUserInfo: { id?: string; e2eeEnabled?: boolean } | null = null;

const loadKeyFromDevice = vi.fn();
const saveKeyToDevice = vi.fn();
const deleteKeyFromDevice = vi.fn();

vi.mock("react-redux", () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ user: { userInfo: mockUserInfo } }),
}));

vi.mock("../utils/e2ee", () => ({
  loadKeyFromDevice: (...args: unknown[]) => loadKeyFromDevice(...args),
  saveKeyToDevice: (...args: unknown[]) => saveKeyToDevice(...args),
  deleteKeyFromDevice: (...args: unknown[]) => deleteKeyFromDevice(...args),
}));

let latestContext: ReturnType<typeof useE2EE> | null = null;

function Probe() {
  latestContext = useE2EE();
  return <div data-testid="vault-state">{latestContext.isUnlocked ? "unlocked" : "locked"}</div>;
}

describe("E2EEProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserInfo = null;
    latestContext = null;
    loadKeyFromDevice.mockResolvedValue(null);
    saveKeyToDevice.mockResolvedValue(undefined);
    deleteKeyFromDevice.mockResolvedValue(undefined);
  });

  it("auto-loads persisted key for e2ee-enabled users", async () => {
    const fakeKey = {} as CryptoKey;
    mockUserInfo = { id: "user-1", e2eeEnabled: true };
    loadKeyFromDevice.mockResolvedValue(fakeKey);

    render(
      <E2EEProvider>
        <Probe />
      </E2EEProvider>,
    );

    await waitFor(() => {
      expect(loadKeyFromDevice).toHaveBeenCalledWith("user-1");
      expect(screen.getByTestId("vault-state")).toHaveTextContent("unlocked");
    });
  });

  it("unlock persists key and lock removes it", async () => {
    const fakeKey = {} as CryptoKey;
    mockUserInfo = { id: "user-2", e2eeEnabled: true };

    render(
      <E2EEProvider>
        <Probe />
      </E2EEProvider>,
    );

    await act(async () => {
      await latestContext?.unlock(fakeKey);
    });
    expect(saveKeyToDevice).toHaveBeenCalledWith("user-2", fakeKey);
    expect(screen.getByTestId("vault-state")).toHaveTextContent("unlocked");

    await act(async () => {
      await latestContext?.lock();
    });
    expect(deleteKeyFromDevice).toHaveBeenCalledWith("user-2");
    expect(screen.getByTestId("vault-state")).toHaveTextContent("locked");
  });

  it("clears in-memory key when e2ee is disabled on user state", async () => {
    const fakeKey = {} as CryptoKey;
    mockUserInfo = { id: "user-3", e2eeEnabled: true };
    loadKeyFromDevice.mockResolvedValue(fakeKey);

    const view = render(
      <E2EEProvider>
        <Probe />
      </E2EEProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("vault-state")).toHaveTextContent("unlocked"));

    mockUserInfo = { id: "user-3", e2eeEnabled: false };
    view.rerender(
      <E2EEProvider>
        <Probe />
      </E2EEProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("vault-state")).toHaveTextContent("locked"));
  });
});
