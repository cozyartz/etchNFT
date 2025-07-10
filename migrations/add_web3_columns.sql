-- Add Web3 specific columns to orders table
ALTER TABLE orders ADD COLUMN web3_signature TEXT;
ALTER TABLE orders ADD COLUMN chain_id INTEGER;
ALTER TABLE orders ADD COLUMN order_signature TEXT;
ALTER TABLE orders ADD COLUMN verification_status TEXT DEFAULT 'pending';

-- Index for web3 orders
CREATE INDEX IF NOT EXISTS idx_orders_web3_signature ON orders(web3_signature);
CREATE INDEX IF NOT EXISTS idx_orders_chain_id ON orders(chain_id);
CREATE INDEX IF NOT EXISTS idx_orders_verification_status ON orders(verification_status);