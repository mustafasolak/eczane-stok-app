'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mb-8">
            <Image
              src="/login.jpg"
              alt="Eczane Stok Takip Sistemi"
              width={400}
              height={400}
              className="mx-auto rounded-lg shadow-xl"
              priority
            />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Eczane Stok Takip Sistemi
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Modern ve kullanıcı dostu stok yönetim çözümü ile eczanenizi daha verimli yönetin
          </p>
          
          <div className="flex justify-center gap-4">
            <Link
              href="/auth/login"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Giriş Yap
            </Link>
            <Link
              href="/auth/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors text-lg font-medium"
            >
              Kayıt Ol
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
