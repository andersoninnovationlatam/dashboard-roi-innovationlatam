import React from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const BarChart = ({ data, options, horizontal = false, className = '' }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
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
            const value = context.parsed[horizontal ? 'x' : 'y'] || 0
            return `${label}: ${typeof value === 'number' ? value.toLocaleString('pt-BR') : value}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        },
        ticks: {
          color: '#cbd5e1'
        }
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        },
        ticks: {
          color: '#cbd5e1'
        }
      }
    },
    ...options
  }

  return (
    <div className={`w-full ${className}`} style={{ height: '400px' }}>
      <Bar data={data} options={defaultOptions} />
    </div>
  )
}

export default BarChart
