-- Custom Art Uploads Table
CREATE TABLE IF NOT EXISTS custom_uploads (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  image_data_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded',
  processed_svg_url TEXT,
  processing_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_uploads_user_email ON custom_uploads(user_email);
CREATE INDEX IF NOT EXISTS idx_custom_uploads_status ON custom_uploads(status);

-- Add source_type column to orders table to distinguish between NFT and custom upload orders
ALTER TABLE orders ADD COLUMN source_type TEXT DEFAULT 'nft';
ALTER TABLE orders ADD COLUMN custom_upload_id TEXT;

-- Index for the new columns
CREATE INDEX IF NOT EXISTS idx_orders_source_type ON orders(source_type);
CREATE INDEX IF NOT EXISTS idx_orders_custom_upload_id ON orders(custom_upload_id);