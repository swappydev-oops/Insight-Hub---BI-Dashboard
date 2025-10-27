import React, { forwardRef, useState } from 'react';
import type { ChartConfig, DataRow } from '../types';
import ChartWidget from './ChartWidget';
import { ChartIcon } from './icons';

interface DashboardProps {
  charts: ChartConfig[];
  data: DataRow[];
  removeChart: (id: string) => void;
  onEditChart: (id: string) => void;
  onChartDrop: (e: React.DragEvent) => void;
  theme: 'light' | 'dark';
}

const Dashboard = forwardRef<HTMLDivElement, DashboardProps>(({ charts, data, removeChart, onEditChart, onChartDrop, theme }, ref) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    onChartDrop(e);
  };

  const dropZoneBaseClasses = "min-h-full rounded-lg transition-all duration-200";
  const dropZoneActiveClasses = "border-2 border-dashed border-primary bg-primary/10";
  const dropZoneInactiveClasses = "border-2 border-dashed border-transparent";
  
  if (charts.length === 0) {
    return (
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`${dropZoneBaseClasses} ${isDraggingOver ? dropZoneActiveClasses : 'bg-gray-50 dark:bg-[#1f2937] border-gray-300 dark:border-[#374151]'} text-center py-20 px-6`}
      >
        <div className="flex justify-center items-center mb-4">
            <ChartIcon />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-[#f9fafb]">Your Dashboard is Empty</h3>
        <p className="text-gray-500 dark:text-[#d1d5db] mt-2">Drag a chart from the toolbox to start visualizing your data.</p>
      </div>
    );
  }

  return (
    <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`${dropZoneBaseClasses} ${isDraggingOver ? dropZoneActiveClasses : dropZoneInactiveClasses}`}
    >
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {charts.map(config => (
            <ChartWidget
              key={config.id}
              config={config}
              data={data}
              onRemove={removeChart}
              onEdit={onEditChart}
              theme={theme}
            />
          ))}
        </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;