import { AppRole, APP_ROLES } from "@/lib/constants";

export const ROLE_HIERARCHY: Record<AppRole, number> = {
  [APP_ROLES.USER]: 1,
  [APP_ROLES.EDITOR]: 2,
  [APP_ROLES.ADMIN]: 3,
};

export function hasRole(userRole: AppRole, requiredRole: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isAdmin(userRole: AppRole): boolean {
  return hasRole(userRole, APP_ROLES.ADMIN);
}

export function isEditor(userRole: AppRole): boolean {
  return hasRole(userRole, APP_ROLES.EDITOR);
}
