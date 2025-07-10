// ===========================================
// Drops System Database Access Layer
// ===========================================

import { randomUUID } from "crypto";
import type {
  Drop,
  DropItem,
  DropPurchase,
  DesignTemplate,
  LaserFile,
  CreateDropRequest,
  CreateDropItemRequest,
  PurchaseDropRequest,
  DropFilters,
  DropStats,
} from "../types/drops";

// ===========================================
// Drop Management Functions
// ===========================================

export async function createDrop(
  db: D1Database,
  creatorId: string,
  data: CreateDropRequest,
): Promise<Drop> {
  const id = randomUUID();
  const slug = generateSlug(data.name);
  const now = new Date().toISOString();

  const drop: Drop = {
    id,
    name: data.name,
    description: data.description,
    creator_id: creatorId,
    image_url: undefined,
    banner_url: undefined,
    collection_size: 0,
    price_usd: data.price_usd,
    currency: "USD",
    launch_date: data.launch_date ? new Date(data.launch_date) : undefined,
    end_date: data.end_date ? new Date(data.end_date) : undefined,
    is_active: false,
    is_featured: false,
    total_supply: data.total_supply,
    minted_supply: 0,
    max_per_user: data.max_per_user || 1,
    product_type: data.product_type,
    material: data.material,
    dimensions: data.dimensions,
    slug,
    tags: data.tags,
    created_at: new Date(now),
    updated_at: new Date(now),
  };

  await db
    .prepare(
      `
    INSERT INTO drops (
      id, name, description, creator_id, price_usd, currency,
      launch_date, end_date, is_active, is_featured, total_supply,
      minted_supply, max_per_user, product_type, material, dimensions,
      slug, tags, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .bind(
      id,
      data.name,
      data.description,
      creatorId,
      data.price_usd,
      "USD",
      data.launch_date,
      data.end_date,
      0,
      0,
      data.total_supply,
      0,
      data.max_per_user || 1,
      data.product_type,
      data.material,
      data.dimensions,
      slug,
      JSON.stringify(data.tags || []),
      now,
      now,
    )
    .run();

  return drop;
}

export async function getDrop(
  db: D1Database,
  id: string,
): Promise<Drop | null> {
  const result = await db
    .prepare(
      `
    SELECT * FROM drops WHERE id = ?
  `,
    )
    .bind(id)
    .first();

  return result ? formatDrop(result) : null;
}

export async function getDropBySlug(
  db: D1Database,
  slug: string,
): Promise<Drop | null> {
  const result = await db
    .prepare(
      `
    SELECT * FROM drops WHERE slug = ?
  `,
    )
    .bind(slug)
    .first();

  return result ? formatDrop(result) : null;
}

export async function getDrops(
  db: D1Database,
  filters: DropFilters = {},
): Promise<Drop[]> {
  let query = `SELECT * FROM drops WHERE 1=1`;
  const params: any[] = [];

  if (filters.status) {
    const now = new Date().toISOString();
    switch (filters.status) {
      case "upcoming":
        query += ` AND launch_date > ?`;
        params.push(now);
        break;
      case "live":
        query += ` AND launch_date <= ? AND (end_date IS NULL OR end_date > ?) AND is_active = 1`;
        params.push(now, now);
        break;
      case "ended":
        query += ` AND end_date <= ?`;
        params.push(now);
        break;
    }
  }

  if (filters.product_type) {
    query += ` AND product_type = ?`;
    params.push(filters.product_type);
  }

  if (filters.material) {
    query += ` AND material = ?`;
    params.push(filters.material);
  }

  if (filters.price_min) {
    query += ` AND price_usd >= ?`;
    params.push(filters.price_min);
  }

  if (filters.price_max) {
    query += ` AND price_usd <= ?`;
    params.push(filters.price_max);
  }

  if (filters.featured_only) {
    query += ` AND is_featured = 1`;
  }

  query += ` ORDER BY created_at DESC`;

  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all();

  return result.results.map(formatDrop);
}

export async function updateDrop(
  db: D1Database,
  id: string,
  updates: Partial<Drop>,
): Promise<void> {
  const fields = Object.keys(updates).filter((key) => key !== "id");
  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const values = fields.map((field) => updates[field as keyof Drop]);

  await db
    .prepare(
      `
    UPDATE drops SET ${setClause}, updated_at = ? WHERE id = ?
  `,
    )
    .bind(...values, new Date().toISOString(), id)
    .run();
}

export async function deleteDrop(db: D1Database, id: string): Promise<void> {
  await db.prepare(`DELETE FROM drops WHERE id = ?`).bind(id).run();
}

// ===========================================
// Drop Item Management Functions
// ===========================================

export async function createDropItem(
  db: D1Database,
  dropId: string,
  data: CreateDropItemRequest,
): Promise<DropItem> {
  const id = randomUUID();
  const now = new Date().toISOString();

  const item: DropItem = {
    id,
    drop_id: dropId,
    name: data.name,
    description: data.description,
    token_id: data.token_id,
    original_image_url: data.original_image_url,
    thumbnail_url: undefined,
    preview_url: undefined,
    laser_file_url: undefined,
    laser_file_status: "pending",
    processing_notes: undefined,
    attributes: data.attributes,
    rarity_rank: undefined,
    is_available: true,
    is_sold: false,
    reserved_until: undefined,
    created_at: new Date(now),
    updated_at: new Date(now),
  };

  await db
    .prepare(
      `
    INSERT INTO drop_items (
      id, drop_id, name, description, token_id, original_image_url,
      laser_file_status, attributes, is_available, is_sold,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .bind(
      id,
      dropId,
      data.name,
      data.description,
      data.token_id,
      data.original_image_url,
      "pending",
      JSON.stringify(data.attributes || {}),
      1,
      0,
      now,
      now,
    )
    .run();

  return item;
}

export async function getDropItems(
  db: D1Database,
  dropId: string,
): Promise<DropItem[]> {
  const result = await db
    .prepare(
      `
    SELECT * FROM drop_items WHERE drop_id = ? ORDER BY created_at DESC
  `,
    )
    .bind(dropId)
    .all();

  return result.results.map(formatDropItem);
}

export async function getDropItem(
  db: D1Database,
  id: string,
): Promise<DropItem | null> {
  const result = await db
    .prepare(
      `
    SELECT * FROM drop_items WHERE id = ?
  `,
    )
    .bind(id)
    .first();

  return result ? formatDropItem(result) : null;
}

export async function updateDropItem(
  db: D1Database,
  id: string,
  updates: Partial<DropItem>,
): Promise<void> {
  const fields = Object.keys(updates).filter((key) => key !== "id");
  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const values = fields.map((field) => updates[field as keyof DropItem]);

  await db
    .prepare(
      `
    UPDATE drop_items SET ${setClause}, updated_at = ? WHERE id = ?
  `,
    )
    .bind(...values, new Date().toISOString(), id)
    .run();
}

// ===========================================
// Purchase Management Functions
// ===========================================

export async function createPurchase(
  db: D1Database,
  data: PurchaseDropRequest,
): Promise<DropPurchase> {
  const id = randomUUID();
  const now = new Date().toISOString();

  // Get drop and item details for pricing
  const drop = await getDrop(db, data.drop_id);
  if (!drop) throw new Error("Drop not found");

  const item = await getDropItem(db, data.drop_item_id);
  if (!item) throw new Error("Drop item not found");

  const unitPrice = drop.price_usd;
  const totalPrice = unitPrice * data.quantity;

  const purchase: DropPurchase = {
    id,
    user_id: undefined,
    drop_id: data.drop_id,
    drop_item_id: data.drop_item_id,
    quantity: data.quantity,
    unit_price_usd: unitPrice,
    total_price_usd: totalPrice,
    payment_method: data.payment_method,
    payment_provider: undefined,
    payment_tx_id: undefined,
    payment_status: "pending",
    customer_email: data.customer_email,
    customer_name: data.customer_name,
    shipping_address_line: data.shipping_address?.line,
    shipping_city: data.shipping_address?.city,
    shipping_country: data.shipping_address?.country,
    shipping_postal_code: data.shipping_address?.postal_code,
    order_status: "pending",
    tracking_number: undefined,
    laser_file_used: undefined,
    production_notes: undefined,
    created_at: new Date(now),
    updated_at: new Date(now),
  };

  await db
    .prepare(
      `
    INSERT INTO drop_purchases (
      id, drop_id, drop_item_id, quantity, unit_price_usd, total_price_usd,
      payment_method, payment_status, customer_email, customer_name,
      shipping_address_line, shipping_city, shipping_country, shipping_postal_code,
      order_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .bind(
      id,
      data.drop_id,
      data.drop_item_id,
      data.quantity,
      unitPrice,
      totalPrice,
      data.payment_method,
      "pending",
      data.customer_email,
      data.customer_name,
      data.shipping_address?.line,
      data.shipping_address?.city,
      data.shipping_address?.country,
      data.shipping_address?.postal_code,
      "pending",
      now,
      now,
    )
    .run();

  return purchase;
}

export async function getPurchase(
  db: D1Database,
  id: string,
): Promise<DropPurchase | null> {
  const result = await db
    .prepare(
      `
    SELECT * FROM drop_purchases WHERE id = ?
  `,
    )
    .bind(id)
    .first();

  return result ? formatDropPurchase(result) : null;
}

export async function getPurchases(
  db: D1Database,
  filters: { userId?: string; dropId?: string; status?: string } = {},
): Promise<DropPurchase[]> {
  let query = `SELECT * FROM drop_purchases WHERE 1=1`;
  const params: any[] = [];

  if (filters.userId) {
    query += ` AND user_id = ?`;
    params.push(filters.userId);
  }

  if (filters.dropId) {
    query += ` AND drop_id = ?`;
    params.push(filters.dropId);
  }

  if (filters.status) {
    query += ` AND order_status = ?`;
    params.push(filters.status);
  }

  query += ` ORDER BY created_at DESC`;

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();
  return result.results.map(formatDropPurchase);
}

// ===========================================
// Design Template Functions
// ===========================================

export async function getDesignTemplates(
  db: D1Database,
  category?: string,
): Promise<DesignTemplate[]> {
  let query = `SELECT * FROM design_templates WHERE is_active = 1`;
  const params: any[] = [];

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  query += ` ORDER BY sort_order ASC, name ASC`;

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();
  return result.results.map(formatDesignTemplate);
}

export async function getDesignTemplate(
  db: D1Database,
  id: string,
): Promise<DesignTemplate | null> {
  const result = await db
    .prepare(
      `
    SELECT * FROM design_templates WHERE id = ?
  `,
    )
    .bind(id)
    .first();

  return result ? formatDesignTemplate(result) : null;
}

// ===========================================
// Statistics Functions
// ===========================================

export async function getDropStats(db: D1Database): Promise<DropStats> {
  const [totalDrops, activeDrops, totalSales, totalRevenue, popularProducts] =
    await Promise.all([
      db.prepare(`SELECT COUNT(*) as count FROM drops`).first(),
      db
        .prepare(`SELECT COUNT(*) as count FROM drops WHERE is_active = 1`)
        .first(),
      db
        .prepare(
          `SELECT COUNT(*) as count FROM drop_purchases WHERE payment_status = 'completed'`,
        )
        .first(),
      db
        .prepare(
          `SELECT SUM(total_price_usd) as total FROM drop_purchases WHERE payment_status = 'completed'`,
        )
        .first(),
      db
        .prepare(
          `
      SELECT d.product_type, COUNT(*) as count 
      FROM drop_purchases dp 
      JOIN drops d ON dp.drop_id = d.id 
      WHERE dp.payment_status = 'completed' 
      GROUP BY d.product_type 
      ORDER BY count DESC 
      LIMIT 5
    `,
        )
        .all(),
    ]);

  return {
    total_drops: totalDrops?.count || 0,
    active_drops: activeDrops?.count || 0,
    total_sales: totalSales?.count || 0,
    total_revenue: totalRevenue?.total || 0,
    avg_price: totalSales?.count
      ? (totalRevenue?.total || 0) / totalSales.count
      : 0,
    popular_products: popularProducts.results.map((p: any) => ({
      product_type: p.product_type,
      count: p.count,
    })),
  };
}

// ===========================================
// Utility Functions
// ===========================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

function formatDrop(row: any): Drop {
  return {
    ...row,
    is_active: Boolean(row.is_active),
    is_featured: Boolean(row.is_featured),
    launch_date: row.launch_date ? new Date(row.launch_date) : undefined,
    end_date: row.end_date ? new Date(row.end_date) : undefined,
    tags: row.tags ? JSON.parse(row.tags) : [],
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

function formatDropItem(row: any): DropItem {
  return {
    ...row,
    is_available: Boolean(row.is_available),
    is_sold: Boolean(row.is_sold),
    reserved_until: row.reserved_until
      ? new Date(row.reserved_until)
      : undefined,
    attributes: row.attributes ? JSON.parse(row.attributes) : {},
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

function formatDropPurchase(row: any): DropPurchase {
  return {
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

function formatDesignTemplate(row: any): DesignTemplate {
  return {
    ...row,
    supports_text: Boolean(row.supports_text),
    is_active: Boolean(row.is_active),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}
