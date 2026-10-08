import React, { useRef } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import type { Sale } from '@/types/sales';
import { Printer, MessageCircle, CheckCircle2, Copy, FileText, ArrowRight } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  companyName: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  companyName,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const winPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    if (!winPrint) return;

    winPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprovante de Venda - ${sale.sale_number}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 76mm;
              margin: 2mm auto;
              padding: 0;
              color: #000;
              font-size: 11px;
              line-height: 1.3;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-top { border-top: 1px dashed #000; margin-top: 6px; padding-top: 6px; }
            .border-bottom { border-bottom: 1px dashed #000; margin-bottom: 6px; padding-bottom: 6px; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .notice { font-size: 9px; text-align: center; margin-top: 10px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    winPrint.document.close();
    winPrint.focus();
  };

  const handleWhatsAppShare = () => {
    if (!sale) return;
    const phone = sale.customer?.phone?.replace(/\D/g, '') || '';
    const itemsText = (sale.items || [])
      .map((it) => `• ${it.quantity}x ${it.product_name_snapshot} - ${formatCurrency(it.line_total)}`)
      .join('\n');

    const msg = `*${companyName}*\n` +
      `Olá! Segue o comprovante da sua compra:\n\n` +
      `*Venda:* ${sale.sale_number}\n` +
      `*Data:* ${new Date(sale.created_at).toLocaleString('pt-BR')}\n\n` +
      `*Itens:*\n${itemsText}\n\n` +
      `*Total:* ${formatCurrency(sale.total_amount)}\n\n` +
      `_Comprovante de venda — sem valor fiscal_\n` +
      `Agradecemos a sua preferência!`;

    const encoded = encodeURIComponent(msg);
    const url = phone ? `https://wa.me/55${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const text = receiptRef.current?.innerText || '';
    navigator.clipboard.writeText(text);
    alert('Comprovante copiado para a área de transferência!');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Comprovante de Venda"
      description="Documento comercial de conferência sem valor fiscal."
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Visualizador do Comprovante (Estilo Impressora Térmica 80mm) */}
        <div className="bg-neutral-50 p-4 rounded-xl border border-border flex justify-center">
          <div
            ref={receiptRef}
            className="w-full max-w-[340px] bg-white p-5 rounded-lg shadow-sm border border-neutral-200 text-neutral-800 font-mono text-xs leading-relaxed"
          >
            {/* Cabeçalho */}
            <div className="text-center pb-3 border-b border-dashed border-neutral-300">
              <h3 className="font-bold text-sm tracking-wider uppercase text-neutral-900">
                {companyName}
              </h3>
              <p className="text-[10px] text-neutral-500 mt-0.5">MOVI &bull; Gestão Comercial</p>
              <div className="mt-2 text-[11px] font-semibold">
                COMPROVANTE DE VENDA
              </div>
              <div className="text-[9px] text-neutral-400 font-sans tracking-wide">
                (SEM VALOR FISCAL)
              </div>
            </div>

            {/* Metadados da Venda */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Número:</span>
                <span className="font-bold text-neutral-900">{sale.sale_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Data e Hora:</span>
                <span>{new Date(sale.created_at).toLocaleString('pt-BR')}</span>
              </div>
              {sale.customer && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Cliente:</span>
                  <span className="font-semibold">{sale.customer.name}</span>
                </div>
              )}
            </div>

            {/* Lista de Itens */}
            <div className="py-2.5 border-b border-dashed border-neutral-300">
              <div className="text-[10px] uppercase font-bold text-neutral-400 mb-1.5 flex justify-between">
                <span>Item / Qtd</span>
                <span>Total</span>
              </div>
              <div className="space-y-1.5">
                {(sale.items || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="pr-2">
                      <div className="font-semibold text-neutral-800 leading-tight">
                        {it.product_name_snapshot}
                        {it.variant_name_snapshot && (
                          <span className="text-[10px] text-neutral-500 ml-1">
                            ({it.variant_name_snapshot})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {it.quantity} x {formatCurrency(it.unit_price)}
                        {it.discount_amount > 0 && ` (-${formatCurrency(it.discount_amount)})`}
                      </div>
                    </div>
                    <span className="font-bold whitespace-nowrap">
                      {formatCurrency(it.line_total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totais */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal:</span>
                <span>{formatCurrency(sale.subtotal_amount)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(sale.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-neutral-900 pt-1 border-t border-neutral-200">
                <span>TOTAL:</span>
                <span>{formatCurrency(sale.total_amount)}</span>
              </div>
            </div>

            {/* Formas de Pagamento */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1 text-[11px]">
              <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1">
                Pagamentos Recebidos
              </div>
              {(sale.payments || []).map((p, idx) => {
                const methodLabel =
                  p.method === 'money'
                    ? 'Dinheiro'
                    : p.method === 'pix'
                    ? 'Pix'
                    : p.method === 'credit_card'
                    ? `Cartão de Crédito (${p.installments}x)`
                    : p.method === 'debit_card'
                    ? 'Cartão de Débito'
                    : 'Outro';

                return (
                  <div key={idx} className="flex justify-between">
                    <span>{methodLabel}:</span>
                    <span className="font-semibold">{formatCurrency(p.amount)}</span>
                  </div>
                );
              })}
              {sale.payments?.some((p) => (p.change_amount || 0) > 0) && (
                <div className="flex justify-between text-emerald-700 font-semibold pt-0.5">
                  <span>Troco:</span>
                  <span>
                    {formatCurrency(
                      sale.payments.reduce((acc, p) => acc + (p.change_amount || 0), 0)
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Mensagem Final */}
            <div className="text-center pt-3 text-[10px] text-neutral-500 space-y-1">
              <p className="font-medium">Obrigado pela preferência e volte sempre!</p>
              <p className="text-[8px] text-neutral-400">
                Sistema MOVI &bull; Gestão Comercial Inteligente
              </p>
            </div>
          </div>
        </div>

        {/* Ações do Comprovante */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-neutral-600" />
              Imprimir
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300"
            >
              <MessageCircle className="w-4 h-4" />
              Enviar no WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 text-xs"
            >
              <Copy className="w-3.5 h-3.5 text-neutral-500" />
              Copiar
            </Button>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="bg-[#FFD600] text-[#111111] hover:bg-[#e6c100] font-semibold border-none"
          >
            Concluir e Fechar
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
