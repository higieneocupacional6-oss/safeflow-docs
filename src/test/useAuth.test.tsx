import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const mock = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn(), refreshSession: vi.fn(), listener: undefined as undefined | ((event: string, session: any) => void) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getSession: mock.getSession, getUser: mock.getUser, refreshSession: mock.refreshSession,
    onAuthStateChange: (cb: typeof mock.listener) => { mock.listener = cb; return { data: { subscription: { unsubscribe: vi.fn() } } }; } },
  from: () => { const chain = { select: () => chain, eq: () => chain, order: () => chain, limit: () => chain, maybeSingle: async () => ({ data: null }) }; return chain; },
} }));
const session = (id: string) => ({ access_token: `test-${id}`, user: { id } });
function Probe() { const { user, loading } = useAuth(); return <output>{loading ? "pending" : user?.id || "signed-out"}</output>; }
beforeEach(() => { vi.clearAllMocks(); mock.getUser.mockImplementation(async (token: string) => ({ data: { user: { id: token.replace("test-", "") } }, error: null })); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("auth initialization recovery", () => {
  it("ends loading after a rejected session read without granting access", async () => {
    mock.getSession.mockRejectedValue(new Error("Invalid token"));
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText("signed-out")).toBeInTheDocument());
    expect(mock.getUser).not.toHaveBeenCalled();
  });
  it("does not trust an invalid stored identity when renewal fails", async () => {
    mock.getSession.mockResolvedValue({ data: { session: session("invalid") } });
    mock.getUser.mockResolvedValue({ data: { user: null }, error: new Error("invalid") });
    mock.refreshSession.mockResolvedValue({ data: { session: null }, error: new Error("expired") });
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText("signed-out")).toBeInTheDocument());
    expect(mock.refreshSession).toHaveBeenCalledOnce();
  });
  it("verifies the renewed identity before restoring access", async () => {
    mock.getSession.mockResolvedValue({ data: { session: session("old") } });
    mock.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("expired") });
    mock.refreshSession.mockResolvedValue({ data: { session: session("renewed") }, error: null });
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText("renewed")).toBeInTheDocument());
    expect(mock.getUser).toHaveBeenLastCalledWith("test-renewed");
  });
  it("a newer auth event wins over a delayed initial session read", async () => {
    let resolve: (value: any) => void = () => {};
    mock.getSession.mockReturnValue(new Promise(r => { resolve = r; }));
    render(<AuthProvider><Probe /></AuthProvider>);
    act(() => { mock.listener?.("SIGNED_IN", session("new")); });
    await waitFor(() => expect(screen.getByText("new")).toBeInTheDocument());
    await act(async () => { resolve({ data: { session: session("old") } }); });
    expect(screen.getByText("new")).toBeInTheDocument();
    expect(mock.getUser).not.toHaveBeenCalledWith("test-old");
  });
  it("a stalled storage read cannot block the interface indefinitely", async () => {
    vi.useFakeTimers(); mock.getSession.mockReturnValue(new Promise(() => {}));
    render(<AuthProvider><Probe /></AuthProvider>);
    await act(async () => { vi.advanceTimersByTime(15000); });
    expect(screen.getByText("signed-out")).toBeInTheDocument();
  });
});