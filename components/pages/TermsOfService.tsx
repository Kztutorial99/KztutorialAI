import React from 'react';
import { LegalLayout } from './LegalLayout';

export const TermsOfService: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <LegalLayout title="Persyaratan Layanan" lastUpdated="28 Januari 2026" onBack={onBack}>
    <p>Dengan menggunakan aplikasi ini, Anda setuju bahwa:</p>
    <h3>1. Disclaimer AI</h3>
    <p>Kode yang dihasilkan AI mungkin mengandung bug atau kesalahan logika (Hallucination). Anda wajib mengecek dan menguji kode tersebut sebelum digunakan di lingkungan production.</p>
    <h3>2. Pembayaran & Kredit</h3>
    <p>Kredit yang dibeli bersifat final (non-refundable). Penyalahgunaan bukti transfer (spam/fake) akan mengakibatkan pemblokiran akun secara permanen.</p>
    <h3>3. Penggunaan yang Dilarang</h3>
    <p>Dilarang menggunakan AI untuk membuat malware, phishing, atau konten ilegal lainnya.</p>
  </LegalLayout>
);