import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ürün Düzenle - Eczane Stok Takip',
  description: 'Ürün düzenleme sayfası',
};

export default function EditProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 