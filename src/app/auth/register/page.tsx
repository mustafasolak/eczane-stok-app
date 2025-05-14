import { Metadata } from 'next';
import Link from 'next/link';
import RegisterForm from './register-form';

export const metadata: Metadata = {
  title: 'Kayıt Ol - Eczane Stok Takip',
  description: 'Yeni hesap oluşturun',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Yeni Hesap Oluşturun
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Zaten hesabınız var mı?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Giriş yapın
            </Link>
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
} 