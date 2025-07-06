-- ===========================================
-- Users (OAuth or email/password login)
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id TEXT,
  email TEXT UNIQUE,
  hashed_password TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- Sessions (for Lucia Auth or custom tokens)
-- ===========================================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===========================================
-- Orders (Etched NFT fulfillment tracking)
-- ===========================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  nft_name TEXT,
  nft_image TEXT,
  collection TEXT,
  token_id TEXT,
  contract_address TEXT,
  payment_method TEXT,
  network TEXT,
  tx_hash TEXT,
  price_usd REAL,
  full_name TEXT,
  email TEXT,
  address_line TEXT,
  city TEXT,
  country TEXT,
  plaque_svg_url TEXT,
  cert_url TEXT,
  status TEXT DEFAULT 'pending',
  email_sent BOOLEAN DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- Email-only newsletter subscribers
-- ===========================================
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
