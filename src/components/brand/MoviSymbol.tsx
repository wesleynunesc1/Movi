import React from 'react';

export interface MoviSymbolProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  theme?: 'yellow' | 'graphite' | 'white' | 'on-yellow';
  className?: string;
}

export const MoviSymbol: React.FC<MoviSymbolProps> = ({
  size = 32,
  theme = 'yellow',
  className = '',
  ...props
}) => {
  // Color configuration according to MOVI manual
  let primaryColor = '#FFD600'; // Amarelo MOVI
  let secondaryColor = '#111111'; // Grafite

  if (theme === 'graphite') {
    primaryColor = '#111111';
    secondaryColor = '#333333';
  } else if (theme === 'white') {
    primaryColor = '#FFFFFF';
    secondaryColor = '#E7E7E7';
  } else if (theme === 'on-yellow') {
    primaryColor = '#111111';
    secondaryColor = '#1F1F1F';
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Símbolo MOVI"
      role="img"
      {...props}
    >
      {/* 
        Símbolo MOVI: Construção geométrica da letra M com curvas dinâmicas 
        e diagonais sobrepostas representando movimento contínuo e gestão inteligente.
      */}
      <g>
        {/* Haste esquerda com curva de entrada fluida */}
        <path
          d="M7 32V14.5C7 10.91 9.91 8 13.5 8C15.65 8 17.58 9.05 18.78 10.66L20 12.3L21.22 10.66C22.42 9.05 24.35 8 26.5 8C30.09 8 33 10.91 33 14.5V32"
          stroke={primaryColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Diagonais sobrepostas de aceleração e movimento comercial */}
        <path
          d="M13.5 17.5L20 26.5L26.5 17.5"
          stroke={theme === 'yellow' ? secondaryColor : primaryColor}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={theme === 'yellow' ? 0.9 : 0.8}
        />

        {/* Ponto focal de convergência e resultado */}
        <circle
          cx="20"
          cy="31.5"
          r="2.2"
          fill={primaryColor}
        />
      </g>
    </svg>
  );
};

export default MoviSymbol;
