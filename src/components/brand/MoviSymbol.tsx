import React from 'react';

export interface MoviSymbolProps {
  size?: number | string;
  theme?: 'yellow' | 'graphite' | 'white' | 'on-yellow';
  className?: string;
}

export const MoviSymbol: React.FC<MoviSymbolProps> = ({
  size = 32,
  className = '',
}) => {
  const pixelSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 32;

  return (
    <img
      src="/brand/favicon.png"
      alt="Símbolo Oficial MOVI"
      width={pixelSize}
      height={pixelSize}
      style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
      className={`object-contain shrink-0 select-none ${className}`}
    />
  );
};

export default MoviSymbol;
