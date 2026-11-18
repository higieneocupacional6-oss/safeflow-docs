import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const api = vi.hoisted(() => ({
  checkApiHealth: vi.fn(),
  apiRequest: vi.fn(),
  clearApiCsrf: vi.fn(),
  setApiCsrf: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  checkApiHealth: api.checkApiHealth,
  apiRequest: api.apiRequest,
  clearApiCsrf: api.clearApiCsrf,
  setApiCsrf: api.setApiCsrf,
}));

function Probe() {
  const { user, loading } = useAuth();
  return <output>{loading ? "pending" : user?.id || "signed-out"}</output>;
}

beforeEach(() => {
  vi.clearAllMocks();
  api.checkApiHealth.mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("auth initialization recovery", () => {
  it("ends loading after a rejected session read without granting access", async () => {
    api.apiRequest.mockRejectedValue(new Error("unauthorized"));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText("signed-out")).toBeInTheDocument());
  });

  it("restores the authenticated user from /api/auth/me", async () => {
    api.apiRequest.mockResolvedValue({
      user: {
        id: "u1",
        email: "a@b.com",
        nome: "A",
        ativo: true,
        role: "usuario",
        mustChangePassword: false,
      },
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText("u1")).toBeInTheDocument());
  });

  it("a stalled me request cannot block the interface indefinitely", async () => {
    vi.useFakeTimers();
    api.apiRequest.mockReturnValue(new Promise(() => {}));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {
      vi.advanceTimersByTime(15000);
    });
    expect(screen.getByText("signed-out")).toBeInTheDocument();
  });
});
