'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { collection, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { z } from 'zod';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

const productSchema = z.object({
  name: z.string().min(1, 'Ürün adı zorunludur'),
  stockCode: z.string().min(1, 'Stok kodu zorunludur'),
  barcode: z.string().min(1, 'Barkod zorunludur'),
  quantity: z.number().min(0, 'Stok miktarı 0 veya daha büyük olmalıdır'),
  brand: z.string().min(1, 'Marka zorunludur'),
  description: z.string().optional(),
  shelfRow: z.string().regex(/^[0-9]+$/, 'Satır sadece rakamlardan oluşmalıdır').optional(),
  shelfColumn: z.string().regex(/^[A-Za-z]+$/, 'Sütun sadece harflerden oluşmalıdır').optional(),
  image: z.any().optional(),
});

interface EditProductFormProps {
  productId: string;
}

export default function EditProductForm({ productId }: EditProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    stockCode: '',
    barcode: '',
    quantity: 0,
    brand: '',
    description: '',
    shelfRow: '',
    shelfColumn: '',
    image: null as File | null,
  });
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'urunler', productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name ?? data.urun_adi ?? '',
            stockCode: data.stockCode ?? data.stok_kodu ?? '',
            barcode: data.barcode ?? data.barkod_kodu ?? '',
            quantity: data.quantity ?? data.stok_miktari ?? 0,
            brand: data.brand ?? data.urun_markasi ?? '',
            description: data.description ?? data.urun_aciklamasi ?? '',
            shelfRow: data.shelfRow ?? '',
            shelfColumn: data.shelfColumn ?? '',
            image: null,
          });
          const imageUrl = data.imageUrl ?? data.urun_resmi_url ?? null;
          setCurrentImageUrl(imageUrl);
          setImagePreview(imageUrl);
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
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Form verilerini doğrula
      const validatedData = productSchema.parse({
        ...formData,
        quantity: Number(formData.quantity),
      });

      let imageUrl = currentImageUrl;

      // Yeni resim yüklendiyse
      if (formData.image) {
        // Eski resmi sil
        if (currentImageUrl && currentImageUrl.startsWith('https://')) {
          try {
            const oldImageRef = ref(storage, currentImageUrl);
            await deleteObject(oldImageRef);
          } catch (error) {
            console.log('Eski resim silinemedi veya yok:', error);
            // Devam et
          }
        }

        try {
          // Yeni resmi yükle
          const imageRef = ref(storage, `products/${Date.now()}_${formData.image.name}`);
          await uploadBytes(imageRef, formData.image);
          imageUrl = await getDownloadURL(imageRef);
        } catch (uploadError) {
          console.error('Yeni resim yüklenirken hata oluştu:', uploadError);
          throw new Error('Resim yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
      }

      // Firestore'u güncelle
      const productRef = doc(db, 'urunler', productId);
      await updateDoc(productRef, {
        name: validatedData.name,
        stockCode: validatedData.stockCode,
        barcode: validatedData.barcode,
        quantity: validatedData.quantity,
        brand: validatedData.brand,
        description: validatedData.description,
        shelfRow: validatedData.shelfRow,
        shelfColumn: validatedData.shelfColumn,
        imageUrl: imageUrl,
        updatedAt: new Date(),
      });

      router.push(`/dashboard/products/${productId}`);
    } catch (error) {
      console.error('Ürün güncellenirken hata oluştu:', error);
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ürün güncellenirken bir hata oluştu');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Yalnızca PNG ve JPEG türlerine izin ver
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Yalnızca PNG veya JPEG formatındaki dosyalar yüklenebilir.');
        return;
      }
      try {
        // Resim sıkıştırma seçenekleri
        const options = {
          maxSizeMB: 1, // Maksimum 1MB
          maxWidthOrHeight: 1024, // Maksimum genişlik veya yükseklik
          useWebWorker: true, // Web worker kullanarak performansı artır
          fileType: 'image/jpeg', // JPEG formatına dönüştür
        };

        // Resmi sıkıştır
        const compressedFile = await imageCompression(file, options);
        
        // Sıkıştırılmış resmi state'e kaydet
        setFormData(prev => ({
          ...prev,
          image: compressedFile,
        }));
        
        // Önizleme için URL oluştur
        const previewUrl = URL.createObjectURL(compressedFile);
        setImagePreview(previewUrl);
      } catch (error) {
        console.error('Resim sıkıştırma hatası:', error);
        setError('Resim sıkıştırılırken bir hata oluştu.');
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={`/dashboard/products/${productId}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Ürün Detayına Geri Dön
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Ürün Düzenle</h1>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Ürün Adı
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ürün adını giriniz"
                  />
                </div>

                <div>
                  <label htmlFor="stockCode" className="block text-sm font-medium text-gray-700">
                    Stok Kodu
                  </label>
                  <input
                    type="text"
                    name="stockCode"
                    id="stockCode"
                    value={formData.stockCode}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Stok kodunu giriniz"
                  />
                </div>

                <div>
                  <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">
                    Barkod
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    id="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Barkod numarasını giriniz"
                  />
                </div>

                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Stok Miktarı
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    id="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="0"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Stok miktarını giriniz"
                  />
                </div>

                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                    Marka
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="shelfRow" className="block text-sm font-medium text-gray-700">
                    Raf Satırı
                  </label>
                  <input
                    type="text"
                    id="shelfRow"
                    name="shelfRow"
                    value={formData.shelfRow}
                    onChange={handleChange}
                    placeholder="Örn: 1,2,3 gibi bir sayı"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="shelfColumn" className="block text-sm font-medium text-gray-700">
                    Raf Sütunu
                  </label>
                  <input
                    type="text"
                    id="shelfColumn"
                    name="shelfColumn"
                    value={formData.shelfColumn}
                    onChange={handleChange}
                    placeholder="Örn: A,B,C gibi bir harf"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        className="h-40 w-40 object-cover rounded-md"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        {formData.image ? 'Yeni seçilen resim' : 'Mevcut resim'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Açıklama
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ürün açıklamasını giriniz"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  href={`/dashboard/products/${productId}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  İptal
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 