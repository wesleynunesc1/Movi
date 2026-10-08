import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { CartItem, CheckoutPayment } from '@/types/pos';
import type { Customer, PaymentMethod, Sale } from '@/types/sales';
import { salesService } from '@/services/salesService';
import {
  Banknote,
  QrCode,
  CreditCard,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Receipt,
  User,
  ArrowRight,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  items: CartItem[];
  customer: Customer | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  onSaleCompleted: (sale: Sale) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  companyId,
  items,
  customer,
  subtotal,
  discountAmount,
  total,
  onSaleCompleted,
}) => {
  const [payments, setPayments] = useState<CheckoutPayment[]>([
    { method: 'money', amount: total, receivedAmount: total, changeAmount: 0 },
  ]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('money');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inicializar com o total quando abrir
  useEffect(() => {
    if (isOpen) {
      setPayments([{ method: 'money', amount: total, receivedAmount: total, changeAmount: 0 }]);
      setSelectedMethod('money');
      setNotes('');
      setErrorMsg(null);
    }
  }, [isOpen, total]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Soma dos pagamentos registrados
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const remainingAmount = Math.max(0, Math.round((total - totalPaid) * 100) / 100);
  const isFullyPaid = totalPaid >= total && total > 0;

  // Atualizar método único rápido
  const handleSelectQuickMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setPayments([
      {
        method,
        amount: total,
        receivedAmount: method === 'money' ? total : undefined,
        changeAmount: 0,
        installments: method === 'credit_card' ? 1 : undefined,
      },
    ]);
  };

  // Manipular dinheiro com troco
  const handleMoneyChange = (received: number) => {
    const change = Math.max(0, Math.round((received - total) * 100) / 100);
    setPayments([
      {
        method: 'money',
        amount: total,
        receivedAmount: received,
        changeAmount: change,
      },
    ]);
  };

  // Adicionar forma de pagamento mista
  const handleAddSplitPayment = (method: PaymentMethod) => {
    if (remainingAmount <= 0) return;
    setPayments((prev) => [
      ...prev,
      {
        method,
        amount: remainingAmount,
        receivedAmount: method === 'money' ? remainingAmount : undefined,
        changeAmount: 0,
        installments: method === 'credit_card' ? 1 : undefined,
      },
    ]);
  };

  const handleRemovePayment = (index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePaymentAmount = (index: number, newAmount: number) => {
    setPayments((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        return {
          ...p,
          amount: Math.max(0, newAmount),
        };
      })
    );
  };

  const handleFinalizeSale = async () => {
    if (!isFullyPaid) {
      setErrorMsg(`Pagamento insuficiente! Faltam ${formatCurrency(remainingAmount)} para cobrir o total.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const idempotencyKey = `sale_${companyId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const res = await salesService.createSale({
        companyId,
        items,
        payments,
        customerId: customer?.id || null,
        customerName: customer?.name || null,
        discountAmount,
        notes,
        idempotencyKey,
      });

      if (res.success && res.sale) {
        onSaleCompleted(res.sale);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao processar e salvar venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Finalizar Venda"
      description="Informe a forma de pagamento para concluir a operação e baixar o estoque."
      maxWidth="lg"
    >
      <div className="space-y-6 pt-1">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Resumo de Valores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <div>
            <span className="text-xs text-neutral-500 block">Subtotal dos Itens</span>
            <span className="text-sm font-semibold text-neutral-700 font-mono">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 block">Desconto Aplicado</span>
            <span className="text-sm font-semibold text-amber-600 font-mono">
              -{formatCurrency(discountAmount)}
            </span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 block font-bold">Total a Pagar</span>
            <span className="text-xl font-extrabold text-[#111111] font-mono">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Seletor Rápido de Forma de Pagamento */}
        <div>
          <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">
            1. Selecione a Forma de Pagamento Principal
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'money', label: 'Dinheiro', icon: Banknote },
              { id: 'pix', label: 'Pix', icon: QrCode },
              { id: 'credit_card', label: 'Crédito', icon: CreditCard },
              { id: 'debit_card', label: 'Débito', icon: CreditCard },
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => handleSelectQuickMethod(method.id as PaymentMethod)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? 'border-[#111111] bg-[#111111] text-white shadow-md'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-[#FFD600]' : 'text-neutral-500'}`} />
                  <span className="text-xs font-semibold">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Seção Condicional de Detalhes da Forma Selecionada */}
        {selectedMethod === 'money' && payments.length === 1 && (
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Pagamento em Dinheiro &bull; Cálculo de Troco
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-emerald-800 block mb-1">
                  Valor Entregue pelo Cliente (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={payments[0]?.receivedAmount ?? total}
                  onChange={(e) => handleMoneyChange(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-emerald-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono font-bold"
                />
              </div>
              <div className="flex flex-col justify-center bg-white p-3 rounded-lg border border-emerald-200">
                <span className="text-xs text-neutral-500">Troco a Devolver:</span>
                <span className="text-lg font-bold text-emerald-700 font-mono">
                  {formatCurrency(payments[0]?.changeAmount || 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {selectedMethod === 'pix' && payments.length === 1 && (
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-blue-600" />
              Confirmação Operacional do Pix
            </span>
            <p className="text-[11px] text-blue-800/90 leading-relaxed">
              O pagamento Pix deve ser conferido manualmente pelo operador no aplicativo do banco do
              estabelecimento antes da confirmação final.
            </p>
          </div>
        )}

        {selectedMethod === 'credit_card' && payments.length === 1 && (
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
            <label className="text-xs font-semibold text-neutral-700 block">
              Número de Parcelas (Informativo Comercial)
            </label>
            <select
              value={payments[0]?.installments || 1}
              onChange={(e) =>
                setPayments((prev) => [
                  {
                    ...prev[0],
                    installments: Number(e.target.value),
                  },
                ])
              }
              className="w-full sm:w-48 px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 10, 12].map((n) => (
                <option key={n} value={n}>
                  {n}x de {formatCurrency(total / n)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 2. Seção de Pagamento Misto (Adicionar mais métodos se necessário) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              2. Pagamento Dividido / Misto
            </label>
            {remainingAmount > 0 && (
              <span className="text-xs font-semibold text-amber-600">
                Faltam {formatCurrency(remainingAmount)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={remainingAmount <= 0}
              onClick={() => handleAddSplitPayment('pix')}
              className="text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + Pix
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={remainingAmount <= 0}
              onClick={() => handleAddSplitPayment('credit_card')}
              className="text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + Cartão
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={remainingAmount <= 0}
              onClick={() => handleAddSplitPayment('money')}
              className="text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + Dinheiro
            </Button>
          </div>

          {/* Lista de Pagamentos Registrados quando houver mais de 1 */}
          {payments.length > 1 && (
            <div className="space-y-2 pt-2 border-t border-border">
              {payments.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs"
                >
                  <span className="font-semibold capitalize text-neutral-800">
                    {p.method === 'money'
                      ? 'Dinheiro'
                      : p.method === 'pix'
                      ? 'Pix'
                      : p.method === 'credit_card'
                      ? 'Crédito'
                      : 'Débito'}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={p.amount}
                      onChange={(e) => handleUpdatePaymentAmount(idx, Number(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-xs bg-white border border-neutral-300 rounded-lg text-right font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePayment(idx)}
                      className="p-1 text-neutral-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Observações da Venda */}
        <div>
          <label className="text-xs font-semibold text-neutral-700 block mb-1">
            Observações / Identificação (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ex: Entrega agendada, comprovante Pix conferido..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#FFD600]"
          />
        </div>

        {/* Rodapé / Ações */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Voltar ao Caixa
          </Button>

          <Button
            type="button"
            size="md"
            disabled={!isFullyPaid || isSubmitting}
            onClick={handleFinalizeSale}
            className="bg-[#FFD600] text-[#111111] hover:bg-[#e6c100] font-bold border-none shadow-md flex items-center gap-2 px-6"
          >
            {isSubmitting ? (
              'Processando...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirmar e Concluir Venda ({formatCurrency(total)})
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
