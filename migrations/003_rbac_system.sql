-- Role-Based Access Control System Migration
-- This migration creates a professional RBAC system while maintaining GitHub OAuth

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    resource TEXT NOT NULL, -- e.g., 'drops', 'users', 'orders'
    action TEXT NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    granted_by TEXT, -- user_id who granted this role
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME, -- NULL for permanent roles
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    details TEXT, -- JSON string with additional details
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add status column to users table for account management
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive'));
ALTER TABLE users ADD COLUMN last_login DATETIME;
ALTER TABLE users ADD COLUMN created_by TEXT; -- who created this user account
ALTER TABLE users ADD COLUMN notes TEXT; -- admin notes about the user

-- Insert default roles
INSERT OR IGNORE INTO roles (id, name, description, is_system) VALUES
('role_super_admin', 'Super Admin', 'Full system access with all permissions', true),
('role_admin', 'Admin', 'Standard admin access to drops and orders', true),
('role_content_manager', 'Content Manager', 'Can manage drops and templates', true),
('role_support', 'Support', 'Can view orders and assist customers', true),
('role_viewer', 'Viewer', 'Read-only access to admin data', true);

-- Insert default permissions
INSERT OR IGNORE INTO permissions (id, name, description, resource, action) VALUES
-- User management
('perm_users_create', 'users.create', 'Create new users', 'users', 'create'),
('perm_users_read', 'users.read', 'View user information', 'users', 'read'),
('perm_users_update', 'users.update', 'Edit user information', 'users', 'update'),
('perm_users_delete', 'users.delete', 'Delete users', 'users', 'delete'),

-- Role management
('perm_roles_create', 'roles.create', 'Create new roles', 'roles', 'create'),
('perm_roles_read', 'roles.read', 'View roles', 'roles', 'read'),
('perm_roles_update', 'roles.update', 'Edit roles', 'roles', 'update'),
('perm_roles_delete', 'roles.delete', 'Delete roles', 'roles', 'delete'),
('perm_roles_assign', 'roles.assign', 'Assign roles to users', 'roles', 'assign'),

-- Drop management
('perm_drops_create', 'drops.create', 'Create new drops', 'drops', 'create'),
('perm_drops_read', 'drops.read', 'View drops', 'drops', 'read'),
('perm_drops_update', 'drops.update', 'Edit drops', 'drops', 'update'),
('perm_drops_delete', 'drops.delete', 'Delete drops', 'drops', 'delete'),
('perm_drops_publish', 'drops.publish', 'Publish/unpublish drops', 'drops', 'publish'),

-- Order management
('perm_orders_create', 'orders.create', 'Create orders', 'orders', 'create'),
('perm_orders_read', 'orders.read', 'View orders', 'orders', 'read'),
('perm_orders_update', 'orders.update', 'Edit orders', 'orders', 'update'),
('perm_orders_delete', 'orders.delete', 'Delete orders', 'orders', 'delete'),
('perm_orders_fulfill', 'orders.fulfill', 'Mark orders as fulfilled', 'orders', 'fulfill'),

-- Template management
('perm_templates_create', 'templates.create', 'Create templates', 'templates', 'create'),
('perm_templates_read', 'templates.read', 'View templates', 'templates', 'read'),
('perm_templates_update', 'templates.update', 'Edit templates', 'templates', 'update'),
('perm_templates_delete', 'templates.delete', 'Delete templates', 'templates', 'delete'),

-- Subscriber management
('perm_subscribers_read', 'subscribers.read', 'View subscribers', 'subscribers', 'read'),
('perm_subscribers_update', 'subscribers.update', 'Edit subscribers', 'subscribers', 'update'),
('perm_subscribers_delete', 'subscribers.delete', 'Delete subscribers', 'subscribers', 'delete'),
('perm_subscribers_export', 'subscribers.export', 'Export subscriber data', 'subscribers', 'export'),

-- System management
('perm_system_config', 'system.config', 'Manage system configuration', 'system', 'config'),
('perm_system_logs', 'system.logs', 'View system logs', 'system', 'logs'),
('perm_system_audit', 'system.audit', 'View audit logs', 'system', 'audit');

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'role_super_admin', id FROM permissions;

-- Admin gets most permissions except user/role management
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
('role_admin', 'perm_drops_create'),
('role_admin', 'perm_drops_read'),
('role_admin', 'perm_drops_update'),
('role_admin', 'perm_drops_delete'),
('role_admin', 'perm_drops_publish'),
('role_admin', 'perm_orders_create'),
('role_admin', 'perm_orders_read'),
('role_admin', 'perm_orders_update'),
('role_admin', 'perm_orders_fulfill'),
('role_admin', 'perm_templates_create'),
('role_admin', 'perm_templates_read'),
('role_admin', 'perm_templates_update'),
('role_admin', 'perm_templates_delete'),
('role_admin', 'perm_subscribers_read'),
('role_admin', 'perm_subscribers_update'),
('role_admin', 'perm_subscribers_export');

-- Content Manager gets content-related permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
('role_content_manager', 'perm_drops_create'),
('role_content_manager', 'perm_drops_read'),
('role_content_manager', 'perm_drops_update'),
('role_content_manager', 'perm_drops_publish'),
('role_content_manager', 'perm_templates_create'),
('role_content_manager', 'perm_templates_read'),
('role_content_manager', 'perm_templates_update'),
('role_content_manager', 'perm_templates_delete'),
('role_content_manager', 'perm_orders_read');

-- Support gets order and customer-related permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
('role_support', 'perm_orders_read'),
('role_support', 'perm_orders_update'),
('role_support', 'perm_orders_fulfill'),
('role_support', 'perm_subscribers_read'),
('role_support', 'perm_drops_read'),
('role_support', 'perm_templates_read');

-- Viewer gets read-only permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
('role_viewer', 'perm_drops_read'),
('role_viewer', 'perm_orders_read'),
('role_viewer', 'perm_templates_read'),
('role_viewer', 'perm_subscribers_read');

-- Migrate existing admin users to Super Admin role
-- Note: This will need to be updated with actual user IDs after migration
INSERT OR IGNORE INTO user_roles (user_id, role_id, granted_by, granted_at)
SELECT 
    id,
    'role_super_admin',
    id, -- self-granted for initial setup
    CURRENT_TIMESTAMP
FROM users 
WHERE email IN ('cozy2963@gmail.com', 'andrea@cozyartzmedia.com', 'cozy@etchnft.com', 'amy@etchnft.com')
   OR github_id IN ('Cozyartz', 'grammar-nerd');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);