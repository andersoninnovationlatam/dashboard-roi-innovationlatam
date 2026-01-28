# Dashboard ROI - Versão React

## Estrutura de Pastas

```
src-react/
├── components/          # Componentes reutilizáveis
│   ├── common/          # Componentes comuns
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Loading.jsx
│   │   └── Tabs.jsx
│   └── layout/          # Componentes de layout
│       ├── Header.jsx
│       └── Layout.jsx
├── contexts/            # Context API
│   ├── AuthContext.jsx
│   └── DataContext.jsx
├── pages/               # Páginas da aplicação
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── projects/
│   │   ├── ProjectList.jsx
│   │   └── ProjectForm.jsx
│   ├── dashboard/
│   │   └── Dashboard.jsx
│   ├── indicators/
│   │   ├── IndicatorList.jsx
│   │   └── IndicatorForm.jsx
│   └── reports/
│       └── Reports.jsx
├── services/            # Serviços (lógica de negócio)
│   ├── authService.js
│   ├── projectService.js
│   └── indicatorService.js
├── App.jsx              # Componente principal
├── main.jsx             # Entry point
├── index.css            # Estilos globais
├── index.html           # HTML base
├── package.json         # Dependências
└── vite.config.js       # Configuração Vite
```

## Instalação

```bash
cd src-react
npm install
```

## Executar em Desenvolvimento

```bash
npm run dev
```

## Build para Produção

```bash
npm run build
```

## Características

- ✅ React 18 com Hooks
- ✅ React Router para navegação
- ✅ Context API para gerenciamento de estado
- ✅ Componentes reutilizáveis e modulares
- ✅ Tailwind CSS para estilização
- ✅ LocalStorage para persistência
- ✅ Sistema de abas no formulário de indicadores
- ✅ Validação de formulários
- ✅ Rotas protegidas

## Próximos Passos

1. Implementar cálculos de ROI completos
2. Adicionar gráficos com Chart.js
3. Implementar exportação de relatórios (PDF/CSV)
4. Adicionar mais validações
5. Implementar testes unitários
