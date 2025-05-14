'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface SaleRecord {
  id: string;
  urunId: string;
  urunAdi: string;
  stokKodu: string;
  barkodKodu: string;
  urunResimUrl?: string; // Ürün resmi URL'si (opsiyonel)
  musteriAdSoyad: string;
  musteriTC: string;
  musteriTelefon: string;
  satisTarihi: any;
  satisYapan: string;
}

export default function SalesListPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [filteredSales, setFilteredSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const salesRef = collection(db, 'satislar');
        const q = query(salesRef, orderBy('satisTarihi', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const salesData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            urunId: data.urunId || '',
            urunAdi: data.urunAdi || '',
            stokKodu: data.stokKodu || '',
            barkodKodu: data.barkodKodu || '',
            urunResimUrl: data.urunResimUrl || '',
            musteriAdSoyad: data.musteriAdSoyad || '',
            musteriTC: data.musteriTC || '',
            musteriTelefon: data.musteriTelefon || '',
            satisTarihi: data.satisTarihi,
            satisYapan: data.satisYapan || '',
          } as SaleRecord;
        });

        setSales(salesData);
        setFilteredSales(salesData);
      } catch (error) {
        console.error('Satış kayıtları yüklenirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  // İstatistik verileri
  const salesStatistics = useMemo(() => {
    if (!sales.length) return null;

    // Ürün bazında istatistikler
    const productStats = sales.reduce((acc: Record<string, number>, sale) => {
      const productName = sale.urunAdi;
      acc[productName] = (acc[productName] || 0) + 1;
      return acc;
    }, {});

    // En çok satılan 5 ürün
    const topProducts = Object.entries(productStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Zaman bazlı istatistikler
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    // Son 7 gün için günlük satışlar
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * oneDay);
      return date.toLocaleDateString('tr-TR', { weekday: 'short', day: '2-digit' });
    });

    const dailySales = last7Days.map(dayLabel => {
      return sales.filter(sale => {
        if (!sale.satisTarihi) return false;
        const saleDate = new Date(sale.satisTarihi.seconds * 1000);
        const saleDay = saleDate.toLocaleDateString('tr-TR', { weekday: 'short', day: '2-digit' });
        return saleDay === dayLabel;
      }).length;
    });

    // Son 6 ay için aylık satışlar 
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return date.toLocaleDateString('tr-TR', { month: 'short' });
    });

    const monthlySales = last6Months.map(monthLabel => {
      return sales.filter(sale => {
        if (!sale.satisTarihi) return false;
        const saleDate = new Date(sale.satisTarihi.seconds * 1000);
        const saleMonth = saleDate.toLocaleDateString('tr-TR', { month: 'short' });
        return saleMonth === monthLabel;
      }).length;
    });

    return {
      topProducts: {
        labels: topProducts.map(([name]) => name),
        datasets: [
          {
            label: 'Satış Adedi',
            data: topProducts.map(([_, count]) => count),
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      dailySales: {
        labels: last7Days,
        datasets: [
          {
            label: 'Günlük Satışlar',
            data: dailySales,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      },
      monthlySales: {
        labels: last6Months,
        datasets: [
          {
            label: 'Aylık Satışlar',
            data: monthlySales,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      },
    };
  }, [sales]);

  useEffect(() => {
    const filtered = sales.filter(sale => {
      const searchLower = searchTerm.toLowerCase();
      return (
        sale.urunAdi.toLowerCase().includes(searchLower) ||
        sale.stokKodu.toLowerCase().includes(searchLower) ||
        sale.barkodKodu.toLowerCase().includes(searchLower) ||
        sale.musteriAdSoyad.toLowerCase().includes(searchLower) ||
        sale.musteriTC.includes(searchTerm)
      );
    });
    setFilteredSales(filtered);
  }, [searchTerm, sales]);

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
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Teslim Edilen Ürünler</h1>
              <p className="text-sm text-gray-600 mt-1">Toplam {sales.length} işlem bulunmaktadır.</p>
            </div>
            <Link
              href="/dashboard/prescriptions"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Yeni Teslim İşlemi
            </Link>
          </div>

          {salesStatistics && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Satış İstatistikleri</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">En Çok Satılan Ürünler</h3>
                  <div className="h-64">
                    <Pie 
                      data={salesStatistics.topProducts} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Son 7 Günün Satışları</h3>
                  <div className="h-64">
                    <Bar
                      data={salesStatistics.dailySales}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          title: {
                            display: true,
                            text: 'Günlük Satış Adedi',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Son 6 Ayın Satışları</h3>
                  <div className="h-64">
                    <Line
                      data={salesStatistics.monthlySales}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ürün adı, stok kodu, barkod, müşteri adı veya TC ile arama yapın..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün Bilgileri
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri Bilgileri
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teslim Tarihi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <motion.tr 
                    key={sale.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {sale.urunResimUrl && (
                          <div className="flex-shrink-0 h-16 w-16 mr-4">
                            <img
                              src={sale.urunResimUrl}
                              alt={sale.urunAdi}
                              className="h-16 w-16 object-cover rounded-md"
                            />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{sale.urunAdi}</div>
                          <div className="text-sm text-gray-500">Stok Kodu: {sale.stokKodu}</div>
                          <div className="text-sm text-gray-500">Barkod: {sale.barkodKodu}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sale.musteriAdSoyad}</div>
                      <div className="text-sm text-gray-500">TC: {sale.musteriTC}</div>
                      <div className="text-sm text-gray-500">Tel: {sale.musteriTelefon}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.satisTarihi ? new Date(sale.satisTarihi.seconds * 1000).toLocaleString('tr-TR') : 'Belirtilmemiş'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 