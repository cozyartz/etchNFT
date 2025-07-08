-- ===========================================
-- Drops System Database Schema
-- ===========================================

-- ===========================================
-- Drops (Collection of NFT designs for sale)
-- ===========================================
CREATE TABLE IF NOT EXISTS drops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id TEXT NOT NULL,
  
  -- Metadata
  image_url TEXT,
  banner_url TEXT,
  collection_size INTEGER DEFAULT 0,
  
  -- Pricing
  price_usd REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Launch Configuration
  launch_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT 0,
  is_featured BOOLEAN DEFAULT 0,
  
  -- Supply Management
  total_supply INTEGER DEFAULT 0,
  minted_supply INTEGER DEFAULT 0,
  max_per_user INTEGER DEFAULT 1,
  
  -- Product Configuration
  product_type TEXT DEFAULT 'plaque', -- plaque, keychain, coaster, etc.
  material TEXT DEFAULT 'wood',
  dimensions TEXT DEFAULT '6x4 inches',
  
  -- SEO and Marketing
  slug TEXT UNIQUE,
  tags TEXT, -- JSON array of tags
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- ===========================================
-- Drop Items (Individual NFT designs in a drop)
-- ===========================================
CREATE TABLE IF NOT EXISTS drop_items (
  id TEXT PRIMARY KEY,
  drop_id TEXT NOT NULL,
  
  -- Item Details
  name TEXT NOT NULL,
  description TEXT,
  token_id TEXT NOT NULL,
  
  -- Artwork
  original_image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  preview_url TEXT,
  
  -- Laser Processing
  laser_file_url TEXT,
  laser_file_status TEXT DEFAULT 'pending', -- pending, processing, ready, failed
  processing_notes TEXT,
  
  -- Metadata
  attributes TEXT, -- JSON attributes
  rarity_rank INTEGER,
  
  -- Availability
  is_available BOOLEAN DEFAULT 1,
  is_sold BOOLEAN DEFAULT 0,
  reserved_until TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (drop_id) REFERENCES drops(id) ON DELETE CASCADE
);

-- ===========================================
-- Drop Purchases (User purchases from drops)
-- ===========================================
CREATE TABLE IF NOT EXISTS drop_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT, -- Optional - can be guest purchases
  drop_id TEXT NOT NULL,
  drop_item_id TEXT NOT NULL,
  
  -- Purchase Details
  quantity INTEGER DEFAULT 1,
  unit_price_usd REAL NOT NULL,
  total_price_usd REAL NOT NULL,
  
  -- Payment Information
  payment_method TEXT NOT NULL, -- card, crypto, etc.
  payment_provider TEXT,
  payment_tx_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  
  -- Customer Information
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  
  -- Shipping Information
  shipping_address_line TEXT,
  shipping_city TEXT,
  shipping_country TEXT,
  shipping_postal_code TEXT,
  
  -- Order Processing
  order_status TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  tracking_number TEXT,
  
  -- Fulfillment
  laser_file_used TEXT,
  production_notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (drop_id) REFERENCES drops(id),
  FOREIGN KEY (drop_item_id) REFERENCES drop_items(id)
);

-- ===========================================
-- Design Templates (Reusable design templates)
-- ===========================================
CREATE TABLE IF NOT EXISTS design_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- plaque, keychain, coaster, etc.
  
  -- Template Files
  template_svg TEXT NOT NULL, -- SVG template with placeholders
  preview_image_url TEXT,
  
  -- Configuration
  dimensions TEXT NOT NULL, -- "6x4 inches", "50x30 mm", etc.
  material TEXT DEFAULT 'wood',
  
  -- Positioning
  image_position TEXT DEFAULT 'center', -- center, top, bottom, left, right
  image_max_width INTEGER DEFAULT 300,
  image_max_height INTEGER DEFAULT 300,
  
  -- Customization Options
  supports_text BOOLEAN DEFAULT 0,
  max_text_lines INTEGER DEFAULT 0,
  text_font TEXT DEFAULT 'Arial',
  text_size INTEGER DEFAULT 12,
  
  -- Metadata
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- Laser Files (Processed files ready for laser engraving)
-- ===========================================
CREATE TABLE IF NOT EXISTS laser_files (
  id TEXT PRIMARY KEY,
  drop_item_id TEXT,
  template_id TEXT,
  
  -- File Information
  original_file_url TEXT NOT NULL,
  processed_file_url TEXT NOT NULL,
  file_format TEXT DEFAULT 'svg',
  file_size INTEGER,
  
  -- Processing Information
  processing_status TEXT DEFAULT 'completed', -- pending, processing, completed, failed
  processing_algorithm TEXT, -- 'auto', 'vectorize', 'trace', etc.
  processing_time_ms INTEGER,
  processing_notes TEXT,
  
  -- Quality Metrics
  contrast_score REAL,
  detail_score REAL,
  engraving_quality TEXT, -- excellent, good, fair, poor
  
  -- Laser Settings
  recommended_power INTEGER DEFAULT 50,
  recommended_speed INTEGER DEFAULT 1000,
  recommended_passes INTEGER DEFAULT 1,
  
  -- Usage Tracking
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (drop_item_id) REFERENCES drop_items(id),
  FOREIGN KEY (template_id) REFERENCES design_templates(id)
);

-- ===========================================
-- Indexes for Performance
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_drops_active ON drops(is_active, launch_date);
CREATE INDEX IF NOT EXISTS idx_drops_featured ON drops(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_drops_slug ON drops(slug);
CREATE INDEX IF NOT EXISTS idx_drop_items_drop_id ON drop_items(drop_id);
CREATE INDEX IF NOT EXISTS idx_drop_items_available ON drop_items(is_available, is_sold);
CREATE INDEX IF NOT EXISTS idx_drop_purchases_user_id ON drop_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_drop_purchases_status ON drop_purchases(order_status);
CREATE INDEX IF NOT EXISTS idx_laser_files_status ON laser_files(processing_status);
CREATE INDEX IF NOT EXISTS idx_laser_files_drop_item ON laser_files(drop_item_id);

-- ===========================================
-- Default Design Templates
-- ===========================================
INSERT OR IGNORE INTO design_templates (id, name, description, category, template_svg, dimensions, material) VALUES
('tpl_wood_plaque_6x4', 'Wood Plaque 6x4', 'Standard wooden plaque with centered image', 'plaque', 
'<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="400" fill="#8B4513" stroke="#654321" stroke-width="2"/>
  <rect x="50" y="50" width="500" height="300" fill="none" stroke="#654321" stroke-width="1" stroke-dasharray="5,5"/>
  <text x="300" y="30" text-anchor="middle" font-family="Arial" font-size="16" fill="#654321">{{nft_name}}</text>
  <image x="150" y="100" width="300" height="200" href="{{image_url}}"/>
  <text x="300" y="380" text-anchor="middle" font-family="Arial" font-size="12" fill="#654321">EtchNFT Certificate</text>
</svg>', '6x4 inches', 'wood'),

('tpl_acrylic_keychain_2x2', 'Acrylic Keychain 2x2', 'Square acrylic keychain with image', 'keychain',
'<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#E6E6FA" stroke="#9370DB" stroke-width="2"/>
  <circle cx="180" cy="20" r="8" fill="none" stroke="#9370DB" stroke-width="2"/>
  <image x="25" y="25" width="150" height="150" href="{{image_url}}"/>
</svg>', '2x2 inches', 'acrylic'),

('tpl_wood_coaster_4x4', 'Wood Coaster 4x4', 'Square wooden coaster with centered design', 'coaster',
'<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <circle cx="200" cy="200" r="190" fill="#DEB887" stroke="#8B7355" stroke-width="2"/>
  <image x="100" y="100" width="200" height="200" href="{{image_url}}"/>
</svg>', '4x4 inches', 'wood');