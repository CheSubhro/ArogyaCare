import Permission from '@/models/Permission';

const permissions = [
    {
        name: 'users.view',
        description: 'View users',
        module: 'users',
        action: 'view',
    },
    {
        name: 'users.create',
        description: 'Create users',
        module: 'users',
        action: 'create',
    },
    {
        name: 'users.edit',
        description: 'Edit users',
        module: 'users',
        action: 'edit',
    },
    {
        name: 'users.delete',
        description: 'Delete users',
        module: 'users',
        action: 'delete',
    },

    {
        name: 'patients.view',
        description: 'View patients',
        module: 'patients',
        action: 'view',
    },
    {
        name: 'patients.create',
        description: 'Create patients',
        module: 'patients',
        action: 'create',
    },
    {
        name: 'patients.edit',
        description: 'Edit patients',
        module: 'patients',
        action: 'edit',
    },
    {
        name: 'patients.delete',
        description: 'Delete patients',
        module: 'patients',
        action: 'delete',
    },

    {
        name: 'reports.view',
        description: 'View reports',
        module: 'reports',
        action: 'view',
    },
    {
        name: 'reports.create',
        description: 'Create reports',
        module: 'reports',
        action: 'create',
    },
    {
        name: 'reports.edit',
        description: 'Edit reports',
        module: 'reports',
        action: 'edit',
    },

    {
        name: 'billing.view',
        description: 'View billing information',
        module: 'billing',
        action: 'view',
    },
    {
        name: 'billing.create',
        description: 'Create billing records',
        module: 'billing',
        action: 'create',
    },
    {
        name: 'billing.edit',
        description: 'Edit billing records',
        module: 'billing',
        action: 'edit',
    },

    {
        name: 'settings.view',
        description: 'View system settings',
        module: 'settings',
        action: 'view',
    },
    {
        name: 'settings.edit',
        description: 'Edit system settings',
        module: 'settings',
        action: 'edit',
    },
];

export async function seedPermissions() {
    for (const permission of permissions) {
        await Permission.findOneAndUpdate({ name: permission.name }, permission, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        });
    }

    console.log('Permissions seeded successfully');
}
