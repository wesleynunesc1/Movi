import React, { useState, useRef } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { productsService } from '@/services/productsService';
import { Download, Upload, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import type { Product } from '@/types/products';

interface ProductCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onImportComplete: () => void;
}

interface ParsedRow {
  name: string;
  sku: string;
  barcode?: string;
  cost_price: number;
  sale_price: number;
  initialStock: number;
  initialMinStock: number;
  unit: any;
  error?: string;
}

export const ProductCsvImportModal: React.FC<ProductCsvImportModalProps> = ({
  isOpen,
  onClose,
  companyId,
  onImportComplete,
}) => {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<{ imported: number; failed: number } | null>(null);

  const handleDownloadTemplate = () => {
    const csvContent =
      'Nome,SKU,CodigoBarras,PrecoCusto,PrecoVenda,Estoque,EstoqueMinimo,Unidade\n' +
      'Camiseta Basica Algodao,CAM-001,7891234567890,25.00,59.90,20,5,UN\n' +
      'Bermuda Jeans Casual,BER-002,,45.00,99.90,15,3,UN\n' +
      'Meia Esportiva Cano Medio,MEI-003,7899876543210,5.50,14.90,50,10,PCT';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_importacao_produtos_movi.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        toastError('Arquivo vazio', 'O arquivo CSV não contém linhas de produtos.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const parsed: ParsedRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        const name = cols[0] || '';
        const sku = cols[1] || `IMP-${Math.floor(1000 + Math.random() * 9000)}`;
        const barcode = cols[2] || undefined;
        const cost_price = parseFloat(cols[3]) || 0;
        const sale_price = parseFloat(cols[4]) || 0;
        const initialStock = parseInt(cols[5], 10) || 0;
        const initialMinStock = parseInt(cols[6], 10) || 0;
        const unit = (cols[7] || 'UN').toUpperCase();

        let rowError: string | undefined = undefined;
        if (!name) rowError = 'Nome obrigatório';
        else if (sale_price < 0) rowError = 'Preço de venda não pode ser negativo';

        parsed.push({
          name,
          sku,
          barcode,
          cost_price,
          sale_price,
          initialStock,
          initialMinStock,
          unit,
          error: rowError,
        });
      }

      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    const validRows = rows.filter((r) => !r.error);
    if (validRows.length === 0) {
      toastError('Nenhum produto válido', 'Corrija os erros do arquivo antes de importar.');
      return;
    }

    setIsProcessing(true);
    let countSuccess = 0;
    let countFail = 0;

    for (const r of validRows) {
      try {
        await productsService.create(companyId, {
          name: r.name,
          sku: r.sku,
          barcode: r.barcode,
          cost_price: r.cost_price,
          sale_price: r.sale_price,
          initialStock: r.initialStock,
          initialMinStock: r.initialMinStock,
          unit: r.unit,
        });
        countSuccess++;
      } catch {
        countFail++;
      }
    }

    setIsProcessing(false);
    setImportSummary({ imported: countSuccess, failed: countFail + (rows.length - validRows.length) });
    success('Importação concluída!', `${countSuccess} produtos importados com sucesso.`);
    onImportComplete();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Importar Produtos por Planilha CSV"
      description="Cadastre múltiplos produtos rapidamente através de um arquivo CSV formatado."
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Step 1: Download Modelo */}
        <div className="p-4 rounded-xl bg-surface-secondary/70 border border-border flex items-center justify-between">
          <div>
            <h5 className="text-xs font-bold text-movi-graphite">1. Baixe o Modelo Padrão</h5>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Utilize o arquivo modelo para preencher seus produtos com as colunas corretas.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDownloadTemplate}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Baixar Modelo CSV
          </Button>
        </div>

        {/* Step 2: Upload CSV */}
        <div className="p-4 rounded-xl border border-dashed border-border text-center space-y-3 bg-white">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv,text/csv"
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center mx-auto text-movi-graphite">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-movi-graphite block">
              {fileName || '2. Selecione o arquivo CSV preenchido'}
            </span>
            <span className="text-[11px] text-text-secondary">
              Arquivos .csv com separador por vírgula
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Escolher Arquivo do Computador
          </Button>
        </div>

        {/* Pré-visualização das linhas */}
        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-movi-graphite">
              <span>Prévia dos Dados ({rows.length} itens encontrados)</span>
              <span className="text-status-success font-medium">
                {rows.filter((r) => !r.error).length} válidos
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-white">
              <table className="w-full text-xs">
                <thead className="bg-surface-secondary border-b border-border text-text-secondary sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Nome</th>
                    <th className="p-2 text-left">SKU</th>
                    <th className="p-2 text-left">Preço Venda</th>
                    <th className="p-2 text-left">Estoque</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rows.map((r, i) => (
                    <tr key={i} className={r.error ? 'bg-status-danger-bg/30' : ''}>
                      <td className="p-2 font-medium text-movi-graphite truncate max-w-[140px]">{r.name}</td>
                      <td className="p-2 font-mono text-[11px]">{r.sku}</td>
                      <td className="p-2">R$ {r.sale_price.toFixed(2)}</td>
                      <td className="p-2">{r.initialStock} {r.unit}</td>
                      <td className="p-2">
                        {r.error ? (
                          <span className="text-[10px] text-status-danger font-semibold">{r.error}</span>
                        ) : (
                          <span className="text-[10px] text-status-success font-medium">Pronto</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Relatório Final */}
        {importSummary && (
          <div className="p-3.5 rounded-xl bg-surface-secondary border border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-status-success font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{importSummary.imported} produtos criados</span>
            </div>
            {importSummary.failed > 0 && (
              <span className="text-status-danger font-semibold">
                {importSummary.failed} falhas
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button variant="secondary" onClick={onClose} disabled={isProcessing}>
            Fechar
          </Button>
          {rows.length > 0 && !importSummary && (
            <Button
              variant="primary"
              onClick={handleConfirmImport}
              isLoading={isProcessing}
              leftIcon={<FileText className="w-4 h-4" />}
            >
              Importar {rows.filter((r) => !r.error).length} Produtos
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};
