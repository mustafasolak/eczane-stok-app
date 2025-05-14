'use client';

import { useAuth } from '@/providers/auth-provider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/auth/login');
    } catch (error) {
      console.error('Çıkış yapılırken bir hata oluştu:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Eczane Stok Takip
                </h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                {user?.displayName || user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900">Stok Yönetimi</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Ürünleri ekleyin, düzenleyin ve stok durumunu takip edin
                </p>
                <div className="mt-4">
                  <Link
                    href="/dashboard/products"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Ürünleri Yönet →
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900">
                  Reçete İşlemleri
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Reçete bazlı stok işlemlerini yönetin
                </p>
                <div className="mt-4">
                  <Link
                    href="/dashboard/prescriptions"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Reçeteleri Yönet →
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900">
                  QR & Barkod Tarama
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Kamera ile hızlı ürün taraması yapın
                </p>
                <div className="mt-4">
                  <Link
                    href="/dashboard/scanner"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Tarayıcıyı Aç →
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
} 