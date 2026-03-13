import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VaultUnlockModal from "./VaultUnlockModal";

const statusMock = vi.fn();
const deriveKeyMock = vi.fn();
const checkVerifierMock = vi.fn();
const unlockMock = vi.fn();

let mockUserInfo: { username?: string } | null = { username: "kindling" };

vi.mock("../api/api", () => ({
  api: {
    e2ee: {
      status: (...args: unknown[]) => statusMock(...args),
    },
  },
}));

vi.mock("../utils/e2ee", () => ({
  deriveKey: (...args: unknown[]) => deriveKeyMock(...args),
  checkVerifier: (...args: unknown[]) => checkVerifierMock(...args),
}));

vi.mock("../context/E2EEContext", () => ({
  useE2EE: () => ({ unlock: (...args: unknown[]) => unlockMock(...args) }),
}));

vi.mock("react-redux", () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ user: { userInfo: mockUserInfo } }),
}));

describe("VaultUnlockModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserInfo = { username: "kindling" };
  });

  it("shows message when e2ee is not enabled", async () => {
    statusMock.mockResolvedValueOnce({ enabled: false });
    render(<VaultUnlockModal onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Vault passphrase"), {
      target: { value: "secret-passphrase" },
    });
    fireEvent.click(screen.getByRole("button", { name: /unlock vault/i }));

    expect(await screen.findByText("E2EE is not enabled for this account.")).toBeInTheDocument();
  });

  it("shows error on incorrect passphrase", async () => {
    const key = {} as CryptoKey;
    statusMock.mockResolvedValueOnce({ enabled: true, salt: "abc", verifier: "xyz" });
    deriveKeyMock.mockResolvedValueOnce(key);
    checkVerifierMock.mockResolvedValueOnce(false);

    render(<VaultUnlockModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Vault passphrase"), {
      target: { value: "wrong-passphrase" },
    });
    fireEvent.click(screen.getByRole("button", { name: /unlock vault/i }));

    expect(await screen.findByText("Incorrect passphrase.")).toBeInTheDocument();
    expect(unlockMock).not.toHaveBeenCalled();
  });

  it("unlocks and closes modal when verifier succeeds", async () => {
    const key = {} as CryptoKey;
    const onClose = vi.fn();
    statusMock.mockResolvedValueOnce({ enabled: true, salt: "abc", verifier: "xyz" });
    deriveKeyMock.mockResolvedValueOnce(key);
    checkVerifierMock.mockResolvedValueOnce(true);
    unlockMock.mockResolvedValueOnce(undefined);

    render(<VaultUnlockModal onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("Vault passphrase"), {
      target: { value: "correct-passphrase" },
    });
    fireEvent.click(screen.getByRole("button", { name: /unlock vault/i }));

    await waitFor(() => {
      expect(unlockMock).toHaveBeenCalledWith(key);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
