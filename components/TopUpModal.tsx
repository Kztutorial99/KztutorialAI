import React, { useState } from 'react';
import { X, CreditCard, Upload, Check, Loader2, Globe, Wallet } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 💰 KONFIGURASI HARGA (Sesuai Request)
const PACKAGES = [
  { 
    id: 'starter',
    credits: 30, 
    priceIDR: 25000, 
    priceUSD: 2.49,
    label: 'Starter', 
    desc: 'Cukup untuk pemula' 
  },
  { 
    id: 'pro',
    credits: 100, 
    priceIDR: 70000, 
    priceUSD: 6.49,
    label: 'Pro (Hemat)', 
    desc: 'Paling laris (Best Value)',
    popular: true 
  },
  { 
    id: 'expert',
    credits: 300, 
    priceIDR: 180000, 
    priceUSD: 16.99,
    label: 'Expert', 
    desc: 'Untuk power user' 
  },
  { 
    id: 'ultra',
    credits: 700, 
    priceIDR: 350000, 
    priceUSD: 32.99,
    label: 'Ultra', 
    desc: 'Kapasitas maksimal' 
  },
];

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose }) => {
  const { session } = useAuth();
  
  // State Steps & Data
  const [step, setStep] = useState(1); // 1: Pilih Paket, 2: Bayar
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  
  // State Currency & Method
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // URL QRIS ANDA
  const QRIS_URL = "https://gesoseeqaaixidsvrttz.supabase.co/storage/v1/object/public/QRIS_PAYMENT/qris.png";
  
  // PAYPAL CONFIG
  const PAYPAL_ME_LINK = "https://paypal.me/Kztutorial97"; // Ganti jika username beda

  if (!isOpen) return null;

  // --- HANDLER SUBMIT ---
  const handleUploadAndSubmit = async () => {
    if (!file || !selectedPkg || !session) return;
    setLoading(true);

    try {
      // 1. Upload Bukti
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(fileName);

      // 2. Simpan ke Database
      // Tentukan harga & metode berdasarkan currency yang dipilih
      const finalPrice = currency === 'IDR' ? selectedPkg.priceIDR : selectedPkg.priceUSD;
      const method = currency === 'IDR' ? 'QRIS' : 'PAYPAL';

      const { error: dbError } = await supabase
        .from('topup_requests')
        .insert({
          user_id: session.user.id,
          amount: selectedPkg.credits,
          price: finalPrice,
          payment_method: method,
          proof_url: publicUrl,
          status: 'pending',
          currency: currency // Kolom baru
        });

      if (dbError) throw dbError;

      alert("✅ Bukti terkirim! Admin akan memverifikasi secepatnya.");
      handleClose();
    } catch (err: any) {
      alert("Gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setFile(null);
    setCurrency('IDR');
  };

  const getPayPalLink = () => {
    if (!selectedPkg) return '#';
    // Format Link: paypal.me/username/2.49USD
    return `${PAYPAL_ME_LINK}/${selectedPkg.priceUSD}USD`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#18181b] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 bg-[#202023] flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard size={20} className="text-blue-400" />
            Top Up Kredit
          </h2>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {step === 1 ? (
            /* --- STEP 1: PILIH MATA UANG & PAKET --- */
            <div className="space-y-6">
              
              {/* Currency Toggle */}
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button 
                  onClick={() => setCurrency('IDR')}
                  className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${currency === 'IDR' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Wallet size={16} /> IDR (Lokal)
                </button>
                <button 
                  onClick={() => setCurrency('USD')}
                  className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${currency === 'USD' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Globe size={16} /> USD (Global)
                </button>
              </div>

              {/* Package List */}
              <div className="grid gap-3">
                {PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => { setSelectedPkg(pkg); setStep(2); }}
                    className="relative flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 rounded-xl transition-all group text-left"
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                        POPULAR
                      </span>
                    )}
                    <div>
                      <div className="font-bold text-white text-lg flex items-center gap-2">
                        {pkg.credits} Credits
                      </div>
                      <div className="text-xs text-slate-400">{pkg.desc}</div>
                    </div>
                    <div className="text-right">
                       <div className={`font-mono font-bold text-lg ${currency === 'USD' ? 'text-blue-400' : 'text-green-400'} group-hover:scale-105 transition-transform`}>
                         {currency === 'IDR' 
                           ? `Rp ${pkg.priceIDR.toLocaleString('id-ID')}` 
                           : `$${pkg.priceUSD}`
                         }
                       </div>
                       {currency === 'USD' && <div className="text-[10px] text-slate-500">via PayPal</div>}
                    </div>
                  </button>
                ))}
              </div>
              
              {currency === 'USD' && (
                <p className="text-xs text-center text-slate-500">
                  💳 PayPal tersedia untuk pembayaran internasional. <br/>Harga sudah termasuk biaya layanan.
                </p>
              )}
            </div>
          ) : (
            /* --- STEP 2: PEMBAYARAN --- */
            <div className="space-y-6">
              {/* Ringkasan */}
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                 <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Total Tagihan</p>
                 <p className={`text-3xl font-bold ${currency === 'USD' ? 'text-blue-400' : 'text-green-400'}`}>
                   {currency === 'IDR' 
                     ? `Rp ${selectedPkg.priceIDR.toLocaleString('id-ID')}` 
                     : `$${selectedPkg.priceUSD}`
                   }
                 </p>
                 <p className="text-sm text-slate-300 mt-2 font-medium bg-slate-900/50 inline-block px-3 py-1 rounded-full">
                   Paket: {selectedPkg.label} ({selectedPkg.credits} Credits)
                 </p>
              </div>

              {/* Area Pembayaran */}
              <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center min-h-[200px]">
                 {currency === 'IDR' ? (
                   <>
                     <img src={QRIS_URL} alt="Scan QRIS" className="w-48 h-auto object-contain mb-2" />
                     <p className="text-black text-xs font-bold mt-1">NMID: ID1026476486182</p>
                     <p className="text-gray-500 text-[10px]">Scan pakai GoPay/OVO/Dana/BCA</p>
                   </>
                 ) : (
                   <div className="py-4 text-center w-full">
                     <div className="w-16 h-16 bg-[#003087] rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl italic">P</div>
                     <p className="text-black font-bold mb-4">Bayar via PayPal</p>
                     
                     <a 
                       href={getPayPalLink()} 
                       target="_blank" 
                       rel="noreferrer"
                       className="block w-full bg-[#0070ba] hover:bg-[#003087] text-white font-bold py-3 rounded-full transition-colors mb-3"
                     >
                       Bayar Sekarang (${selectedPkg.priceUSD})
                     </a>
                     
                     <p className="text-gray-500 text-[10px] px-4">
                       Klik tombol di atas untuk membayar langsung. Setelah sukses, screenshot bukti pembayaran Anda.
                     </p>
                   </div>
                 )}
              </div>

              {/* Upload Bukti */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Upload Bukti Pembayaran <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label 
                    htmlFor="proof-upload"
                    className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file ? 'border-green-500/50 bg-green-500/10' : 'border-slate-600 hover:bg-slate-800'}`}
                  >
                    {file ? (
                      <div className="flex items-center gap-2 text-green-400 px-4">
                        <Check size={20} />
                        <span className="text-sm font-medium truncate">{file.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-500">
                        <Upload size={20} className="mb-2" />
                        <span className="text-xs">Klik untuk upload Screenshot</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium"
                >
                  Kembali
                </button>
                <button
                  onClick={handleUploadAndSubmit}
                  disabled={!file || loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Kirim Bukti'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};