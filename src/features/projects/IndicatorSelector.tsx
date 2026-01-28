import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'

// Categorias de ROI disponíveis
const ROI_CATEGORIES = [
  'Produtividade',
  'Capacidade Analítica',
  'Incremento Receita',
  'Melhoria Margem',
  'Redução de Risco',
  'Qualidade Decisão',
  'Velocidade',
  'Satisfação',
] as const

type ROICategory = typeof ROI_CATEGORIES[number]

// Descrições técnicas para cada categoria
const CATEGORY_DESCRIPTIONS: Record<ROICategory, string> = {
  'Produtividade': 'Redução de tempo em tarefas existentes, permitindo que a equipe realize mais atividades no mesmo período.',
  'Capacidade Analítica': 'Aumento na capacidade de análise de dados e tomada de decisões baseadas em insights.',
  'Incremento Receita': 'Aumento direto na receita através de novas oportunidades ou otimização de vendas.',
  'Melhoria Margem': 'Otimização de custos e processos para melhorar a margem de lucro dos produtos/serviços.',
  'Redução de Risco': 'Prevenção de eventos negativos e redução de riscos operacionais, financeiros ou de compliance.',
  'Qualidade Decisão': 'Melhoria na qualidade das decisões tomadas através de análises mais precisas e completas.',
  'Velocidade': 'Redução no tempo de entrega de produtos, serviços ou processos, aumentando a agilidade operacional.',
  'Satisfação': 'Aumento na satisfação de clientes ou colaboradores através de melhorias na experiência.',
}

interface IndicatorSelectorProps {
  value?: {
    category: ROICategory | ''
    name: string
    baselineValue: string
  }
  onChange?: (value: {
    category: ROICategory | ''
    name: string
    baselineValue: string
  }) => void
  className?: string
}

export const IndicatorSelector = ({
  value,
  onChange,
  className = '',
}: IndicatorSelectorProps) => {
  const [category, setCategory] = useState<ROICategory | ''>(value?.category || '')
  const [name, setName] = useState(value?.name || '')
  const [baselineValue, setBaselineValue] = useState(value?.baselineValue || '')

  const handleCategoryChange = (newCategory: ROICategory | '') => {
    setCategory(newCategory)
    onChange?.({
      category: newCategory,
      name,
      baselineValue,
    })
  }

  const handleNameChange = (newName: string) => {
    setName(newName)
    onChange?.({
      category,
      name: newName,
      baselineValue,
    })
  }

  const handleBaselineChange = (newBaseline: string) => {
    setBaselineValue(newBaseline)
    onChange?.({
      category,
      name,
      baselineValue: newBaseline,
    })
  }

  return (
    <Tooltip.Provider>
      <div className={`space-y-6 ${className}`}>
        {/* Card: Categoria do ROI */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <label
              htmlFor="roi-category"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Categoria do ROI
            </label>
            <Tooltip.Root delayDuration={300}>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                  aria-label="Informações sobre categorias de ROI"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg px-3 py-2 max-w-xs shadow-lg z-50 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                  sideOffset={5}
                >
                  {category && category in CATEGORY_DESCRIPTIONS ? (
                    <p>{CATEGORY_DESCRIPTIONS[category as ROICategory]}</p>
                  ) : (
                    <p>Selecione uma categoria para ver sua descrição técnica</p>
                  )}
                  <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-700" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>
          <select
            id="roi-category"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value as ROICategory | '')}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-slate-400 dark:hover:border-slate-500"
          >
            <option value="">Selecione uma categoria...</option>
            {ROI_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Card: Nome do Indicador */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <label
            htmlFor="indicator-name"
            className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300"
          >
            Nome do Indicador
          </label>
          <input
            id="indicator-name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex: Tempo de análise de relatórios"
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-slate-400 dark:hover:border-slate-500"
          />
        </div>

        {/* Card: Valor de Baseline */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <label
            htmlFor="baseline-value"
            className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300"
          >
            Valor de Baseline
          </label>
          <input
            id="baseline-value"
            type="text"
            value={baselineValue}
            onChange={(e) => handleBaselineChange(e.target.value)}
            placeholder="Ex: 120 (minutos), R$ 5.000, 85%"
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-slate-400 dark:hover:border-slate-500"
          />
        </div>
      </div>
    </Tooltip.Provider>
  )
}
