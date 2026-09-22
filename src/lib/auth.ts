
import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/jwt";
import Role from "@/models/Role";
import type { IPermission } from "@/models/Permission";

export interface AuthenticatedUser {
  userId: string;
  role: string;
}

function getAccessTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const accessToken = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("accessToken="))
    ?.split("=")
    .slice(1)
    .join("=");

  return accessToken || null;
}

export function requireAuth(
  request: Request,
):
  | { success: true; user: AuthenticatedUser }
  | { success: false; response: NextResponse } {
  const accessToken = getAccessTokenFromRequest(request);

  if (!accessToken) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 },
      ),
    };
  }

  try {
    const payload = verifyAccessToken(accessToken);

    return {
      success: true,
      user: {
        userId: payload.userId,
        role: payload.role,
      },
    };
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Invalid or expired access token",
        },
        { status: 401 },
      ),
    };
  }
}

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "STAFF"
  | "USER";

export function requireRole(
  request: Request,
  allowedRoles: UserRole[],
):
  | { success: true; user: AuthenticatedUser }
  | { success: false; response: NextResponse } {
  const authResult = requireAuth(request);

  if (!authResult.success) {
    return authResult;
  }

  const hasPermission = allowedRoles.includes(
    authResult.user.role as UserRole,
  );

  if (!hasPermission) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: "You do not have permission to access this resource",
        },
        { status: 403 },
      ),
    };
  }

  return authResult;
}

export async function requirePermission(
  request: Request,
  permissionName: string,
):
  Promise<
    | { success: true; user: AuthenticatedUser }
    | { success: false; response: NextResponse }
  > {
  const authResult = requireAuth(request);

  if (!authResult.success) {
    return authResult;
  }

  const role = await Role.findOne({
    name: authResult.user.role,
    isActive: true,
  }).populate("permissions");

  if (!role) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: "User role is invalid or inactive",
        },
        { status: 403 },
      ),
    };
  }

  const populatedPermissions =
    role.permissions as unknown as IPermission[];

  const hasPermission = populatedPermissions.some(
    (permission) =>
      permission.isActive &&
      permission.name === permissionName,
  );

  if (!hasPermission) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: "You do not have permission to access this resource",
        },
        { status: 403 },
      ),
    };
  }

  return authResult;
}

