import React, { useRef, useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  previewImage: string | null; // Controlled by parent
  onImageSelected: (base64: string) => void;
  onClear: () => void;
  isLoading: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ previewImage, onImageSelected, onClear, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // --- HELPER: FUNGSI KOMPRESI GAMBAR ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Resize ke lebar max 800px
          const scaleSize = MAX_WIDTH / img.width;
          
          canvas.width = scaleSize < 1 ? MAX_WIDTH : img.width;
          canvas.height = scaleSize < 1 ? img.height * scaleSize : img.height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Convert ke Base64 (JPEG quality 0.7)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);

    try {
      const compressedBase64 = await compressImage(file);
      onImageSelected(compressedBase64);
    } catch (err) {
      console.error(err);
      alert("Gagal memproses gambar. Silakan coba gambar lain.");
    } finally {
      setIsCompressing(false);
      // Reset input agar bisa pilih file yang sama
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      {previewImage ? (
        <div className="relative group inline-block mr-2 animate-in zoom-in duration-300">
          <img 
            src={previewImage} 
            alt="Preview" 
            className="h-10 w-10 object-cover rounded-lg border border-purple-500/50 shadow-lg shadow-purple-900/20" 
          />
          <button 
            type="button"
            onClick={onClear}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors active:scale-90"
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
            disabled={isLoading || isCompressing}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isCompressing}
            className={`p-2.5 rounded-lg transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${isCompressing ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700/50 text-slate-400 hover:text-purple-400 hover:bg-slate-700'}`}
            title="Upload Screenshot (Mata Dewa)"
          >
            {isCompressing ? <Loader2 size={18} className="animate-spin text-purple-400"/> : <Camera size={18} />}
          </button>
        </>
      )}
    </div>
  );
};