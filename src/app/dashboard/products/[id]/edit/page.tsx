'use client';

import { use } from 'react';
import ProtectedRoute from '@/components/protected-route';
import EditProductForm from './edit-product-form';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditProductPage({ params }: PageProps) {
  const resolvedParams = use(params);

  return (
    <ProtectedRoute>
      <EditProductForm productId={resolvedParams.id} />
    </ProtectedRoute>
  );
} 