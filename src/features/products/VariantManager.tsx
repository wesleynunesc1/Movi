import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, Layers, Check, AlertTriangle } from 'lucide-react';
import type { ProductVariant } from '@/types/products';

interface AttributeInput {
  id: string;
  name: string;
  values: string[];
  currentValue: string;
}

interface VariantManagerProps {
  baseSku: string;
  baseSalePrice: number;
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

export const VariantManager: React.FC<VariantManagerProps> = ({
  baseSku,
  baseSalePrice,
  variants,
  onChange,
}) => {
  const [attributes, setAttributes] = useState<AttributeInput[]>([
    { id: '1', name: 'Cor', values: [], currentValue: '' },
  ]);

  const addAttribute = () => {
    if (attributes.length >= 3) return;
    setAttributes([
      ...attributes,
      { id: String(Date.now()), name: '', values: [], currentValue: '' },
    ]);
  };

  const removeAttribute = (attrId: string) => {
    setAttributes(attributes.filter((a) => a.id !== attrId));
  };

  const addValue = (attrId: string) => {
    setAttributes(
      attributes.map((a) => {
        if (a.id === attrId && a.currentValue.trim()) {
          const val = a.currentValue.trim();
          if (!a.values.includes(val)) {
            return { ...a, values: [...a.values, val], currentValue: '' };
          }
          return { ...a, currentValue: '' };
        }
        return a;
      })
    );
  };

  const removeValue = (attrId: string, valToRemove: string) => {
    setAttributes(
      attributes.map((a) =>
        a.id === attrId ? { ...a, values: a.values.filter((v) => v !== valToRemove) } : a
      )
    );
  };

  const generateCombinations = () => {
    const validAttrs = attributes.filter((a) => a.name.trim() && a.values.length > 0);
    if (validAttrs.length === 0) return;

    // Cartesian product
    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])),
        [[]]
      );
    };

    const valueArrays = validAttrs.map((a) => a.values);
    const combos = cartesian(valueArrays);

    if (combos.length > 50) {
      alert('Limite de 50 combinações por produto para garantir estabilidade operacional.');
      return;
    }

    const newVariants: ProductVariant[] = combos.map((combo, idx) => {
      const key = combo.join(' / ');
      const existing = variants.find((v) => v.combination_key === key);
      if (existing) return existing;

      return {
        id: 'var_' + Math.random().toString(36).substring(2, 9),
        company_id: '',
        product_id: '',
        combination_key: key,
        sku: `${baseSku || 'PRD'}-V${idx + 1}`,
        barcode: null,
        cost_price_override: null,
        sale_price_override: baseSalePrice || null,
        is_active: true,
        quantity_on_hand: 0,
        minimum_quantity: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    onChange(newVariants);
  };

  const updateVariant = (id: string, field: keyof ProductVariant, val: any) => {
    onChange(
      variants.map((v) => (v.id === id ? { ...v, [field]: val } : v))
    );
  };

  const removeVariant = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-5 p-4 rounded-2xl bg-surface-secondary/40 border border-border">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold font-display text-movi-graphite flex items-center gap-2">
            <Layers className="w-4 h-4 text-movi-yellow" />
            Configurador de Variações (Tamanho, Cor, Voltagem...)
          </h4>
          <p className="text-xs text-text-secondary mt-0.5">
            Defina atributos e valores para gerar combinações com estoque e preços individuais.
          </p>
        </div>
        {attributes.length < 3 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addAttribute}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Adicionar Atributo
          </Button>
        )}
      </div>

      {/* Inputs de Atributos */}
      <div className="space-y-3">
        {attributes.map((attr, idx) => (
          <div key={attr.id} className="p-3 bg-white rounded-xl border border-border space-y-2.5">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Ex: Cor, Tamanho, Sabor..."
                value={attr.name}
                onChange={(e) =>
                  setAttributes(
                    attributes.map((a) => (a.id === attr.id ? { ...a, name: e.target.value } : a))
                  )
                }
                className="h-9 text-xs"
              />
              {attributes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAttribute(attr.id)}
                  className="p-2 text-text-muted hover:text-status-danger"
                  title="Remover atributo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Inserir valores */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Adicionar valor para ${attr.name || 'este atributo'} (Ex: Preto, G)...`}
                value={attr.currentValue}
                onChange={(e) =>
                  setAttributes(
                    attributes.map((a) =>
                      a.id === attr.id ? { ...a, currentValue: e.target.value } : a
                    )
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addValue(attr.id);
                  }
                }}
                className="h-8 flex-1 px-3 text-xs rounded-lg border border-border focus:outline-none focus:border-movi-graphite"
              />
              <Button type="button" size="sm" variant="secondary" onClick={() => addValue(attr.id)}>
                + Adicionar
              </Button>
            </div>

            {/* Tags dos valores inseridos */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {attr.values.map((val) => (
                <span
                  key={val}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-secondary text-movi-graphite text-xs font-medium border border-border"
                >
                  {val}
                  <button
                    type="button"
                    onClick={() => removeValue(attr.id, val)}
                    className="text-text-muted hover:text-status-danger"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={generateCombinations}
          leftIcon={<Layers className="w-3.5 h-3.5" />}
        >
          Gerar / Atualizar Combinações ({variants.length})
        </Button>
        <span className="text-xs text-text-secondary">
          {variants.length > 0 ? `${variants.length} variantes ativas` : 'Nenhuma variante gerada ainda'}
        </span>
      </div>

      {/* Matriz de Combinações Geradas */}
      {variants.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-white mt-4">
          <table className="w-full text-xs">
            <thead className="bg-surface-secondary/70 border-b border-border text-text-secondary">
              <tr>
                <th className="p-2.5 text-left font-semibold">Variante</th>
                <th className="p-2.5 text-left font-semibold">SKU</th>
                <th className="p-2.5 text-left font-semibold">Preço Venda (R$)</th>
                <th className="p-2.5 text-left font-semibold">Estoque</th>
                <th className="p-2.5 text-left font-semibold">Mínimo</th>
                <th className="p-2.5 text-center font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {variants.map((v) => (
                <tr key={v.id} className="hover:bg-surface-secondary/30">
                  <td className="p-2.5 font-bold text-movi-graphite">{v.combination_key}</td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => updateVariant(v.id, 'sku', e.target.value)}
                      className="h-7 w-28 px-2 text-xs border rounded bg-white"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="number"
                      step="0.01"
                      value={v.sale_price_override ?? baseSalePrice ?? 0}
                      onChange={(e) => updateVariant(v.id, 'sale_price_override', parseFloat(e.target.value) || 0)}
                      className="h-7 w-24 px-2 text-xs border rounded bg-white"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="number"
                      value={v.quantity_on_hand ?? 0}
                      onChange={(e) => updateVariant(v.id, 'quantity_on_hand', parseInt(e.target.value, 10) || 0)}
                      className="h-7 w-20 px-2 text-xs border rounded bg-white"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="number"
                      value={v.minimum_quantity ?? 0}
                      onChange={(e) => updateVariant(v.id, 'minimum_quantity', parseInt(e.target.value, 10) || 0)}
                      className="h-7 w-20 px-2 text-xs border rounded bg-white"
                    />
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeVariant(v.id)}
                      className="text-text-muted hover:text-status-danger p-1"
                      title="Excluir variante"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
