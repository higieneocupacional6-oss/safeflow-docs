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

const SAMPLE_USER = {
  id: "u1",
  email: "a@b.com",
  nome: "A",
  ativo: true,
  role: "usuario" as const,
  mustChangePassword: false,
};

function Probe() {
  const { user, loading } = useAuth();
  return <output>{loading ? "pending" : user?.id || "signed-out"}</output>;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  api.checkApiHealth.mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
});

describe("auth initialization recovery", () => {
  it("ends loading after a rejected session read without granting access", async () => {
    api.apiRequest.mockRejectedValue(Object.assign(new Error("unauthorized"), { status: 401 }));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText("signed-out")).toBeInTheDocument());
  });

  it("restores the authenticated user from /api/auth/me", async () => {
    api.apiRequest.mockResolvedValue({ user: SAMPLE_USER });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText("u1")).toBeInTheDocument());
    expect(localStorage.getItem("segdoc-auth-user-v1")).toContain("u1");
  });

  it("keeps the cached identity on network/5xx failure", async () => {
    localStorage.setItem("segdoc-auth-user-v1", JSON.stringify(SAMPLE_USER));
    api.apiRequest.mockRejectedValue(Object.assign(new Error("bad gateway"), { status: 502 }));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText("u1")).toBeInTheDocument());
  });

  it("a stalled me request settles with cache instead of blocking forever", async () => {
    localStorage.setItem("segdoc-auth-user-v1", JSON.stringify(SAMPLE_USER));
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
    expect(screen.getByText("u1")).toBeInTheDocument();
  });

  it("a stalled me request without cache settles signed-out", async () => {
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
