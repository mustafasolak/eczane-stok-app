'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import Link from 'next/link';
import { use } from 'react';

interface Product {
  id: string;
  name: string;
  stockCode: string;
  barcode: string;
  quantity: number;
  brand: string;
  description?: string;
  imageUrl?: string;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
  updatedAt?: {
    seconds: number;
    nanoseconds: number;
  };
  createdBy: string;
}

interface ProductDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductDetail({ params }: ProductDetailProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'urunler', resolvedParams.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({
            id: docSnap.id,
            name: data.name ?? data.urun_adi ?? '',
            stockCode: data.stockCode ?? data.stok_kodu ?? '',
            barcode: data.barcode ?? data.barkod_kodu ?? '',
            quantity: data.quantity ?? data.stok_miktari ?? 0,
            brand: data.brand ?? data.urun_markasi ?? '',
            description: data.description ?? data.urun_aciklamasi ?? '',
            imageUrl: data.imageUrl ?? data.urun_resmi_url ?? '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            createdBy: data.createdBy ?? '',
          });
        } else {
          setError('Ürün bulunamadı');
        }
      } catch (error) {
        console.error('Ürün yüklenirken hata oluştu:', error);
        setError('Ürün yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [resolvedParams.id]);

  const handleDelete = async () => {
    if (!product) return;

    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      setDeleting(true);
      try {
        // Resmi sil
        if (product.imageUrl && product.imageUrl.startsWith('https://')) {
          const imageRef = ref(storage, product.imageUrl);
          try {
            await deleteObject(imageRef);
          } catch (e) {
            console.warn('Storage resmi silinemedi veya yok:', e);
          }
        }

        // Firestore'dan sil
        await deleteDoc(doc(db, 'urunler', product.id));
        router.push('/dashboard/products');
      } catch (error) {
        console.error('Ürün silinirken hata oluştu:', error);
        alert('Ürün silinirken bir hata oluştu');
      } finally {
        setDeleting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-red-600">{error}</h3>
                <div className="mt-4">
                  <Link
                    href="/dashboard/products"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Ürünlere Geri Dön
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard/products"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Ürünlere Geri Dön
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
              <div className="flex space-x-3">
                <Link
                  href={`/dashboard/products/${product.id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Düzenle
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleting ? 'Siliniyor...' : 'Sil'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Ürün Bilgileri</h2>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stok Kodu</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.stockCode}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Barkod</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.barcode}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stok Miktarı</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.quantity}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Marka</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.brand}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Açıklama</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.description || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {product.createdAt ? new Date(product.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Son Güncelleme</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {product.updatedAt ? new Date(product.updatedAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                    </dd>
                  </div>
                </dl>
              </div>

              {product.imageUrl ? (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Ürün Resmi</h2>
                  <div className="aspect-w-1 aspect-h-1">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="object-cover rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Ürün Resmi</h2>
                  <div className="aspect-w-1 aspect-h-1">
                    <img
                      src="/ilac.png"
                      alt="Varsayılan"
                      className="object-cover rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 