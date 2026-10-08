import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import type { Sale } from '@/types/sales';
import { salesService } from '@/services/salesService';
import {
  Printer,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  CreditCard,
  FileText,
  Boxes,
} from 'lucide-react';

interface SaleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  companyId: string;
  onSaleCancelled: () => void;
  onOpenReceipt: (sale: Sale) => void;
}

export const SaleDetailsModal: React.FC<SaleDetailsModalProps> = ({
  isOpen,
  onClose,
  sale,
  companyId,
  onSaleCancelled,
  onOpenReceipt,
}) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!sale) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const handleCancelSale = async () => {
    if (!cancelReason.trim()) {
      setErrorMsg('Informe o motivo do cancelamento da venda.');
      return;
    }

    setIsCancelling(true);
    setErrorMsg(null);
    try {
      await salesService.cancelSale(companyId, sale.id, cancelReason);
      setShowCancelConfirm(false);
      onSaleCancelled();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao cancelar venda.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalhes da Venda ${sale.sale_number}`}
      description={`Registrada em ${new Date(sale.created_at).toLocaleString('pt-BR')}`}
      maxWidth="lg"
    >
      <div className="space-y-5 pt-1">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Status Badge e Resumo Rápido */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                sale.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : sale.status === 'canceled'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  sale.status === 'completed'
                    ? 'bg-emerald-500'
                    : sale.status === 'canceled'
                    ? 'bg-rose-500'
                    : 'bg-neutral-400'
                }`}
              />
              {sale.status === 'completed'
                ? 'Concluída'
                : sale.status === 'canceled'
                ? 'Cancelada'
                : sale.status}
            </span>
            {sale.customer && (
              <span className="text-xs text-neutral-600 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                {sale.customer.name}
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs text-neutral-400 block">Total da Venda</span>
            <span className="text-lg font-extrabold text-[#111111] font-mono">
              {formatCurrency(sale.total_amount)}
            </span>
          </div>
        </div>

        {/* Lista de Itens Vendidos (Snapshot Original) */}
        <div>
          <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
            Itens Registrados na Venda
          </h4>
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
                <tr>
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(sale.items || []).map((it, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50">
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-neutral-900 block">
                        {it.product_name_snapshot}
                      </span>
                      {it.variant_name_snapshot && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                          {it.variant_name_snapshot}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-500">
                      {it.sku_snapshot}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      {it.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {formatCurrency(it.unit_price)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {formatCurrency(it.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagamentos Registrados */}
        <div>
          <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
            Pagamentos e Recebimentos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(sale.payments || []).map((p, idx) => (
              <div
                key={idx}
                className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs flex justify-between items-center"
              >
                <div>
                  <span className="font-bold text-neutral-800 capitalize">
                    {p.method === 'money'
                      ? 'Dinheiro'
                      : p.method === 'pix'
                      ? 'Pix'
                      : p.method === 'credit_card'
                      ? `Cartão de Crédito (${p.installments}x)`
                      : 'Cartão de Débito'}
                  </span>
                  {p.change_amount > 0 && (
                    <span className="block text-[10px] text-emerald-600 mt-0.5">
                      Troco: {formatCurrency(p.change_amount)}
                    </span>
                  )}
                </div>
                <span className="font-bold font-mono text-[#111111]">
                  {formatCurrency(p.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal interno para confirmação de cancelamento seguro */}
        {showCancelConfirm ? (
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-3 animate-in fade-in">
            <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Confirmar Cancelamento e Estorno de Estoque
            </h4>
            <p className="text-xs text-rose-700 leading-relaxed">
              Esta ação cancelará a venda definitivamente e devolverá automaticamente as quantidades
              ao estoque com auditoria. Se o pagamento foi feito externamente (Pix/Cartão), realize o
              reembolso ao cliente no seu banco/maquininha.
            </p>
            <div>
              <label className="text-xs font-semibold text-rose-900 block mb-1">
                Motivo do Cancelamento *
              </label>
              <input
                type="text"
                placeholder="Ex: Desistência do cliente, erro de operador..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-lg focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCancelling}
              >
                Voltar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isCancelling || !cancelReason.trim()}
                onClick={handleCancelSale}
                className="bg-rose-600 text-white hover:bg-rose-700 font-bold border-none"
              >
                {isCancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </Button>
            </div>
          </div>
        ) : null}

        {/* Rodapé / Ações */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenReceipt(sale)}
              className="flex items-center gap-1.5 text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Ver Comprovante
            </Button>

            {sale.status === 'completed' && !showCancelConfirm && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCancelConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancelar Venda
              </Button>
            )}
          </div>

          <Button type="button" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
