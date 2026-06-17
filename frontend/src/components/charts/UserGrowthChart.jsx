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

const UserGrowthChart = ({ data, selectedMetric }) => {
  // Process data based on selected metric
  const processChartData = () => {
    if (!data || data.length === 0) {
      // Default data if no data is available
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const defaultUserData = [12, 19, 25, 32, 45, 58];
      const defaultCourseData = [5, 8, 12, 15, 20, 25];

      return {
        labels: months,
        datasets:
          selectedMetric === 'users'
            ? [
                {
                  label: 'New Users',
                  data: defaultUserData,
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: true,
                  tension: 0.4,
                },
              ]
            : [
                {
                  label: 'New Courses',
                  data: defaultCourseData,
                  borderColor: 'rgb(34, 197, 94)',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  fill: true,
                  tension: 0.4,
                },
              ],
      };
    }

    // Process real data
    const labels = data.map(item => item.label || item.month || item.date);
    const values = data.map(item =>
      selectedMetric === 'users' ? item.users || 0 : item.courses || 0
    );

    return {
      labels,
      datasets:
        selectedMetric === 'users'
          ? [
              {
                label: 'New Users',
                data: values,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2,
              },
            ]
          : [
              {
                label: 'New Courses',
                data: values,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
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
            label += context.parsed.y;
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
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

export default UserGrowthChart;

