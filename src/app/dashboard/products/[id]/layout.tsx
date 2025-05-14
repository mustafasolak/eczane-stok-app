import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ürün Detayı - Eczane Stok Takip',
  description: 'Ürün detay sayfası',
};

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 