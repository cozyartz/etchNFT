-- Migration to add upload minting system
-- This adds a table to track minting payments required for uploads

-- Create upload_mints table
CREATE TABLE IF NOT EXISTS upload_mints (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    amount_usd REAL NOT NULL,
    payment_method TEXT NOT NULL, -- 'crypto', 'web3', 'card'
    payment_provider TEXT, -- 'coinbase_commerce', 'web3_signature', 'stripe'
    charge_id TEXT,
    tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'expired'
    wallet_address TEXT,
    signature TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Add minting columns to custom_uploads table
ALTER TABLE custom_uploads ADD COLUMN mint_tx_hash TEXT;
ALTER TABLE custom_uploads ADD COLUMN mint_signature TEXT;
ALTER TABLE custom_uploads ADD COLUMN wallet_address TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_upload_mints_user_email ON upload_mints(user_email);
CREATE INDEX IF NOT EXISTS idx_upload_mints_status ON upload_mints(status);
CREATE INDEX IF NOT EXISTS idx_upload_mints_charge_id ON upload_mints(charge_id);
CREATE INDEX IF NOT EXISTS idx_custom_uploads_wallet ON custom_uploads(wallet_address);