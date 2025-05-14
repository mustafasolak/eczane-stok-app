'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Product {
  id: string;
  name: string;
  stockCode: string;
  barcode: string;
  quantity: number;
  brand: string;
  description?: string;
  imageUrl?: string;
  createdAt: any;
  createdBy?: string;
  shelfRow?: string;
  shelfColumn?: string;
}

export default function ProductsContent() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = collection(db, 'urunler');
        const q = query(productsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const productsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name ?? data.urun_adi ?? '',
            stockCode: data.stockCode ?? data.stok_kodu ?? '',
            barcode: data.barcode ?? data.barkod_kodu ?? '',
            quantity: data.quantity ?? data.stok_miktari ?? 0,
            brand: data.brand ?? data.urun_markasi ?? '',
            description: data.description ?? data.urun_aciklamasi ?? '',
            imageUrl: data.imageUrl ?? data.urun_resmi_url ?? '',
            createdAt: data.createdAt,
            createdBy: data.createdBy,
            shelfRow: data.shelfRow ?? '',
            shelfColumn: data.shelfColumn ?? '',
          } as Product;
        });

        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error('Ürünler yüklenirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      const name = product.name ?? '';
      const stockCode = product.stockCode ?? '';
      const barcode = product.barcode ?? '';
      return (
        name.toLowerCase().includes(searchLower) ||
        stockCode.toLowerCase().includes(searchLower) ||
        barcode.toLowerCase().includes(searchLower)
      );
    });
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Ürün Yönetimi</h1>
            <p className="text-sm text-gray-600 mt-1">Toplam {products.length} ürün bulunmaktadır.</p>
            <Link
              href="/dashboard/products/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Yeni Ürün Ekle
            </Link>
          </div>

          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ürün adı, stok kodu veya barkod ile arama yapın..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <motion.li
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-50"
                >
                  <Link
                    href={`/dashboard/products/${product.id}`}
                    className="block"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-32 w-32 object-cover rounded-lg"
                              />
                            ) : (
                              <img
                                src="/ilac.png"
                                alt="Varsayılan"
                                className="h-20 w-20 object-contain rounded-lg"
                              />
                            )}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-blue-600 truncate">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {product.brand}
                            </p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex flex-col space-y-2 items-end">
                          <p className={`px-4 py-2 inline-flex text-base leading-5 font-bold rounded-full shadow-sm ${
                            product.quantity === 0 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                          }`}>
                            Stok: {product.quantity}
                          </p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Raf: {product.shelfRow || '1'}-{product.shelfColumn || 'A'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex sm:flex-col sm:space-y-2">
                          <p className="flex items-center text-sm text-gray-500">
                            Stok Kodu: {product.stockCode}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Eklenme Tarihi:{' '}
                            {product.createdAt ? new Date(product.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 