import React from 'react';
import { LegalLayout } from './LegalLayout';

export const PrivacyPolicy: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <LegalLayout title="Kebijakan Privasi" lastUpdated="28 Januari 2026" onBack={onBack}>
    <p>Kami menghargai privasi Anda. Berikut adalah cara kami menangani data Anda:</p>
    <h3>1. Data yang Dikumpulkan</h3>
    <ul className="list-disc pl-5 space-y-2">
      <li><strong>Akun:</strong> Email & Nama via Supabase Auth (Enkripsi tingkat tinggi).</li>
      <li><strong>Chat:</strong> Riwayat percakapan disimpan untuk memberi konteks pada AI (Memory).</li>
      <li><strong>Gambar:</strong> Screenshot diproses sementara oleh Llama 4 Vision dan disimpan di bucket privat.</li>
    </ul>
    <h3>2. Penggunaan Data</h3>
    <p>Data digunakan hanya untuk menyediakan layanan coding assistant, personalisasi respon, dan transaksi kredit. Kami tidak menjual data Anda ke pihak ketiga.</p>
    <h3>3. Keamanan</h3>
    <p>Seluruh transmisi data menggunakan protokol SSL/TLS. Database dilindungi oleh RLS (Row Level Security).</p>
  </LegalLayout>
);