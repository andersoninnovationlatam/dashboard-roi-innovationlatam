import React from 'react'
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

const RadarChart = ({ data, options, className = '' }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || ''
            const value = context.parsed.r || 0
            return `${label}: ${typeof value === 'number' ? value.toLocaleString('pt-BR') : value}`
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.2)'
        },
        pointLabels: {
          color: '#cbd5e1',
          font: {
            size: 12
          }
        },
        ticks: {
          color: '#cbd5e1',
          backdropColor: 'transparent'
        }
      }
    },
    ...options
  }

  return (
    <div className={`w-full ${className}`} style={{ height: '400px' }}>
      <Radar data={data} options={defaultOptions} />
    </div>
  )
}

export default RadarChart
