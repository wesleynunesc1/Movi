import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { customersService } from '@/services/customersService';
import type { Customer } from '@/types/sales';
import { User, Phone, Mail, CheckCircle2 } from 'lucide-react';

interface QuickCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onCustomerCreated: (customer: Customer) => void;
}

export const QuickCustomerModal: React.FC<QuickCustomerModalProps> = ({
  isOpen,
  onClose,
  companyId,
  onCustomerCreated,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do cliente é obrigatório.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await customersService.create(companyId, {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
      });
      onCustomerCreated(created);
      setName('');
      setPhone('');
      setEmail('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao cadastrar cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Cadastro Rápido de Cliente"
      description="Informe os dados básicos para associar a esta venda."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <Input
          label="Nome Completo *"
          placeholder="Ex: João da Silva"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Telefone / WhatsApp (Opcional)"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Input
          label="E-mail (Opcional)"
          type="email"
          placeholder="cliente@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading || !name.trim()}
            className="bg-[#FFD600] text-[#111111] hover:bg-[#e6c100] font-semibold border-none"
          >
            {loading ? 'Salvando...' : 'Adicionar à Venda'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
