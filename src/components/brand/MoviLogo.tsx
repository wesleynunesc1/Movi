import React from 'react';
import { MoviSymbol } from './MoviSymbol';

export interface MoviLogoProps {
  variant?: 'full' | 'horizontal' | 'symbol';
  theme?: 'graphite' | 'white' | 'on-yellow' | 'yellow';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

export const MoviLogo: React.FC<MoviLogoProps> = ({
  variant = 'horizontal',
  theme = 'graphite',
  size = 'md',
  className = '',
  showTagline,
}) => {
  if (variant === 'symbol') {
    const symbolSizes = {
      sm: 24,
      md: 32,
      lg: 42,
      xl: 56,
    }[size];
    return <MoviSymbol size={symbolSizes} className={className} />;
  }

  // Se o tema for branco (para a sidebar escura #111111)
  if (theme === 'white') {
    const textSizes = {
      sm: 'text-base',
      md: 'text-xl',
      lg: 'text-2xl',
      xl: 'text-3xl',
    }[size];

    const symbolSizes = {
      sm: 24,
      md: 32,
      lg: 40,
      xl: 52,
    }[size];

    const isFull = variant === 'full' || showTagline;

    return (
      <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
        <MoviSymbol size={symbolSizes} />
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className={`font-display font-black tracking-wide text-white uppercase ${textSizes}`}>
              MOVI
            </span>
            <span className="text-[9px] text-gray-400 font-bold">&reg;</span>
          </div>
          {isFull && (
            <span className="text-[9px] font-sans font-medium text-gray-400 uppercase tracking-tight mt-0.5">
              gestão comercial inteligente
            </span>
          )}
        </div>
      </div>
    );
  }

  // Para temas em fundos claros ou amarelo (Login, Onboarding, Header, etc.):
  // Renderiza diretamente a logomarca oficial v1.png
  const heightClasses = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12',
    xl: 'h-16',
  }[size];

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/brand/logo.png"
        alt="MOVI — Gestão Comercial Inteligente"
        className={`${heightClasses} w-auto object-contain shrink-0`}
        loading="eager"
      />
    </div>
  );
};

export default MoviLogo;
