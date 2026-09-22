
import Permission from "@/models/Permission";
import Role from "@/models/Role";

const roles = [
  {
    name: "SUPER_ADMIN",
    description: "Full system access",
    isSystemRole: true,
  },
  {
    name: "ADMIN",
    description: "Administrative access",
    isSystemRole: true,
  },
  {
    name: "MANAGER",
    description: "Management level access",
    isSystemRole: true,
  },
  {
    name: "STAFF",
    description: "Staff level access",
    isSystemRole: true,
  },
  {
    name: "USER",
    description: "Basic user access",
    isSystemRole: true,
  },
];

export async function seedRoles() {
  const permissions = await Permission.find({
    isActive: true,
  });

  const permissionMap = new Map(
    permissions.map((permission) => [
      permission.name,
      permission._id,
    ]),
  );

  const allPermissionIds = permissions.map(
    (permission) => permission._id,
  );

  const rolePermissions: Record<string, string[]> = {
    SUPER_ADMIN: permissions.map((permission) => permission.name),

    ADMIN: [
      "users.view",
      "users.create",
      "users.edit",
      "users.delete",

      "patients.view",
      "patients.create",
      "patients.edit",
      "patients.delete",

      "reports.view",
      "reports.create",
      "reports.edit",

      "billing.view",
      "billing.create",
      "billing.edit",

      "settings.view",
      "settings.edit",
    ],

    MANAGER: [
      "users.view",

      "patients.view",
      "patients.create",
      "patients.edit",

      "reports.view",
      "reports.create",
      "reports.edit",

      "billing.view",
      "billing.create",
      "billing.edit",
    ],

    STAFF: [
      "patients.view",
      "patients.create",
      "patients.edit",

      "reports.view",
    ],

    USER: [],
  };

  for (const role of roles) {
    const permissionNames = rolePermissions[role.name] || [];

    const permissionIds = permissionNames
      .map((permissionName) =>
        permissionMap.get(permissionName),
      )
      .filter(
        (
          permissionId,
        ): permissionId is (typeof allPermissionIds)[number] =>
          Boolean(permissionId),
      );

    await Role.findOneAndUpdate(
      { name: role.name },
      {
        ...role,
        permissions: permissionIds,
        isActive: true,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  console.log("Roles seeded successfully");
}