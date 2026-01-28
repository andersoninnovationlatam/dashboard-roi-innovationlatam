# CreateProjectForm

Componente de formulário para criação de projetos seguindo as regras do `.cursorrules`.

## Características

- ✅ Validação com **react-hook-form** e **zod**
- ✅ Integração com **Supabase**
- ✅ Inclui automaticamente o `user_id` do usuário logado
- ✅ Design moderno/SaaS com Tailwind CSS
- ✅ Acessibilidade (aria-labels, aria-invalid, etc.)
- ✅ Suporte a dark mode
- ✅ Tratamento de erros

## Uso

```tsx
import { CreateProjectForm } from './features/projects/CreateProjectForm'

function MyComponent() {
  const handleSuccess = () => {
    console.log('Projeto criado com sucesso!')
    // Redirecionar ou atualizar lista
  }

  const handleCancel = () => {
    // Ação ao cancelar
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Novo Projeto</h1>
      <CreateProjectForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}
```

## Campos do Formulário

- **Nome** (obrigatório): 3-100 caracteres
- **Área** (obrigatório): Select com opções pré-definidas
- **Descrição** (opcional): Textarea com máximo de 500 caracteres

## Requisitos

1. **Supabase configurado**: Veja `SUPABASE_SETUP.md` na raiz do projeto
2. **Variáveis de ambiente**: Configure `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. **Usuário autenticado**: O componente verifica se há um usuário logado

## Melhorias em relação ao componente anterior

1. ✅ Validação robusta com Zod
2. ✅ Integração com Supabase (não mais localStorage)
3. ✅ TypeScript para type safety
4. ✅ Estrutura conforme `.cursorrules` (`src/features/`)
5. ✅ Melhor UX com feedback de erros
6. ✅ Acessibilidade aprimorada
7. ✅ RLS do Supabase garante segurança
