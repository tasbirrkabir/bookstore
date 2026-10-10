"use client";

import { useParams } from "next/navigation";
import { ProductEditor } from "@/components/admin/product-editor";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  return <ProductEditor productId={id} />;
}
