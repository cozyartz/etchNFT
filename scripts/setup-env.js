#!/usr/bin/env node

/**
 * Environment Setup Script for EtchNFT
 * Helps validate and set up environment variables
 */

const fs = require("fs");
const path = require("path");

const REQUIRED_VARS = {
  PUBLIC_PAYPAL_CLIENT_ID: {
    description: "PayPal Client ID for payments",
    example: "AXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXxxxx",
    required: true,
  },
  PAYPAL_CLIENT_SECRET: {
    description: "PayPal Client Secret for payments (server-side)",
    example: "EXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXxxxx",
    required: true,
  },
  PAYPAL_ENVIRONMENT: {
    description: "PayPal environment (sandbox or live)",
    example: "sandbox",
    required: false,
  },
  PAYPAL_WEBHOOK_SECRET: {
    description: "PayPal webhook secret for signature verification",
    example: "webhook_secret_from_paypal_developer_console",
    required: false,
  },
  SIMPLEHASH_API_KEY: {
    description: "SimpleHash API key for NFT data",
    example: "sh_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    required: true,
  },
  COINBASE_COMMERCE_API_KEY: {
    description: "Coinbase Commerce API key for crypto payments",
    example: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    required: true,
  },
  RESEND_API_KEY: {
    description: "Resend API key for email notifications",
    example: "re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    required: true,
  },
  GITHUB_CLIENT_ID: {
    description: "GitHub OAuth Client ID for admin access",
    example: "XXXXXXXXXXXXXXXXXXXX",
    required: false,
  },
  GITHUB_CLIENT_SECRET: {
    description: "GitHub OAuth Client Secret for admin access",
    example: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    required: false,
  },
};

function checkEnvironment() {
  console.log("🔍 Checking EtchNFT Environment Variables...\n");

  const missing = [];
  const warnings = [];

  Object.entries(REQUIRED_VARS).forEach(([key, config]) => {
    const value = process.env[key];

    if (!value) {
      if (config.required) {
        missing.push({ key, ...config });
      } else {
        warnings.push({ key, ...config });
      }
    } else {
      console.log(`✅ ${key}: Set`);
    }
  });

  if (missing.length > 0) {
    console.log("\n❌ Missing Required Environment Variables:");
    missing.forEach(({ key, description, example }) => {
      console.log(`\n${key}`);
      console.log(`  Description: ${description}`);
      console.log(`  Example: ${example}`);
    });
  }

  if (warnings.length > 0) {
    console.log("\n⚠️  Optional Environment Variables:");
    warnings.forEach(({ key, description }) => {
      console.log(`\n${key}`);
      console.log(`  Description: ${description}`);
    });
  }

  if (missing.length === 0) {
    console.log("\n🎉 All required environment variables are set!");
    return true;
  } else {
    console.log("\n📝 Please set the missing variables and try again.");
    console.log("💡 Copy .env.example to .env and fill in your values.");
    return false;
  }
}

function generateEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  const examplePath = path.join(process.cwd(), ".env.example");

  if (fs.existsSync(envPath)) {
    console.log("⚠️  .env file already exists. Skipping generation.");
    return;
  }

  if (!fs.existsSync(examplePath)) {
    console.log("❌ .env.example file not found. Cannot generate .env file.");
    return;
  }

  fs.copyFileSync(examplePath, envPath);
  console.log("✅ Generated .env file from .env.example");
  console.log("📝 Please edit .env and add your actual API keys.");
}

function main() {
  const command = process.argv[2];

  switch (command) {
    case "check":
      checkEnvironment();
      break;
    case "generate":
      generateEnvFile();
      break;
    case "help":
    default:
      console.log("EtchNFT Environment Setup\n");
      console.log("Commands:");
      console.log(
        "  check     - Check if all required environment variables are set",
      );
      console.log("  generate  - Generate .env file from .env.example");
      console.log("  help      - Show this help message");
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkEnvironment, REQUIRED_VARS };
