'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    adSoyad: '',
    tcKimlik: '',
    telefon: ''
  });
  const [saleSuccess, setSaleSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSearchResult(null);
    setSaleSuccess(false);
    setSearchAttempted(true);

    try {
      const productsRef = collection(db, 'urunler');
      let foundProduct = null;
      
      // İlk olarak doğrudan ID ile arama yap
      const docSnapshot = await getDoc(doc(productsRef, searchTerm));
      
      // Eğer doğrudan ID ile bulunursa
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        foundProduct = {
          id: docSnapshot.id,
          name: data.name ?? data.urun_adi ?? '',
          stockCode: data.stockCode ?? data.stok_kodu ?? '',
          barcode: data.barcode ?? data.barkod_kodu ?? '',
          quantity: data.quantity ?? data.stok_miktari ?? 0,
          brand: data.brand ?? data.urun_markasi ?? '',
          description: data.description ?? data.urun_aciklamasi ?? '',
          imageUrl: data.imageUrl ?? data.urun_resmi_url ?? '',
          price: data.price ?? data.fiyat ?? 0,
          shelfRow: data.shelfRow ?? '1',
          shelfColumn: data.shelfColumn ?? 'A'
        };
      } else {
        // ID ile bulunamadıysa stok kodu veya barkod ile ara
        
        // Stok kodu ile arama
        const stockCodeQuery = query(
          productsRef, 
          where('stockCode', '==', searchTerm)
        );
        
        const stockCodeSnapshot = await getDocs(stockCodeQuery);
        
        if (!stockCodeSnapshot.empty) {
          const doc = stockCodeSnapshot.docs[0];
          const data = doc.data();
          foundProduct = {
            id: doc.id,
            name: data.name ?? data.urun_adi ?? '',
            stockCode: data.stockCode ?? data.stok_kodu ?? '',
            barcode: data.barcode ?? data.barkod_kodu ?? '',
            quantity: data.quantity ?? data.stok_miktari ?? 0,
            brand: data.brand ?? data.urun_markasi ?? '',
            description: data.description ?? data.urun_aciklamasi ?? '',
            imageUrl: data.imageUrl ?? data.urun_resmi_url ?? '',
            price: data.price ?? data.fiyat ?? 0,
            shelfRow: data.shelfRow ?? '1',
            shelfColumn: data.shelfColumn ?? 'A'
          };
        } else {
          // Türkçe alan adı ile de deneme
          const stockCodeTrQuery = query(
            productsRef, 
            where('stok_kodu', '==', searchTerm)
          );
          
          const stockCodeTrSnapshot = await getDocs(stockCodeTrQuery);
          
          if (!stockCodeTrSnapshot.empty) {
            const doc = stockCodeTrSnapshot.docs[0];
            const data = doc.data();
            foundProduct = {
              id: doc.id,
              name: data.name ?? data.urun_adi ?? '',
              stockCode: data.stockCode ?? data.stok_kodu ?? '',
              barcode: data.barcode ?? data.barkod_kodu ?? '',
              quantity: data.quantity ?? data.stok_miktari ?? 0,
              brand: data.brand ?? data.urun_markasi ?? '',
              description: data.description ?? data.urun_aciklamasi ?? '',
              imageUrl: data.imageUrl ?? data.urun_resmi_url ?? '',
              price: data.price ?? data.fiyat ?? 0,
              shelfRow: data.shelfRow ?? '1',
              shelfColumn: data.shelfColumn ?? 'A'
            };
          } else {
            // Barkod ile arama
            const barcodeQuery = query(
              productsRef, 
              where('barcode', '==', searchTerm)
            );
            
            const barcodeSnapshot = await getDocs(barcodeQuery);
            
            if (!barcodeSnapshot.empty) {
              const doc = barcodeSnapshot.docs[0];
              const data = doc.data();
              foundProduct = {
                id: doc.id,
                name: data.name ?? data.urun_adi ?? '',
                stockCode: data.stockCode ?? data.stok_kodu ?? '',
                barcode: data.barcode ?? data.barkod_kodu ?? '',
                quantity: data.quantity ?? data.stok_miktari ?? 0,
                brand: data.brand ?? data.urun_markasi ?? '',
                description: data.description ?? data.urun_aciklamasi ?? '',
                imageUrl: data.imageUrl ?? data.urun_resmi_url ?? '',
                price: data.price ?? data.fiyat ?? 0,
                shelfRow: data.shelfRow ?? '1',
                shelfColumn: data.shelfColumn ?? 'A'
              };
            } else {
              // Türkçe barkod alanı ile deneme
              const barcodeTrQuery = query(
                productsRef, 
                where('barkod_kodu', '==', searchTerm)
              );
              
              const barcodeTrSnapshot = await getDocs(barcodeTrQuery);
              
              if (!barcodeTrSnapshot.empty) {
                const doc = barcodeTrSnapshot.docs[0];
                const data = doc.data();
                foundProduct = {
                  id: doc.id,
                  name: data.name ?? data.urun_adi ?? '',
                  stockCode: data.stockCode ?? data.stok_kodu ?? '',
                  barcode: data.barcode ?? data.barkod_kodu ?? '',
                  quantity: data.quantity ?? data.stok_miktari ?? 0,
                  brand: data.brand ?? data.urun_markasi ?? '',
                  description: data.description ?? data.urun_aciklamasi ?? '',
                  imageUrl: data.imageUrl ?? data.urun_resmi_url ?? '',
                  price: data.price ?? data.fiyat ?? 0,
                  shelfRow: data.shelfRow ?? '1',
                  shelfColumn: data.shelfColumn ?? 'A'
                };
              }
            }
          }
        }
      }

      setSearchResult(foundProduct);
    } catch (error) {
      console.error('Ürün aranırken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // İnput değiştiğinde arama yapılmış durumunu sıfırla
    if (searchAttempted) {
      setSearchAttempted(false);
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchResult) return;
    
    try {
      setLoading(true);
      
      // Satış kaydını Firebase'e ekle
      await addDoc(collection(db, 'satislar'), {
        urunId: searchResult.id,
        stokKodu: searchResult.stockCode,
        barkodKodu: searchResult.barcode,
        urunAdi: searchResult.name,
        urunResimUrl: searchResult.imageUrl || '/ilac.png',
        musteriAdSoyad: customerInfo.adSoyad,
        musteriTC: customerInfo.tcKimlik,
        musteriTelefon: customerInfo.telefon,
        satisTarihi: serverTimestamp(),
        satisYapan: user?.email
      });
      
      // Ürün stok miktarını güncelle
      const urunRef = doc(db, 'urunler', searchResult.id);
      const urunDoc = await getDoc(urunRef);
      
      if (urunDoc.exists()) {
        const urunData = urunDoc.data();
        
        // Çift dil desteği (Türkçe ve İngilizce alan adları)
        const guncelStok = Math.max(0, (urunData.quantity ?? urunData.stok_miktari ?? 0) - 1);
        
        // Stok miktarını güncelle
        const updateData: any = {};
        
        // Hem İngilizce hem Türkçe alan adlarını güncelle
        if ('quantity' in urunData) {
          updateData.quantity = guncelStok;
        }
        
        if ('stok_miktari' in urunData) {
          updateData.stok_miktari = guncelStok;
        }
        
        // Eğer hiçbir alan bulunamadıysa
        if (Object.keys(updateData).length === 0) {
          updateData.quantity = guncelStok;
          updateData.stok_miktari = guncelStok;
        }
        
        // Belgeyi güncelle
        await updateDoc(urunRef, updateData);
        
        // Arama sonucunu da güncelle
        setSearchResult({
          ...searchResult,
          quantity: guncelStok
        });
      }
      
      // Formu sıfırla
      setCustomerInfo({
        adSoyad: '',
        tcKimlik: '',
        telefon: ''
      });
      
      setShowSaleForm(false);
      setSaleSuccess(true);
      
    } catch (error) {
      console.error('Satış kaydedilirken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Reçete İşlemleri</h1>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700">
                  Barkod veya Stok Kodu Giriniz
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="searchTerm"
                    id="searchTerm"
                    value={searchTerm}
                    onChange={handleInputChange}
                    className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-md text-lg border-gray-300 px-4 py-3 h-14"
                    placeholder="Barkod veya stok kodu girin"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-14 w-24"
                  >
                    {loading ? 'Aranıyor...' : 'Ara'}
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          {saleSuccess && (
            <div className="mb-6 p-4 bg-green-100 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">İşlem başarıyla tamamlandı</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Ürün teslim edildi ve stok miktarı güncellendi.</p>
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setSearchResult(null);
                        setSaleSuccess(false);
                      }}
                      className="mt-2 text-green-800 hover:text-green-900 underline focus:outline-none"
                    >
                      Yeni Teslim İşlemi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {searchResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white shadow-md rounded-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {searchResult.imageUrl ? (
                      <img
                        src={searchResult.imageUrl}
                        alt={searchResult.name}
                        className="h-32 w-32 object-cover rounded-lg"
                      />
                    ) : (
                      <img
                        src="/ilac.png"
                        alt="Varsayılan"
                        className="h-32 w-32 object-contain rounded-lg"
                      />
                    )}
                  </div>
                  <div className="ml-6 flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">{searchResult.name}</h2>
                    <p className="mt-1 text-sm text-gray-600">Stok Kodu: {searchResult.stockCode}</p>
                    <p className="mt-1 text-sm text-gray-600">Barkod: {searchResult.barcode}</p>
                    <p className="mt-1 text-sm text-gray-600">Marka: {searchResult.brand}</p>
                    
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Raf Konumu: {searchResult.shelfRow}-{searchResult.shelfColumn}
                      </span>
                    </div>
                    
                    {searchResult.quantity > 0 ? (
                      <div className="mt-4 flex justify-between items-center">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Stokta Mevcut: {searchResult.quantity} adet
                        </span>
                        {!showSaleForm && (
                          <button
                            onClick={() => setShowSaleForm(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Ürünü Teslim Et
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4">
                        <span className="text-2xl font-bold text-red-600">STOKTA YOK</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {showSaleForm && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 border-t pt-6"
                  >
                    <h3 className="text-lg font-medium text-gray-900">Müşteri Bilgileri</h3>
                    <form onSubmit={handleSaleSubmit} className="mt-4 space-y-6">
                      <div>
                        <label htmlFor="adSoyad" className="block text-base font-medium text-gray-700">Ad Soyad</label>
                        <input
                          type="text"
                          id="adSoyad"
                          value={customerInfo.adSoyad}
                          onChange={(e) => setCustomerInfo({...customerInfo, adSoyad: e.target.value})}
                          required
                          className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm text-lg border-gray-300 rounded-md px-4 py-3 h-14"
                        />
                      </div>
                      <div>
                        <label htmlFor="tcKimlik" className="block text-base font-medium text-gray-700">TC Kimlik No</label>
                        <input
                          type="text"
                          id="tcKimlik"
                          value={customerInfo.tcKimlik}
                          onChange={(e) => setCustomerInfo({...customerInfo, tcKimlik: e.target.value})}
                          required
                          maxLength={11}
                          className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm text-lg border-gray-300 rounded-md px-4 py-3 h-14"
                        />
                      </div>
                      <div>
                        <label htmlFor="telefon" className="block text-base font-medium text-gray-700">Telefon</label>
                        <input
                          type="tel"
                          id="telefon"
                          value={customerInfo.telefon}
                          onChange={(e) => setCustomerInfo({...customerInfo, telefon: e.target.value})}
                          required
                          className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm text-lg border-gray-300 rounded-md px-4 py-3 h-14"
                        />
                      </div>
                      <div className="flex justify-end space-x-3 mt-8">
                        <button
                          type="button"
                          onClick={() => setShowSaleForm(false)}
                          className="py-3 px-6 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
          
          {searchResult === null && searchTerm && !loading && searchAttempted && (
            <div className="bg-yellow-50 p-4 rounded-md mt-6">
              <p className="text-yellow-700">Aradığınız ürün bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 