import { DreamShop } from "@/components/dream-shop";
import { getCatalogProducts } from "@/lib/db";

export default async function Home() {
  const catalog = await getCatalogProducts();

  return <DreamShop initialProducts={catalog} />;
}
