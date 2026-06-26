import { getCatalogProducts } from "@/lib/db";

export async function GET() {
  const catalog = await getCatalogProducts();
  return Response.json({ products: catalog });
}
