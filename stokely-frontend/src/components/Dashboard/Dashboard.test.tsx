import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

const mockState = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  dispatchMock: vi.fn(),
  toastErrorMock: vi.fn(),
  apiMock: {
    auth: {
      me: vi.fn(),
      markWelcomeSeen: vi.fn(),
    },
    habits: {
      list: vi.fn(),
      getAchievements: vi.fn(),
      logComplete: vi.fn(),
      logUncomplete: vi.fn(),
      remove: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    e2ee: {
      enable: vi.fn(),
    },
  },
  mockUserInfo: null as Record<string, unknown> | null,
  mockE2EE: {
    key: null as CryptoKey | null,
    isUnlocked: false,
    unlock: async (_key: CryptoKey) => {},
  },
}));

vi.mock("../../api/api", () => ({
  api: mockState.apiMock,
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockState.navigateMock,
}));

vi.mock("react-redux", () => ({
  useDispatch: () => mockState.dispatchMock,
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ user: { userInfo: mockState.mockUserInfo } }),
}));

vi.mock("../../context/E2EEContext", () => ({
  useE2EE: () => mockState.mockE2EE,
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: (...args: unknown[]) => mockState.toastErrorMock(...args),
    success: vi.fn(),
  },
}));

vi.mock("./NewHabitModal", () => ({
  default: ({ showModal }: { showModal: boolean }) => (
    <div data-testid="new-habit-modal">{showModal ? "open" : "closed"}</div>
  ),
}));

vi.mock("../VaultUnlockModal", () => ({
  default: () => <div data-testid="vault-unlock-modal">vault unlock</div>,
}));

vi.mock("./Habit", () => ({
  default: () => <div />,
}));

vi.mock("./StreakView", () => ({
  default: () => <div />,
}));

vi.mock("./AchievementsView", () => ({
  default: () => <div />,
}));

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockState.mockUserInfo = {
      id: "user-1",
      username: "kindling",
      e2eeEnabled: true,
      e2eeSetupPrompt: false,
      showWelcome: false,
      dailySparkEnabled: true,
    };
    mockState.mockE2EE = {
      key: null,
      isUnlocked: false,
      unlock: async () => {},
    };

    mockState.apiMock.auth.me.mockResolvedValue(mockState.mockUserInfo);
    mockState.apiMock.auth.markWelcomeSeen.mockResolvedValue(undefined);
    mockState.apiMock.habits.list.mockResolvedValue([]);
    mockState.apiMock.habits.getAchievements.mockResolvedValue([]);
    mockState.apiMock.habits.logComplete.mockResolvedValue(undefined);
    mockState.apiMock.habits.logUncomplete.mockResolvedValue(undefined);
    mockState.apiMock.habits.remove.mockResolvedValue(undefined);
    mockState.apiMock.habits.create.mockResolvedValue(undefined);
    mockState.apiMock.habits.update.mockResolvedValue(undefined);
    mockState.apiMock.e2ee.enable.mockResolvedValue({ enabled: true, message: "ok" });

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("blocks new habit creation when e2ee is enabled and vault is locked", async () => {
    render(<Dashboard />);

    await screen.findByRole("button", { name: /\+ new habit/i });
    expect(screen.getByTestId("new-habit-modal")).toHaveTextContent("closed");

    fireEvent.click(screen.getByRole("button", { name: /\+ new habit/i }));

    await waitFor(() => {
      expect(mockState.toastErrorMock).toHaveBeenCalledWith("Unlock vault before adding a new habit");
      expect(screen.getByTestId("vault-unlock-modal")).toBeInTheDocument();
    });
    expect(screen.getByTestId("new-habit-modal")).toHaveTextContent("closed");
  });
});
