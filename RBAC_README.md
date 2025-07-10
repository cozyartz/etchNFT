# Role-Based Access Control (RBAC) System

This document describes the professional role-based access control system implemented for EtchNFT's admin area.

## Overview

The RBAC system provides granular permission management while maintaining GitHub OAuth for authentication. It replaces the previous hardcoded admin whitelist with a flexible, database-driven role and permission system.

## Key Features

- **Role-Based Access Control**: Granular permissions assigned through roles
- **GitHub OAuth Integration**: Seamless authentication experience
- **Audit Logging**: Complete tracking of admin actions
- **Rate Limiting**: Protection against abuse
- **User Management Interface**: Web-based admin management
- **Permission-Based Route Protection**: Secure API endpoints

## Database Schema

### Core Tables

- `roles` - Role definitions (Super Admin, Admin, Content Manager, etc.)
- `permissions` - Permission definitions (users.create, drops.read, etc.)
- `role_permissions` - Links roles to permissions
- `user_roles` - Assigns roles to users
- `audit_logs` - Tracks all admin actions

### Migration

Run the migration to set up the RBAC system:

```bash
npx wrangler d1 execute DB --file=migrations/003_rbac_system.sql
```

## Default Roles

### Super Admin
- **Purpose**: Full system access
- **Permissions**: All permissions
- **Use Case**: System administrators

### Admin
- **Purpose**: Standard administrative access
- **Permissions**: Manage drops, orders, templates, subscribers
- **Use Case**: General administrators

### Content Manager
- **Purpose**: Content and drop management
- **Permissions**: Create/edit drops, manage templates, view orders
- **Use Case**: Content creators and managers

### Support
- **Purpose**: Customer support
- **Permissions**: View/update orders, view subscribers and drops
- **Use Case**: Customer service representatives

### Viewer
- **Purpose**: Read-only access
- **Permissions**: View drops, orders, templates, subscribers
- **Use Case**: Analysts and observers

## Permission System

### Permission Format
Permissions follow the format: `resource.action`

Examples:
- `users.create` - Create new users
- `drops.read` - View drops
- `orders.fulfill` - Mark orders as fulfilled
- `roles.assign` - Assign roles to users

### Resource Types
- `users` - User management
- `roles` - Role management
- `drops` - NFT drops
- `orders` - Order management
- `templates` - Design templates
- `subscribers` - Email subscribers
- `system` - System configuration and logs

## API Endpoints

### User Management
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `POST /api/admin/users/[id]/roles` - Assign role to user
- `DELETE /api/admin/users/[id]/roles` - Remove role from user

### Role Management
- `GET /api/admin/roles` - List all roles and permissions
- `POST /api/admin/roles` - Create new role
- `GET /api/admin/roles/[id]` - Get role details
- `PUT /api/admin/roles/[id]` - Update role
- `DELETE /api/admin/roles/[id]` - Delete role

### Audit Logging
- `GET /api/admin/audit` - View audit logs

## Usage Examples

### Protecting Routes

```typescript
// Require specific permission
const user = await requirePermission(Astro, "drops.create");

// Require permission with audit logging
const user = await requirePermissionWithAudit(
  Astro,
  "drops.delete",
  "delete_drop",
  "drops",
  dropId
);

// Require super admin
const user = await requireSuperAdmin(Astro);
```

### Checking User Permissions

```typescript
// Check if user has permission
const canCreateDrops = await hasPermission(db, userId, "drops.create");

// Get user's roles
const userRoles = await getUserRoles(db, userId);

// Get user's permissions
const userPermissions = await getUserPermissions(db, userId);
```

### Managing Roles

```typescript
// Assign role to user
await assignRole(db, userId, "role_admin", grantedByUserId);

// Remove role from user
await removeRole(db, userId, "role_admin");

// Check if user is super admin
const isSuperAdmin = await isSuperAdmin(db, userId);
```

## Web Interface

### Admin User Management
Access the user management interface at `/admin/users` (requires `users.read` permission).

Features:
- View all users with their roles and status
- Search and filter users
- Assign/remove roles
- View audit logs
- Create new roles

### Navigation
- **Users Tab**: Manage users and assign roles
- **Roles Tab**: View and manage roles
- **Audit Tab**: View system audit logs

## Security Features

### Rate Limiting
- **Admin Endpoints**: 100 requests per minute
- **Auth Endpoints**: 10 requests per 5 minutes
- **Automatic Cleanup**: Expired rate limit entries are cleaned up

### Audit Logging
Every admin action is logged with:
- User ID and details
- Action performed
- Resource affected
- IP address
- User agent
- Timestamp
- Additional context

### Permission Validation
- All admin routes validate permissions before execution
- Permissions are checked against the database in real-time
- Role expiration is supported for temporary access

## Migration from Hardcoded System

The migration automatically:
1. Creates all necessary tables
2. Inserts default roles and permissions
3. Migrates existing admin users to Super Admin role
4. Sets up proper relationships

Existing admin users (based on email/GitHub ID) will automatically receive the Super Admin role.

## Development

### Adding New Permissions

1. Add permission to migration file:
```sql
INSERT INTO permissions (id, name, description, resource, action) VALUES
('perm_new_feature', 'new_feature.action', 'Description', 'resource', 'action');
```

2. Assign to appropriate roles:
```sql
INSERT INTO role_permissions (role_id, permission_id) VALUES
('role_admin', 'perm_new_feature');
```

3. Use in code:
```typescript
const user = await requirePermission(context, "new_feature.action");
```

### Adding New Roles

1. Create role in database or via API
2. Assign appropriate permissions
3. Document the role's purpose and permissions

## Monitoring

### Audit Logs
- Monitor the `/api/admin/audit` endpoint
- Filter by user, action, or resource
- Export logs for compliance

### Rate Limiting
- Monitor rate limit headers in responses
- Check for frequent 429 responses
- Adjust limits as needed

## Troubleshooting

### Permission Denied Errors
1. Check user's assigned roles
2. Verify role has required permissions
3. Check permission name matches exactly
4. Ensure role hasn't expired

### Authentication Issues
1. Verify GitHub OAuth configuration
2. Check user exists in database
3. Ensure user has at least one role
4. Check for rate limiting

### Database Issues
1. Verify migration ran successfully
2. Check table relationships
3. Validate foreign key constraints
4. Ensure proper indexes exist

## Best Practices

1. **Principle of Least Privilege**: Assign minimum required permissions
2. **Regular Audits**: Review user roles and permissions regularly
3. **Role Expiration**: Use temporary roles for contractors/temporary access
4. **Audit Log Review**: Regularly review audit logs for suspicious activity
5. **Permission Granularity**: Use specific permissions rather than broad access
6. **Rate Limiting**: Monitor and adjust rate limits based on usage patterns

## Support

For issues with the RBAC system:
1. Check audit logs for recent changes
2. Verify database migration completed successfully
3. Review permission assignments
4. Check rate limiting status
5. Validate GitHub OAuth configuration