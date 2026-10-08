import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/app/providers/AuthProvider';
import { inventoryService } from '@/services/inventoryService';
import type { MovementType } from '@/types/inventory';
import type { Product, ProductVariant } from '@/types/products';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
  variant?: ProductVariant | null;
  mode: 'entry' | 'exit' | 'adjustment';
}

const ENTRY_REASON_OPTIONS = ['Compra', 'Reposição', 'Devolução', 'Ajuste', 'Outros'];
const EXIT_REASON_OPTIONS = ['Perda', 'Avaria', 'Uso interno', 'Devolução ao fornecedor', 'Ajuste', 'Outros'];
const ADJUSTMENT_REASON_OPTIONS = ['Inventário / Contagem periódica', 'Correção de divergência', 'Outros'];

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product,
  variant,
  mode,
}) => {
  const { currentCompany } = useAuth();
  const companyId = currentCompany?.id || 'default_company';

  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Definir opções padrão ao abrir ou mudar de modo
  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setNotes('');
      setError(null);
      if (mode === 'entry') setReason(ENTRY_REASON_OPTIONS[0]);
      else if (mode === 'exit') setReason(EXIT_REASON_OPTIONS[0]);
      else setReason(ADJUSTMENT_REASON_OPTIONS[0]);
    }
  }, [isOpen, mode]);

  if (!isOpen || !product) return null;

  const currentQty = Number(
    variant ? variant.quantity_on_hand ?? product.quantity_on_hand : product.quantity_on_hand
  ) || 0;

  // Cálculos prévios
  const numQty = Number(quantity) || 0;
  let simulatedQtyAfter = currentQty;
  let delta = 0;

  if (mode === 'entry') {
    simulatedQtyAfter = currentQty + numQty;
    delta = numQty;
  } else if (mode === 'exit') {
    simulatedQtyAfter = currentQty - numQty;
    delta = -numQty;
  } else if (mode === 'adjustment') {
    simulatedQtyAfter = Math.max(0, numQty);
    delta = simulatedQtyAfter - currentQty;
  }

  const isExitExceeding = mode === 'exit' && numQty > currentQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (quantity === '' || (mode !== 'adjustment' && numQty <= 0)) {
      setError('Informe uma quantidade válida maior que zero.');
      return;
    }

    if (mode === 'adjustment' && numQty < 0) {
      setError('A quantidade ajustada não pode ser negativa.');
      return;
    }

    if (isExitExceeding) {
      setError(`Estoque insuficiente! Saldo atual é de ${currentQty} ${product.unit}, não é possível retirar ${numQty}.`);
      return;
    }

    setLoading(true);
    try {
      await inventoryService.recordMovement({
        company_id: companyId,
        product_id: product.id,
        variant_id: variant ? variant.id : null,
        movement_type: mode as MovementType,
        quantity: numQty,
        reason,
        notes: notes.trim() || null,
        minimum_quantity: variant ? variant.minimum_quantity : product.minimum_quantity,
        idempotency_key: `${product.id}_${Date.now()}_${Math.random()}`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar movimentação.');
    } finally {
      setLoading(false);
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'entry':
        return 'Adicionar Estoque (Entrada)';
      case 'exit':
        return 'Retirar Estoque (Saída)';
      case 'adjustment':
        return 'Ajuste de Estoque por Contagem';
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'entry':
        return <ArrowDownRight className="w-5 h-5 text-emerald-600" />;
      case 'exit':
        return <ArrowUpRight className="w-5 h-5 text-rose-600" />;
      case 'adjustment':
        return <Scale className="w-5 h-5 text-[#111111]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#E7E7E7] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E7E7]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-100 flex items-center justify-center">
              {getModeIcon()}
            </div>
            <div>
              <h2 className="text-base font-bold font-['Poppins'] text-[#111111]">
                {getModeTitle()}
              </h2>
              <p className="text-xs text-neutral-500 font-['Inter']">
                {product.name} {variant ? `(${variant.combination_key})` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto font-['Inter']">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Card Resumo de Saldo */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-center">
            <div>
              <span className="text-[11px] text-neutral-500 block">Saldo Atual</span>
              <span className="text-base font-bold text-neutral-800 font-mono">
                {currentQty} {product.unit}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-500 block">
                {mode === 'adjustment' ? 'Diferença' : 'Operação'}
              </span>
              <span
                className={`text-base font-bold font-mono ${
                  delta > 0
                    ? 'text-emerald-600'
                    : delta < 0
                    ? 'text-rose-600'
                    : 'text-neutral-500'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta} {product.unit}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-500 block">Saldo Final</span>
              <span
                className={`text-base font-bold font-mono ${
                  isExitExceeding ? 'text-rose-600' : 'text-[#111111]'
                }`}
              >
                {simulatedQtyAfter} {product.unit}
              </span>
            </div>
          </div>

          {/* Campo Quantidade */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              {mode === 'adjustment'
                ? 'Quantidade Física Encontrada na Contagem *'
                : `Quantidade a ${mode === 'entry' ? 'Adicionar' : 'Retirar'} (${product.unit}) *`}
            </label>
            <input
              type="number"
              step="any"
              min={0}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={mode === 'adjustment' ? `Ex: ${currentQty}` : '0'}
              className={`w-full px-3 py-2 text-sm bg-neutral-50 border rounded-lg focus:outline-none transition font-mono ${
                isExitExceeding
                  ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                  : 'border-neutral-200 focus:border-[#FFD600]'
              }`}
            />
            {isExitExceeding && (
              <p className="text-xs text-rose-600 mt-1">
                Saldo insuficiente. Você possui apenas {currentQty} unidades.
              </p>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Motivo da Operação *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#FFD600]"
            >
              {(mode === 'entry'
                ? ENTRY_REASON_OPTIONS
                : mode === 'exit'
                ? EXIT_REASON_OPTIONS
                : ADJUSTMENT_REASON_OPTIONS
              ).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Observações / Justificativa (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Nota fiscal nº 1234, lote 55..."
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#FFD600]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E7E7]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="text-xs border-neutral-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || isExitExceeding || quantity === ''}
              className={`text-xs font-semibold border-none ${
                mode === 'entry'
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : mode === 'exit'
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-[#FFD600] text-[#111111] hover:bg-[#e6c100]'
              }`}
            >
              {loading ? 'Salvando...' : 'Confirmar e Registrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
