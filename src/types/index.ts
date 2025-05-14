export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role?: 'admin' | 'user';
}

export interface Product {
  id?: string;
  stok_kodu: string;
  urun_adi: string;
  stok_miktari: number;
  urun_markasi: string;
  urun_aciklamasi: string;
  urun_resmi_url?: string;
  barkod_kodu?: string;
  qr_kodu?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prescription {
  id?: string;
  userId: string;
  products: {
    productId: string;
    quantity: number;
  }[];
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
} 