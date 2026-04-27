import { userRoles, type UserRole } from "@/lib/auth/types";

const roleHomePaths: Record<UserRole, string> = {
  client: "/client",
  talent: "/talent",
  admin: "/admin",
};

export function isUserRole(value: string | null | undefined): value is UserRole {
  return Boolean(value && userRoles.includes(value as UserRole));
}

export function getRoleHomePath(role: UserRole) {
  return roleHomePaths[role];
}

export function getRequiredRoleForPath(pathname: string): UserRole | null {
  if (pathname === "/client" || pathname.startsWith("/client/")) {
    return "client";
  }

  if (pathname === "/talent" || pathname.startsWith("/talent/")) {
    return "talent";
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "admin";
  }

  return null;
}

export function canRoleAccessPath(role: UserRole, pathname: string) {
  const requiredRole = getRequiredRoleForPath(pathname);
  return requiredRole === null || requiredRole === role;
}

export function sanitizeInternalPath(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export function resolveAuthorizedPath(nextPath: string | null | undefined, role: UserRole) {
  const safePath = sanitizeInternalPath(nextPath);

  if (safePath && canRoleAccessPath(role, safePath)) {
    return safePath;
  }

  return getRoleHomePath(role);
}
