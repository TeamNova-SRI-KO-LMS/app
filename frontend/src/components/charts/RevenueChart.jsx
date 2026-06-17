import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const RevenueChart = ({ data, formatCurrency }) => {
  const processChartData = () => {
    if (!data || data.length === 0) {
      // Default data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const defaultRevenue = [45000, 52000, 48000, 61000, 73000, 85000];

      return {
        labels: months,
        datasets: [
          {
            label: 'Revenue',
            data: defaultRevenue,
            borderColor: 'rgb(251, 146, 60)',
            backgroundColor: 'rgba(251, 146, 60, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2,
          },
        ],
      };
    }

    const labels = data.map(item => item.label || item.month || item.date);
    const values = data.map(item => item.revenue || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: values,
          borderColor: 'rgb(251, 146, 60)',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
        },
      ],
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          family: "'Inter', sans-serif",
        },
        bodyFont: {
          size: 13,
          family: "'Inter', sans-serif",
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (formatCurrency) {
              label += formatCurrency(context.parsed.y);
            } else {
              label += new Intl.NumberFormat('en-LK', {
                style: 'currency',
                currency: 'LKR',
                minimumFractionDigits: 0,
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return new Intl.NumberFormat('en-LK', {
              style: 'currency',
              currency: 'LKR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          },
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
        },
        grid: {
          display: false,
          drawBorder: false,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <div className="h-full">
      <Line data={processChartData()} options={options} />
    </div>
  );
};

export default RevenueChart;

