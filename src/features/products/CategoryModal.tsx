import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { categoriesService } from '@/services/categoriesService';
import { useToast } from '@/components/ui/Toast';
import { Tag, Plus } from 'lucide-react';
import type { ProductCategory } from '@/types/products';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onCategoryCreated: (category: ProductCategory) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  companyId,
  onCategoryCreated,
}) => {
  const { success, error: toastError } = useToast();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome da categoria');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const created = await categoriesService.create(companyId, name.trim());
      success('Categoria criada!', `A categoria "${created.name}" está disponível.`);
      onCategoryCreated(created);
      setName('');
      onClose();
    } catch (err: any) {
      toastError('Erro ao criar categoria', err?.message || 'Falha ao salvar');
      setErrorMsg(err?.message || 'Falha ao salvar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Categoria de Produto"
      description="Cadastre uma categoria para agrupar e organizar seus itens comerciais."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-status-danger-bg text-status-danger text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <Input
          label="Nome da categoria *"
          placeholder="Ex: Roupas, Eletrônicos, Bebidas..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<Tag className="w-4 h-4" />}
          autoFocus
        />

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Cadastrar Categoria
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
