import type { Request, Response } from "express";
import { requireRole } from "../../middleware/auth";

function response() {
  const result = { statusCode: 200, body: undefined as unknown };
  const res = {
    status(code: number) { result.statusCode = code; return this; },
    json(body: unknown) { result.body = body; return this; },
  } as unknown as Response;
  return { res, result };
}

describe("admin governance authorization", () => {
  it("denies non-admin roles", () => {
    const { res, result } = response();
    const next = jest.fn();
    requireRole("Admin")({ auth: { role: "Hospital", userId: "hospital" } } as Request, res, next);
    expect(result.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows only admin roles", () => {
    const { res, result } = response();
    const next = jest.fn();
    requireRole("Admin")({ auth: { role: "Admin", userId: "admin" } } as Request, res, next);
    expect(result.statusCode).toBe(200);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
