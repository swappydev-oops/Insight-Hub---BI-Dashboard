import React from 'react';
import { ChartType } from '../types';
import { BarChartIcon, LineChartIcon, AreaChartIcon, PieChartIcon, DonutChartIcon, ScatterChartIcon } from './icons';

interface ToolboxItemProps {
    type: ChartType;
    icon: React.ReactNode;
    onDragStart: (e: React.DragEvent, chartType: ChartType) => void;
}

const ToolboxItem: React.FC<ToolboxItemProps> = ({ type, icon, onDragStart }) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-[#374151] cursor-grab transition-colors"
            title={`Drag to add ${type} Chart`}
        >
            {icon}
            <span className="text-sm font-medium text-gray-700 dark:text-[#d1d5db]">{type} Chart</span>
        </div>
    );
};


const chartTypes = [
    { type: ChartType.Bar, icon: <BarChartIcon className="h-5 w-5 text-primary"/> },
    { type: ChartType.Line, icon: <LineChartIcon className="h-5 w-5 text-primary"/> },
    { type: ChartType.Area, icon: <AreaChartIcon className="h-5 w-5 text-primary"/> },
    { type: ChartType.Pie, icon: <PieChartIcon className="h-5 w-5 text-primary"/> },
    { type: ChartType.Donut, icon: <DonutChartIcon className="h-5 w-5 text-primary"/> },
    { type: ChartType.Scatter, icon: <ScatterChartIcon className="h-5 w-5 text-primary"/> },
];

const Toolbox: React.FC = () => {

    const handleDragStart = (e: React.DragEvent, chartType: ChartType) => {
        e.dataTransfer.setData('chartType', chartType);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <aside className="w-64 bg-gray-50 dark:bg-[#1f2937] border-r border-gray-200 dark:border-[#374151] p-4 flex-shrink-0 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-[#f9fafb]">Toolbox</h2>
            <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 px-2">DRAG TO ADD CHART</p>
                {chartTypes.map(({ type, icon }) => (
                    <ToolboxItem
                        key={type}
                        type={type}
                        icon={icon}
                        onDragStart={handleDragStart}
                    />
                ))}
            </div>
        </aside>
    );
};

export default Toolbox;