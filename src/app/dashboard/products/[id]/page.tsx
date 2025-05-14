'use client';

import ProtectedRoute from '@/components/protected-route';
import ProductDetail from './product-detail';

interface PageProps {
  params: {
    id: string;
  };
}

export default function ProductPage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <ProductDetail params={params} />
    </ProtectedRoute>
  );
} 