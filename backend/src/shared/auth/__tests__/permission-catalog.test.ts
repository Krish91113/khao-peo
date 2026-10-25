import { describe, expect, it } from "vitest";
import {
  LEGACY_ROLE_MAP,
  PERMISSIONS,
  resolvePermissions,
} from "../permission-catalog.js";

describe("permission-catalog", () => {
  it("maps legacy roles to their modern permission sets", () => {
    expect(resolvePermissions("admin" as never)).toContain(PERMISSIONS.STAFF_READ);
    expect(resolvePermissions("owner" as never)).toContain(PERMISSIONS.RESTAURANT_UPDATE);
    expect(resolvePermissions("superadmin" as never)).toContain(PERMISSIONS.PLATFORM_MANAGE);
  });

  it("keeps legacy roles resolvable through LEGACY_ROLE_MAP", () => {
    expect(LEGACY_ROLE_MAP).toEqual({
      owner: "restaurant_owner",
      admin: "restaurant_admin",
      superadmin: "platform_superadmin",
    });
  });

  it("grants audit read to waiter and cashier", () => {
    expect(resolvePermissions("waiter")).toContain(PERMISSIONS.AUDIT_READ);
    expect(resolvePermissions("cashier")).toContain(PERMISSIONS.AUDIT_READ);
  });

  it("does not grant audit read to cook", () => {
    expect(resolvePermissions("cook")).not.toContain(PERMISSIONS.AUDIT_READ);
  });

  it("combines role defaults with overrides", () => {
    const perms = resolvePermissions("cook", [PERMISSIONS.TABLE_READ]);
    expect(perms).toContain(PERMISSIONS.KITCHEN_READ);
    expect(perms).toContain(PERMISSIONS.TABLE_READ);
  });
});
