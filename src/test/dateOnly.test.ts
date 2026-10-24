import { afterEach, describe, expect, it, vi } from "vitest";
import { dateOnlyDay, formatDateOnly, normalizeDateOnly, todayDateOnly } from "@/lib/dateOnly";
import { calcStatus, diasParaVencimento } from "@/lib/notificacoes";

afterEach(() => vi.useRealTimers());
describe("civil dates", () => {
  it.each(["2026-01-01", "2026-06-15", "2026-10-29", "2026-12-31", "2028-02-29"])("preserves %s through storage and formatting", date => {
    const display = date.split("-").reverse().join("/");
    expect(formatDateOnly(date)).toBe(display);
    expect(normalizeDateOnly(display)).toBe(date);
    expect(formatDateOnly(`${date}T00:00:00Z`)).toBe(display);
  });
  it("preserves the user's exact example", () => expect(formatDateOnly(normalizeDateOnly("29/10/2026"))).toBe("29/10/2026"));
  it("rejects impossible dates rather than rolling to another day", () => expect(normalizeDateOnly("2026-02-29")).toBe(""));
  it("today uses the user's calendar rather than UTC", () => {
    const now = new Date(2026, 9, 29, 23, 59);
    expect(todayDateOnly(now)).toBe("2026-10-29");
  });
  it("civil arithmetic crosses year and DST boundaries exactly", () => {
    expect(dateOnlyDay("2027-01-01") - dateOnlyDay("2026-12-31")).toBe(1);
    expect(dateOnlyDay("2026-03-09") - dateOnlyDay("2026-03-08")).toBe(1);
  });
  it("expiry on the entered day is not prematurely expired", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 29, 12));
    expect(diasParaVencimento("2026-10-29")).toBe(0);
    expect(calcStatus("2026-10-29")).toBe("proximo");
    expect(diasParaVencimento("2026-10-30")).toBe(1);
  });
});