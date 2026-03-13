import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Landing from "./Landing";

vi.mock("react-hot-toast", () => ({ default: vi.fn() }));

describe("Landing", () => {
  it("shows key product feature cards", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getByText("End-to-End Encrypted Vault")).toBeInTheDocument();
    expect(screen.getByText("Reminders by Device")).toBeInTheDocument();
    expect(screen.getByText("Session + Account Controls")).toBeInTheDocument();
    expect(screen.getByText("More Than a Reminder List")).toBeInTheDocument();
    expect(screen.getByText("Privacy You Can Use Daily")).toBeInTheDocument();
  });
});
