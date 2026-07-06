import { describe, expect, it } from "vitest";
import { ROLE_HIERARCHY, hasRole, isAdmin, isEditor } from "@/lib/auth/roles";
import { APP_ROLES } from "@/lib/constants";

describe("ROLE_HIERARCHY", () => {
  it("orders roles from user (lowest) to admin (highest)", () => {
    expect(ROLE_HIERARCHY[APP_ROLES.USER]).toBeLessThan(
      ROLE_HIERARCHY[APP_ROLES.EDITOR]
    );
    expect(ROLE_HIERARCHY[APP_ROLES.EDITOR]).toBeLessThan(
      ROLE_HIERARCHY[APP_ROLES.ADMIN]
    );
  });
});

describe("hasRole", () => {
  it("grants access when the user role meets the requirement", () => {
    expect(hasRole(APP_ROLES.ADMIN, APP_ROLES.EDITOR)).toBe(true);
    expect(hasRole(APP_ROLES.EDITOR, APP_ROLES.USER)).toBe(true);
  });

  it("grants access when the user role equals the requirement", () => {
    expect(hasRole(APP_ROLES.EDITOR, APP_ROLES.EDITOR)).toBe(true);
  });

  it("denies access when the user role is below the requirement", () => {
    expect(hasRole(APP_ROLES.USER, APP_ROLES.EDITOR)).toBe(false);
    expect(hasRole(APP_ROLES.EDITOR, APP_ROLES.ADMIN)).toBe(false);
  });
});

describe("isAdmin", () => {
  it("is true only for admins", () => {
    expect(isAdmin(APP_ROLES.ADMIN)).toBe(true);
    expect(isAdmin(APP_ROLES.EDITOR)).toBe(false);
    expect(isAdmin(APP_ROLES.USER)).toBe(false);
  });
});

describe("isEditor", () => {
  it("is true for editors and admins but not plain users", () => {
    expect(isEditor(APP_ROLES.ADMIN)).toBe(true);
    expect(isEditor(APP_ROLES.EDITOR)).toBe(true);
    expect(isEditor(APP_ROLES.USER)).toBe(false);
  });
});
