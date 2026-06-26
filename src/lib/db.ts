import { Pool } from "pg";
import { products, type Product } from "./products";

let pool: Pool | null = null;

function getPool() {
  if (!process.env.DATABASE_URL) return null;

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return pool;
}

export async function getCatalogProducts(): Promise<Product[]> {
  const database = getPool();
  if (!database) return products;

  try {
    const result = await database.query<Product>(
      `select
        id,
        name,
        category,
        category_label as "categoryLabel",
        price,
        currency,
        rating,
        reviews,
        stock,
        image,
        summary,
        badges,
        tags,
        specs
       from products
       order by rating desc, reviews desc`,
    );

    return result.rows.length > 0 ? result.rows : products;
  } catch {
    return products;
  }
}
