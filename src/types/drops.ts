// ===========================================
// Drops System Type Definitions
// ===========================================

export interface Drop {
  id: string;
  name: string;
  description?: string;
  creator_id: string;

  // Metadata
  image_url?: string;
  banner_url?: string;
  collection_size: number;

  // Pricing
  price_usd: number;
  currency: string;

  // Launch Configuration
  launch_date?: Date;
  end_date?: Date;
  is_active: boolean;
  is_featured: boolean;

  // Supply Management
  total_supply: number;
  minted_supply: number;
  max_per_user: number;

  // Product Configuration
  product_type: string;
  material: string;
  dimensions: string;

  // SEO and Marketing
  slug: string;
  tags?: string[];

  created_at: Date;
  updated_at: Date;
}

export interface DropItem {
  id: string;
  drop_id: string;

  // Item Details
  name: string;
  description?: string;
  token_id: string;

  // Artwork
  original_image_url: string;
  thumbnail_url?: string;
  preview_url?: string;

  // Laser Processing
  laser_file_url?: string;
  laser_file_status: "pending" | "processing" | "ready" | "failed";
  processing_notes?: string;

  // Metadata
  attributes?: Record<string, any>;
  rarity_rank?: number;

  // Availability
  is_available: boolean;
  is_sold: boolean;
  reserved_until?: Date;

  created_at: Date;
  updated_at: Date;
}

export interface DropPurchase {
  id: string;
  user_id?: string;
  drop_id: string;
  drop_item_id: string;

  // Purchase Details
  quantity: number;
  unit_price_usd: number;
  total_price_usd: number;

  // Payment Information
  payment_method: string;
  payment_provider?: string;
  payment_tx_id?: string;
  payment_status: "pending" | "completed" | "failed" | "refunded";

  // Customer Information
  customer_email: string;
  customer_name: string;

  // Shipping Information
  shipping_address_line?: string;
  shipping_city?: string;
  shipping_country?: string;
  shipping_postal_code?: string;

  // Order Processing
  order_status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  tracking_number?: string;

  // Fulfillment
  laser_file_used?: string;
  production_notes?: string;

  created_at: Date;
  updated_at: Date;
}

export interface DesignTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;

  // Template Files
  template_svg: string;
  preview_image_url?: string;

  // Configuration
  dimensions: string;
  material: string;

  // Positioning
  image_position: "center" | "top" | "bottom" | "left" | "right";
  image_max_width: number;
  image_max_height: number;

  // Customization Options
  supports_text: boolean;
  max_text_lines: number;
  text_font: string;
  text_size: number;

  // Metadata
  is_active: boolean;
  sort_order: number;

  created_at: Date;
  updated_at: Date;
}

export interface LaserFile {
  id: string;
  drop_item_id?: string;
  template_id?: string;

  // File Information
  original_file_url: string;
  processed_file_url: string;
  file_format: string;
  file_size?: number;

  // Processing Information
  processing_status: "pending" | "processing" | "completed" | "failed";
  processing_algorithm?: string;
  processing_time_ms?: number;
  processing_notes?: string;

  // Quality Metrics
  contrast_score?: number;
  detail_score?: number;
  engraving_quality?: "excellent" | "good" | "fair" | "poor";

  // Laser Settings
  recommended_power: number;
  recommended_speed: number;
  recommended_passes: number;

  // Usage Tracking
  times_used: number;
  last_used_at?: Date;

  created_at: Date;
  updated_at: Date;
}

// ===========================================
// API Request/Response Types
// ===========================================

export interface CreateDropRequest {
  name: string;
  description?: string;
  price_usd: number;
  launch_date?: string;
  end_date?: string;
  total_supply: number;
  max_per_user?: number;
  product_type: string;
  material: string;
  dimensions: string;
  tags?: string[];
}

export interface CreateDropItemRequest {
  name: string;
  description?: string;
  token_id: string;
  original_image_url: string;
  attributes?: Record<string, any>;
}

export interface PurchaseDropRequest {
  drop_id: string;
  drop_item_id: string;
  quantity: number;
  customer_email: string;
  customer_name: string;
  shipping_address?: {
    line: string;
    city: string;
    country: string;
    postal_code: string;
  };
  payment_method: string;
}

export interface ProcessImageRequest {
  image_url: string;
  template_id: string;
  options?: {
    contrast_enhancement?: boolean;
    edge_detection?: boolean;
    vectorize?: boolean;
  };
}

export interface ProcessImageResponse {
  laser_file_id: string;
  processed_file_url: string;
  processing_status: string;
  quality_metrics: {
    contrast_score: number;
    detail_score: number;
    engraving_quality: string;
  };
  recommended_settings: {
    power: number;
    speed: number;
    passes: number;
  };
}

// ===========================================
// UI Component Props
// ===========================================

export interface DropCardProps {
  drop: Drop & {
    available_items: number;
    preview_items: DropItem[];
  };
}

export interface DropItemCardProps {
  item: DropItem;
  onPurchase: (item: DropItem) => void;
  isLoading?: boolean;
}

export interface LaserPreviewProps {
  item: DropItem;
  template: DesignTemplate;
  onTemplateChange: (template: DesignTemplate) => void;
}

export interface AdminDropFormProps {
  drop?: Drop;
  onSubmit: (drop: CreateDropRequest) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

// ===========================================
// Utility Types
// ===========================================

export type DropStatus = "upcoming" | "live" | "ended";
export type ProductType =
  | "plaque"
  | "keychain"
  | "coaster"
  | "pendant"
  | "bookmark";
export type MaterialType = "wood" | "acrylic" | "metal" | "leather" | "bamboo";
export type LaserFileStatus = "pending" | "processing" | "ready" | "failed";
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface DropFilters {
  status?: DropStatus;
  product_type?: ProductType;
  material?: MaterialType;
  price_min?: number;
  price_max?: number;
  featured_only?: boolean;
}

export interface DropStats {
  total_drops: number;
  active_drops: number;
  total_sales: number;
  total_revenue: number;
  avg_price: number;
  popular_products: Array<{
    product_type: string;
    count: number;
  }>;
}
