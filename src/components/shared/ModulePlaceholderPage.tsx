import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Hammer,
  ArrowLeft,
  LayoutDashboard,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export interface ModulePlaceholderProps {
  moduleName: string;
  category: string;
  plannedStage: string;
  description: string;
  plannedFeatures: string[];
  icon: React.ComponentType<{ className?: string }>;
}

export const ModulePlaceholderPage: React.FC<ModulePlaceholderProps> = ({
  moduleName,
  category,
  plannedStage,
  description,
  plannedFeatures,
  icon: Icon,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-2">
        <Link
          to="/app/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-movi-graphite transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>
        <Badge variant="yellow" size="md">
          {plannedStage}
        </Badge>
      </div>

      <Card className="border-border overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-movi-yellow via-yellow-400 to-movi-graphite" />
        <CardContent className="p-6 sm:p-10 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 rounded-2xl bg-movi-yellow/20 border border-movi-yellow/40 flex items-center justify-center text-movi-graphite shrink-0 shadow-subtle">
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-surface-secondary text-text-secondary text-[11px] font-semibold uppercase tracking-wider mb-1">
                <span>{category}</span>
                <span>&bull;</span>
                <span className="text-movi-graphite">Arquitetura Estruturada</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-movi-graphite tracking-tight">
                {moduleName}
              </h2>
              <p className="text-sm text-text-secondary mt-1 leading-relaxed max-w-2xl">
                {description}
              </p>
            </div>
          </div>

          {/* Status Real sem Dados Falsos */}
          <div className="p-4 rounded-xl bg-surface-secondary/70 border border-border flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white border border-border text-movi-graphite shrink-0 mt-0.5">
              <Hammer className="w-4 h-4 text-movi-graphite" />
            </div>
            <div className="text-xs text-text-secondary leading-relaxed">
              <strong className="text-movi-graphite block text-sm font-semibold mb-0.5">
                Módulo em Engenharia Ativa
              </strong>
              A fundação da empresa, segurança multi-tenant (RLS) e persistência de dados já estão preparadas para este módulo. As telas operacionais e integrações transacionais serão disponibilizadas na próxima entrega sem dados fictícios.
            </div>
          </div>

          {/* O que fará parte deste módulo */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-movi-graphite uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-movi-yellow" />
              Recursos planejados para este módulo
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {plannedFeatures.map((feat) => (
                <div
                  key={feat}
                  className="p-3 rounded-xl border border-border bg-white flex items-center gap-2.5 text-xs text-movi-graphite font-medium shadow-subtle"
                >
                  <CheckCircle2 className="w-4 h-4 text-movi-yellow shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé e CTA */}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Calendar className="w-4 h-4 text-text-muted" />
              <span>Cronograma: Próxima Etapa de Desenvolvimento</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link to="/app/dashboard" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  leftIcon={<LayoutDashboard className="w-4 h-4" />}
                >
                  Ir para o Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
