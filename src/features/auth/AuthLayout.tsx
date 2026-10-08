import React from 'react';
import { MoviLogo } from '@/components/brand/MoviLogo';
import { ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* 
        Lado Esquerdo — Painel de Marca Desktop 
        Fundo Amarelo MOVI (#FFD600) com grafite (#111111) e detalhes geométricos
      */}
      <div className="hidden lg:flex lg:w-1/2 bg-movi-yellow p-12 xl:p-16 flex-col justify-between relative overflow-hidden select-none">
        {/* Formas geométricas sutis inspiradas no ritmo e no símbolo M */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-black/[0.04] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-white/[0.12] rounded-full blur-2xl pointer-events-none" />
        
        {/* Linhas geométricas discretas de movimento */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern id="diagonal-stripe" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="40" stroke="#111111" strokeWidth="1.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#diagonal-stripe)" />
        </svg>

        {/* Topo do painel */}
        <div className="relative z-10">
          <MoviLogo variant="full" theme="on-yellow" size="lg" />
        </div>

        {/* Conteúdo central */}
        <div className="relative z-10 max-w-lg my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-movi-graphite/10 text-movi-graphite text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-movi-graphite" />
            <span>Gestão Comercial Inteligente</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold font-display text-movi-graphite tracking-tight leading-[1.15]">
            Seu negócio em movimento.
          </h1>

          <p className="mt-5 text-base xl:text-lg text-movi-graphite/85 font-sans leading-relaxed">
            Vendas, estoque, clientes e gestão em um só lugar. Simples para começar. Inteligente para crescer.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 pt-8 border-t border-movi-graphite/15">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-movi-graphite/10 text-movi-graphite">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold font-display text-movi-graphite">Mais Resultados</h4>
                <p className="text-xs text-movi-graphite/75 mt-0.5">Controle real e sem burocracia</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-movi-graphite/10 text-movi-graphite">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold font-display text-movi-graphite">Segurança SaaS</h4>
                <p className="text-xs text-movi-graphite/75 mt-0.5">Seus dados blindados na nuvem</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do painel */}
        <div className="relative z-10 flex items-center justify-between text-xs text-movi-graphite/70 font-medium">
          <span>MOVI Platform &copy; {new Date().getFullYear()}</span>
          <span>Plano Free Premium Disponível</span>
        </div>
      </div>

      {/* 
        Lado Direito — Formulário Centralizado
        Fundo Branco, espaçoso, tipografia e campos limpos
      */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 xl:p-16 bg-surface min-h-screen lg:min-h-0 overflow-y-auto">
        {/* Header Mobile com Logo */}
        <div className="flex lg:hidden items-center justify-between mb-8 pb-4 border-b border-border">
          <MoviLogo variant="horizontal" theme="graphite" size="md" />
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-movi-yellow text-movi-graphite">
            Free
          </span>
        </div>

        {/* Área Central do Formulário */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-movi-graphite tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {children}
        </div>

        {/* Rodapé Mobile / Direitos */}
        <div className="mt-8 pt-4 border-t border-border/60 text-center text-xs text-text-secondary">
          Protegido por criptografia de ponta a ponta &bull; MOVI Brasil
        </div>
      </div>
    </div>
  );
};
