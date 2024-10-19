'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Sample data for charts
const latencyData = [
  { name: 'Jan', latency: 35 },
  { name: 'Feb', latency: 28 },
  { name: 'Mar', latency: 42 },
  { name: 'Apr', latency: 30 },
  { name: 'May', latency: 25 },
  { name: 'Jun', latency: 32 },
];

// Generate sample data for the frequency chart
const generateFrequencyData = () => {
  const data = [];
  const startDate = new Date(2023, 0, 1);
  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 5),
    });
  }
  return data;
};

const frequencyData = generateFrequencyData();

function MetricCard({ title, value, unit }: { title: string; value: number; unit: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl border border-white/20"
    >
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <p className="text-3xl font-bold text-white">
        {value.toLocaleString()} <span className="text-xl font-normal">{unit}</span>
      </p>
    </motion.div>
  );
}

function FrequencyChart() {
  const getColor = (count: number) => {
    const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
    return colors[count];
  };

  const weeks = 53;
  const daysPerWeek = 7;

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)`, gap: '3px' }}>
        {Array.from({ length: weeks }).map((_, weekIndex) => (
          <div key={weekIndex} className="grid grid-rows-7 gap-1">
            {Array.from({ length: daysPerWeek }).map((_, dayIndex) => {
              const dataIndex = weekIndex * daysPerWeek + dayIndex;
              const day = frequencyData[dataIndex];
              return (
                <div
                  key={dayIndex}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: day ? getColor(day.count) : '#161b22' }}
                  title={day ? `${day.date}: ${day.count} contributions` : 'No data'}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsPage() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <h1 className="text-4xl font-bold mb-8 text-center text-white">Analytics Dashboard</h1>

          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard title="Total Hours Saved" value={1234} unit="hours" />
            <MetricCard title="Total Reads" value={5678901} unit="reads" />
            <MetricCard title="Total Writes" value={2345678} unit="writes" />
          </div>

          {/* Latency and Activity Frequency Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latency Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl border border-white/20"
            >
              <h2 className="text-2xl font-semibold mb-4 text-white">Latency (ms)</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={latencyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="latency" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Frequency Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl border border-white/20"
            >
              <h2 className="text-2xl font-semibold mb-4 text-white">Activity Frequency</h2>
              <div className="h-[300px] w-full overflow-x-auto">
                <FrequencyChart />
              </div>
              <div className="mt-4 flex items-center justify-end">
                <span className="text-sm mr-2 text-white">Less</span>
                <div className="flex gap-1">
                  {['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'].map((color, index) => (
                    <div key={index} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <span className="text-sm ml-2 text-white">More</span>
              </div>
            </motion.div>
          </div>

          {/* Random Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard title="Accounts Connected" value={42} unit="accounts" />
            <MetricCard title="Active Users" value={1337} unit="users" />
            <MetricCard title="Data Processed" value={9876} unit="GB" />
          </div>

          {/* Extra space at the bottom */}
          <div className="h-32"></div>
        </motion.div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
