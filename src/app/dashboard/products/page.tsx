import { Metadata } from 'next';
import ProtectedRoute from '@/components/protected-route';
import ProductsContent from './products-content';

export const metadata: Metadata = {
  title: 'Ürün Yönetimi - Eczane Stok Takip',
  description: 'Ürün stok yönetimi',
};

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <ProductsContent />
    </ProtectedRoute>
  );
} 