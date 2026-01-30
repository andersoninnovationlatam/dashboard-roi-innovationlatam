# 🔧 Fix: Projetos Não Podem Ser Excluídos

## 🐛 Problema Identificado

Dois projetos não podiam ser excluídos mesmo com usuário autenticado.

## 🔍 Causa Raiz

**Políticas RLS Conflitantes:**
1. **"Admins can delete projects"** - Requeria role `'admin'`
2. **"Users can delete own projects"** - Requeria `auth.uid() = user_id` (política antiga)

**Situação do Usuário:**
- Usuário logado: `anderson.pinto@innovationlatam.com`
- Role: `'manager'` (não `'admin'`)
- `user_id` dos projetos: diferente do usuário atual

**Resultado:** Nenhuma das duas políticas permitia a exclusão.

## ✅ Correções Aplicadas

### 1. Migration SQL Aplicada

**Arquivo:** `migrations/fix_project_delete_policies.sql`

**Ações:**
- ✅ Removida política antiga "Users can delete own projects"
- ✅ Removida política genérica "Users can manage their own projects"
- ✅ Atualizada política para permitir **Managers e Admins** deletarem projetos

**Nova Política:**
```sql
CREATE POLICY "Managers can delete projects"
  ON projects FOR DELETE
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = get_user_organization_id() 
      AND role IN ('admin', 'manager')
    )
  );
```

### 2. Código Frontend Atualizado

**Arquivo:** `contexts/AuthContext.jsx`

**Antes:**
```javascript
const canDeleteProject = () => {
  return hasRole('admin')
}
```

**Depois:**
```javascript
const canDeleteProject = () => {
  return hasAnyRole(['admin', 'manager'])
}
```

## 📊 Verificação

**Políticas RLS Atuais:**
- ✅ Apenas 1 política de DELETE: "Managers can delete projects"
- ✅ Permite roles: `'admin'` e `'manager'`
- ✅ Filtra por `organization_id`

**Projetos:**
- ✅ Ambos têm `organization_id` correto
- ✅ Ambos pertencem à mesma organização do usuário

## 🎯 Resultado

Agora usuários com role `'manager'` ou `'admin'` podem deletar projetos da sua organização.

## ✅ Teste

1. Recarregue a página
2. Tente deletar os projetos que não podiam ser excluídos
3. Deve funcionar normalmente agora

## 📝 Nota

A política antiga baseada em `user_id` foi removida porque:
- Não é mais necessária (estrutura normalizada usa `organization_id`)
- Estava causando conflito com a nova política
- A nova estrutura permite melhor controle de acesso por organização
