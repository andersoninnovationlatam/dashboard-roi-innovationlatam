# 🔧 Configuração do Supabase

## 📋 Credenciais do seu Projeto

Com base nas informações do seu projeto Supabase, configure o arquivo `.env` na raiz do projeto (`dash-roi-v2/.env`):

```env
VITE_SUPABASE_URL=https://npdgtwcnjfmdkrqgcmqj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZGd0d2NuamZtZGtycWdjbXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NjYyMzksImV4cCI6MjA4NTE0MjIzOX0.NQ13Yih-0luVUgtrYh-jwNbaRxxL6V8KPmQlPZapZKA
```

## ⚠️ Importante

- **Use a chave `anon` (anon/public key)**, não a `service_role` key
- A chave `anon` é segura para uso no frontend
- A chave `service_role` é privada e nunca deve ser exposta no frontend

## 📍 Onde encontrar essas informações no Supabase Dashboard

1. Acesse: [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. **Project URL**: Copie a URL do projeto
5. **Project API keys**: Use a chave `anon` / `public` (não a `service_role`)

## ✅ Após configurar

1. **Crie o arquivo `.env`** na raiz do projeto (`dash-roi-v2/.env`)
2. **Cole as credenciais** acima no arquivo
3. **Reinicie o servidor de desenvolvimento**:
   ```bash
   # Pare o servidor (Ctrl+C) e reinicie
   npm run dev
   ```

## 🧪 Testando

Após reiniciar, tente fazer um cadastro. O erro "Failed to fetch" não deve mais aparecer.

## 🔒 Segurança

- **NUNCA** commite o arquivo `.env` no Git
- O arquivo `.env` já está no `.gitignore`
- A chave `anon` é pública e segura para uso no frontend
