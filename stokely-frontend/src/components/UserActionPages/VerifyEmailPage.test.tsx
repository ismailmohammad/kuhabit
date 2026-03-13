import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import VerifyEmailPage from "./VerifyEmailPage";
import { api } from "../../api/api";

vi.mock("../../api/api", () => ({
  api: {
    auth: {
      verifyEmail: vi.fn(),
    },
  },
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("VerifyEmailPage", () => {
  it("shows missing-token message when token is absent", () => {
    renderAt("/verify-email");
    expect(screen.getByText("No verification token found in this link.")).toBeInTheDocument();
  });

  it("calls verification API and renders success text", async () => {
    vi.mocked(api.auth.verifyEmail).mockResolvedValueOnce({ message: "Verified" });
    renderAt("/verify-email?token=abc123");

    await waitFor(() => {
      expect(api.auth.verifyEmail).toHaveBeenCalledWith("abc123");
    });
    expect(await screen.findByText("✓ Verified")).toBeInTheDocument();
  });
});
