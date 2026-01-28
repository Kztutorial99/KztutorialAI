import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Mail, MessageCircle, ExternalLink } from 'lucide-react';
import { LegalLayout } from './LegalLayout';

export const HelpCenter: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Bagaimana cara Top Up Kredit?",
      a: "Masuk ke menu Pengaturan > Klik 'Top Up Kredit' > Pilih Paket > Transfer ke rekening yang tertera > Upload Bukti Transfer. Admin akan memverifikasi dalam 10-30 menit."
    },
    {
      q: "Kenapa respon AI kadang lambat?",
      a: "Kecepatan respon bergantung pada kompleksitas pertanyaan dan beban server AI kami. Jika Anda menggunakan 'Mode Analisis' (Model 70B), respon memang butuh waktu lebih lama dibanding chat biasa demi akurasi tinggi."
    },
    {
      q: "Cara menggunakan fitur Analisis Image?",
      a: "Klik ikon 'Clip/Gambar' di samping kolom chat > Pilih Screenshot Error/Codingan > Tulis pertanyaan Anda > Kirim. AI akan menganalisis visual gambar tersebut secara mendalam."
    },
    {
      q: "Apakah kode saya aman?",
      a: "Sangat aman. Kami menggunakan enkripsi RLS (Row Level Security) di database. Hanya Anda yang bisa melihat riwayat chat dan kode Anda."
    },
    {
      q: "Bagaimana cara reset password?",
      a: "Jika lupa password: Buka menu Login > Klik teks 'Lupa Password?' di pojok kanan bawah > Masukkan Email akun Anda > Klik tombol 'Kirim Reset Link'. Cek inbox/spam email Anda untuk membuat password baru."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <LegalLayout title="Pusat Bantuan" onBack={onBack}>
      
      {/* Contact Card */}
      <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-2xl mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
        <div className="p-3 bg-blue-500/20 rounded-full text-blue-400 shrink-0">
          <Mail size={24} />
        </div>
        <div>
          <h2 className="font-bold text-lg text-white mb-1">Butuh bantuan cepat?</h2>
          <p className="text-sm text-slate-400 mb-2 leading-relaxed">
            Hubungi kami langsung via email untuk respon prioritas.
          </p>
          <a 
            href="mailto:pangkeyjulio2@gmail.com" 
            className="inline-flex items-center gap-2 text-blue-400 font-mono font-medium hover:underline bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-800 hover:bg-blue-800/50 transition-colors"
          >
            pangkeyjulio2@gmail.com
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <h3 className="text-xl font-bold text-white mb-4 animate-in fade-in slide-in-from-bottom-3 delay-100">FAQ Populer</h3>
      <div className="space-y-3 mb-10 animate-in fade-in slide-in-from-bottom-4 delay-200">
        {faqs.map((item, index) => (
          <div 
            key={index} 
            className="border border-slate-700/60 rounded-xl overflow-hidden bg-slate-800/40 transition-all duration-200 hover:border-slate-600 hover:bg-slate-800/60"
          >
            <button 
              onClick={() => toggleFaq(index)}
              className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
            >
              <span className="font-medium text-slate-200">{item.q}</span>
              {openFaqIndex === index ? (
                <ChevronDown size={20} className="text-blue-500" />
              ) : (
                <ChevronRight size={20} className="text-slate-500" />
              )}
            </button>
            
            {/* Jawaban dengan Animasi Slide */}
            {openFaqIndex === index && (
              <div className="p-4 pt-0 text-sm text-slate-400 border-t border-slate-700/50 bg-slate-900/30 leading-relaxed animate-in slide-in-from-top-1 fade-in duration-200">
                <div className="pt-3">{item.a}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Community Section */}
      <h3 className="text-xl font-bold text-white mb-4 animate-in fade-in slide-in-from-bottom-5 delay-300">Komunitas</h3>
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl group cursor-pointer hover:scale-[1.01] transition-transform border border-white/10 animate-in fade-in slide-in-from-bottom-6 delay-300">
        
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -ml-5 -mb-5 pointer-events-none"></div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-inner">
               <MessageCircle size={28} className="text-indigo-200" />
            </div>
            <div>
              <h4 className="text-lg font-bold mb-1">Gabung Discord Kami</h4>
              <p className="text-indigo-200 text-sm">Diskusi coding dengan member lain.</p>
            </div>
          </div>
          <ExternalLink size={20} className="text-indigo-300 group-hover:text-white transition-colors" />
        </div>
      </div>

    </LegalLayout>
  );
};