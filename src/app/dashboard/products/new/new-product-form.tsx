'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import imageCompression from 'browser-image-compression';

const productSchema = z.object({
  stok_kodu: z.string().min(1, 'Stok kodu gereklidir'),
  urun_adi: z.string().min(1, 'Ürün adı gereklidir'),
  stok_miktari: z.number().min(0, 'Stok miktarı 0 veya daha büyük olmalıdır'),
  urun_markasi: z.string().min(1, 'Ürün markası gereklidir'),
  urun_aciklamasi: z.string().min(1, 'Ürün açıklaması gereklidir'),
  barkod_kodu: z.string().optional(),
});

// Rastgele 8 haneli sayı yerine zaman damgası bazlı dosya adı
function timeStampFileName() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `image_${pad(d.getDate())}_${pad(d.getMonth() + 1)}_${d.getFullYear()}_${pad(d.getHours())}_${pad(d.getMinutes())}_${pad(d.getSeconds())}_${d.getMilliseconds()}.jpg`;
}

// Rastgele sayı dizesi üreten yardımcı fonksiyon
function randomDigits(length: number) {
  let digits = '';
  for (let i = 0; i < length; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  return digits;
}

function generateDefaultFormData() {
  return {
    stok_kodu: `SK${randomDigits(6)}`,
    urun_adi: `Ürün ${randomDigits(4)}`,
    stok_miktari: Math.floor(Math.random() * 100) + 1, // 1-100
    urun_markasi: `Marka ${randomDigits(3)}`,
    urun_aciklamasi: `Otomatik açıklama ${randomDigits(5)}`,
    barkod_kodu: randomDigits(13),
    image: null as File | null,
  };
}

export default function NewProductForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(generateDefaultFormData);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<File | null>(null);

  // İlk renderda varsayılan değerleri konsola yazdır
  useEffect(() => {
    console.log('Otomatik oluşturulan varsayılan form verileri:', formData);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Yalnızca PNG ve JPEG türlerine izin ver
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Yalnızca PNG veya JPEG formatındaki dosyalar yüklenebilir.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Lütfen 5MB'dan küçük bir dosya seçin.");
      return;
    }
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/jpeg',
      };
      const compressedFile = await imageCompression(file, options);
      setCompressedImage(compressedFile);
      setFormData(prev => ({
        ...prev,
        image: compressedFile,
      }));
      setImagePreview(URL.createObjectURL(compressedFile));
      console.log('Orijinal dosya boyutu:', file.size / 1024, 'KB');
      console.log('Sıkıştırılmış dosya boyutu:', compressedFile.size / 1024, 'KB');
    } catch (err) {
      setError('Resim sıkıştırılırken hata oluştu.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const validatedData = productSchema.parse({
        ...formData,
        stok_miktari: Number(formData.stok_miktari),
      });

      let urun_resmi_url = '/ilac.png'; // varsayılan
      if (compressedImage) {
        const fileName = timeStampFileName();
        const storageRef = ref(storage, `products/${fileName}`);
        console.log('Yüklenen dosya boyutu:', compressedImage.size / 1024, 'KB');
        await uploadBytes(storageRef, compressedImage);
        urun_resmi_url = await getDownloadURL(storageRef);
      }

      const productData = {
        ...validatedData,
        urun_resmi_url,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'urunler'), productData);
      toast.success('Ürün başarıyla eklendi!');
      router.push('/dashboard/products');
    } catch (error) {
      console.error('Ürün ekleme hatası:', error);
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ürün eklenirken bir hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard/products"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Ürünlere Geri Dön
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Yeni Ürün Ekle</h1>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="stok_kodu" className="block text-sm font-medium text-gray-700">
                    Stok Kodu
                  </label>
                  <input
                    type="text"
                    name="stok_kodu"
                    id="stok_kodu"
                    value={formData.stok_kodu}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Stok kodunu giriniz"
                  />
                </div>

                <div>
                  <label htmlFor="urun_adi" className="block text-sm font-medium text-gray-700">
                    Ürün Adı
                  </label>
                  <input
                    type="text"
                    name="urun_adi"
                    id="urun_adi"
                    value={formData.urun_adi}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ürün adını giriniz"
                  />
                </div>

                <div>
                  <label htmlFor="stok_miktari" className="block text-sm font-medium text-gray-700">
                    Stok Miktarı
                  </label>
                  <input
                    type="number"
                    name="stok_miktari"
                    id="stok_miktari"
                    value={formData.stok_miktari}
                    onChange={handleChange}
                    min="0"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Stok miktarını giriniz"
                  />
                </div>

                <div>
                  <label htmlFor="urun_markasi" className="block text-sm font-medium text-gray-700">
                    Ürün Markası
                  </label>
                  <input
                    type="text"
                    name="urun_markasi"
                    id="urun_markasi"
                    value={formData.urun_markasi}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Marka adını giriniz"
                  />
                </div>

                <div>
                  <label htmlFor="barkod_kodu" className="block text-sm font-medium text-gray-700">
                    Barkod Kodu
                  </label>
                  <input
                    type="text"
                    name="barkod_kodu"
                    id="barkod_kodu"
                    value={formData.barkod_kodu}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Barkod numarasını giriniz"
                  />
                </div>

                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                    Ürün Resmi
                  </label>
                  <input
                    type="file"
                    name="image"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Önizleme"
                        className="h-20 w-20 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="urun_aciklamasi" className="block text-sm font-medium text-gray-700">
                  Açıklama
                </label>
                <textarea
                  name="urun_aciklamasi"
                  id="urun_aciklamasi"
                  rows={3}
                  value={formData.urun_aciklamasi}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ürün açıklamasını giriniz"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  href="/dashboard/products"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  İptal
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Ürün Ekleniyor...' : 'Ürün Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}