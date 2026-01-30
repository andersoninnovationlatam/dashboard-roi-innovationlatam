/**
 * Componente Genérico para Indicadores
 * Pode ser usado como base para indicadores que ainda não têm componente específico
 * Renderiza BaselineTab e PostIATab genéricos
 */

import { BaselineTab } from '../../features/projects/BaselineTab'
import { PostIATab } from '../../features/projects/PostIATab'

const IndicatorGeneric = ({ 
  tipoIndicador,
  baselineData, 
  postIAData, 
  onBaselineChange, 
  onPostIAChange 
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Baseline
        </h3>
        <BaselineTab
          tipoIndicador={tipoIndicador}
          baselineData={baselineData}
          onBaselineChange={onBaselineChange}
        />
      </div>
      
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Pós-IA
        </h3>
        <PostIATab
          tipoIndicador={tipoIndicador}
          baselineData={baselineData}
          postIAData={postIAData}
          onPostIAChange={onPostIAChange}
        />
      </div>
    </div>
  )
}

export default IndicatorGeneric
