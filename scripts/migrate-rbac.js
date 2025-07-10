#!/usr/bin/env node

/**
 * RBAC Migration Script
 * Applies the role-based access control migration to the database
 */

import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

async function runMigration() {
  console.log("🔄 Running RBAC Migration...");

  try {
    // Read the migration file
    const migrationPath = join(__dirname, "../migrations/003_rbac_system.sql");
    const migrationSQL = readFileSync(migrationPath, "utf8");

    // Note: This is a template - you'll need to adapt this for your specific database setup
    // For Cloudflare D1, you would typically run this via wrangler d1 execute

    console.log("📋 Migration SQL loaded successfully");
    console.log("💡 To apply this migration, run:");
    console.log(
      "   npx wrangler d1 execute DB --file=migrations/003_rbac_system.sql",
    );
    console.log("");
    console.log("📝 Migration includes:");
    console.log("   ✓ roles table - Store role definitions");
    console.log("   ✓ permissions table - Store permission definitions");
    console.log("   ✓ role_permissions table - Link roles to permissions");
    console.log("   ✓ user_roles table - Assign roles to users");
    console.log("   ✓ audit_logs table - Track admin actions");
    console.log("   ✓ Default roles and permissions");
    console.log("   ✓ Migration of existing admin users");
    console.log("");
    console.log(
      "⚠️  Important: After running the migration, existing admin users will be",
    );
    console.log(
      '   automatically assigned the "Super Admin" role based on their email/GitHub ID',
    );
    console.log("");
    console.log("🔐 Default roles created:");
    console.log("   • Super Admin - Full system access");
    console.log("   • Admin - Standard admin access");
    console.log("   • Content Manager - Manage drops and templates");
    console.log("   • Support - View orders and assist customers");
    console.log("   • Viewer - Read-only access");
  } catch (error) {
    console.error("❌ Error reading migration file:", error);
    process.exit(1);
  }
}

runMigration();
