import React from 'react';
import { MoviSymbol, type MoviSymbolProps } from './MoviSymbol';

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
  // Dimension definitions
  const dimensions = {
    sm: { symbol: 24, text: 'text-lg', tag: 'text-[9px]' },
    md: { symbol: 32, text: 'text-2xl', tag: 'text-[11px]' },
    lg: { symbol: 40, text: 'text-3xl', tag: 'text-xs' },
    xl: { symbol: 52, text: 'text-4xl', tag: 'text-sm' },
  }[size];

  // Theme text colors
  const textColors = {
    graphite: 'text-movi-graphite',
    white: 'text-white',
    'on-yellow': 'text-movi-graphite',
    yellow: 'text-movi-yellow',
  }[theme];

  const tagColors = {
    graphite: 'text-text-secondary',
    white: 'text-gray-400',
    'on-yellow': 'text-movi-graphite/80',
    yellow: 'text-movi-yellow/80',
  }[theme];

  const symbolTheme: MoviSymbolProps['theme'] = 
    theme === 'white' ? 'white' :
    theme === 'on-yellow' ? 'on-yellow' : 'yellow';

  if (variant === 'symbol') {
    return <MoviSymbol size={dimensions.symbol} theme={symbolTheme} className={className} />;
  }

  const isFull = variant === 'full' || showTagline;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <MoviSymbol size={dimensions.symbol} theme={symbolTheme} />
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline tracking-tight">
          <span className={`font-display font-extrabold tracking-wider uppercase ${dimensions.text} ${textColors}`}>
            MOVI
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-movi-yellow ml-1 mb-0.5 inline-block shrink-0" />
        </div>
        {isFull && (
          <span className={`font-sans font-medium tracking-normal mt-1 uppercase ${dimensions.tag} ${tagColors}`}>
            Gestão Comercial Inteligente
          </span>
        )}
      </div>
    </div>
  );
};

export default MoviLogo;
