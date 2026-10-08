import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, X, Star, Image as ImageIcon, AlertCircle } from 'lucide-react';
import type { ProductImage } from '@/types/products';

interface ProductImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 5,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setErrorMsg(`Você pode adicionar no máximo ${maxImages} fotos por produto.`);
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const newImgs: ProductImage[] = [...images];

    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        setErrorMsg('Formato inválido. Use apenas JPEG, PNG ou WebP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('A foto deve ter no máximo 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        const newImg: ProductImage = {
          id: 'img_' + Math.random().toString(36).substring(2, 9),
          company_id: '',
          product_id: '',
          storage_path: base64,
          sort_order: newImgs.length,
          is_primary: newImgs.length === 0,
          created_at: new Date().toISOString(),
        };
        newImgs.push(newImg);
        onChange([...newImgs]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (id: string) => {
    const remaining = images.filter((img) => img.id !== id);
    if (remaining.length > 0 && !remaining.some((img) => img.is_primary)) {
      remaining[0].is_primary = true;
    }
    onChange(remaining);
  };

  const handleSetPrimary = (id: string) => {
    const updated = images.map((img) => ({
      ...img,
      is_primary: img.id === id,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-movi-graphite">
          Galeria de Fotos ({images.length}/{maxImages})
        </label>
        <span className="text-[11px] text-text-secondary">
          Até 5MB &bull; JPEG, PNG ou WebP
        </span>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-status-danger-bg text-status-danger text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {images.map((img) => (
          <div
            key={img.id}
            className={`relative group aspect-square rounded-xl border overflow-hidden bg-surface-secondary flex items-center justify-center ${
              img.is_primary ? 'border-movi-yellow ring-2 ring-movi-yellow/50' : 'border-border'
            }`}
          >
            <img
              src={img.storage_path}
              alt="Foto do produto"
              className="w-full h-full object-cover"
            />

            {/* Badges and actions overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleSetPrimary(img.id)}
                  title={img.is_primary ? 'Foto principal' : 'Tornar foto principal'}
                  className={`p-1 rounded-lg ${
                    img.is_primary
                      ? 'bg-movi-yellow text-movi-graphite'
                      : 'bg-white/80 text-movi-graphite hover:bg-white'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(img.id)}
                  title="Remover foto"
                  className="p-1 rounded-lg bg-status-danger text-white hover:bg-red-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {img.is_primary && (
                <span className="text-[9px] bg-movi-yellow text-movi-graphite font-bold px-1.5 py-0.5 rounded text-center">
                  Principal
                </span>
              )}
            </div>

            {img.is_primary && (
              <div className="absolute bottom-1 left-1 bg-movi-yellow text-movi-graphite font-bold text-[9px] px-1.5 py-0.2 rounded shadow-subtle group-hover:hidden">
                Capa
              </div>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border border-dashed border-border hover:border-movi-graphite/60 bg-surface hover:bg-surface-secondary/50 flex flex-col items-center justify-center gap-1.5 transition-all text-text-secondary hover:text-movi-graphite p-3"
          >
            <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center">
              <Upload className="w-4 h-4 text-movi-graphite" />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">
              + Adicionar Foto
            </span>
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
      />
    </div>
  );
};
