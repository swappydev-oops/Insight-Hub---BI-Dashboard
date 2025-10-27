import React, { useMemo, useRef, useState, useEffect } from 'react';
import type { ChartConfig, DataRow } from '../types';
import { aggregateData } from '../utils/dataProcessor';
import { createSafeFileName } from '../utils/fileUtils';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CloseIcon, EditIcon, EllipsisVerticalIcon, PdfIcon, PngIcon } from './icons';

interface ChartWidgetProps {
    config: ChartConfig;
    data: DataRow[];
    onRemove: (id: string) => void;
    onEdit: (id: string) => void;
    theme: 'light' | 'dark';
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ChartWidget: React.FC<ChartWidgetProps> = ({ config, data, onRemove, onEdit, theme }) => {
    const chartData = useMemo(() => {
        return aggregateData(data, config.xAxis, config.yAxis, config.aggregation);
    }, [data, config]);
    
    const chartWidgetRef = useRef<HTMLDivElement>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    
    const gridStroke = theme === 'dark' ? '#374151' : '#e5e7eb';
    const axisStroke = theme === 'dark' ? '#d1d5db' : '#6b7280';
    const tooltipContentStyle = { 
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', 
        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` 
    };
    const tooltipCursor = { fill: theme === 'dark' ? '#374151' : '#f3f4f6' };

     useEffect(() => {
        // This effect closes the export dropdown menu if the user clicks anywhere else on the page.
        // It's a common UX pattern to make dropdowns feel intuitive.
        const handleClickOutside = (event: MouseEvent) => {
            if (isExportMenuOpen && !event.composedPath().some(el => (el as HTMLElement).id === `export-menu-${config.id}`)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExportMenuOpen, config.id]);

    const exportChart = async (format: 'png' | 'pdf') => {
        setIsExportMenuOpen(false);
        if (!chartWidgetRef.current) return;
        
        const safeFileName = createSafeFileName(config.title, 'chart');

        const canvas = await html2canvas(chartWidgetRef.current, {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            useCORS: true,
            scale: 2,
            letterRendering: true,
        });

        if (format === 'png') {
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `${safeFileName}.png`;
            link.click();
        } else {
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${safeFileName}.pdf`);
        }
    };

    const renderChart = () => {
        switch (config.type) {
            case 'Bar':
                return (
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey={config.xAxis} stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipContentStyle} cursor={tooltipCursor}/>
                        <Legend />
                        <Bar dataKey={config.yAxis} fill="#4f46e5" />
                    </BarChart>
                );
            case 'Line':
                return (
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey={config.xAxis} stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false}/>
                        <Tooltip contentStyle={tooltipContentStyle} cursor={tooltipCursor}/>
                        <Legend />
                        <Line type="monotone" dataKey={config.yAxis} stroke="#4f46e5" strokeWidth={2}/>
                    </LineChart>
                );
            case 'Area':
                return (
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey={config.xAxis} stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false}/>
                        <Tooltip contentStyle={tooltipContentStyle} cursor={tooltipCursor}/>
                        <Legend />
                        <Area type="monotone" dataKey={config.yAxis} stroke="#4f46e5" fillOpacity={1} fill="url(#colorUv)" />
                    </AreaChart>
                );
            case 'Pie':
                return (
                    <PieChart>
                        <Pie data={chartData} dataKey={config.yAxis} nameKey={config.xAxis} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipContentStyle} />
                        <Legend />
                    </PieChart>
                );
            case 'Donut':
                 return (
                    <PieChart>
                        <Pie data={chartData} dataKey={config.yAxis} nameKey={config.xAxis} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" label>
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipContentStyle} />
                        <Legend />
                    </PieChart>
                );
            case 'Scatter':
                return (
                    <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis type="category" dataKey={config.xAxis} name={config.xAxis} stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis type="number" dataKey={config.yAxis} name={config.yAxis} stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false}/>
                        <Tooltip contentStyle={tooltipContentStyle} cursor={{ strokeDasharray: '3 3' }} />
                        <Legend />
                        <Scatter name="Data" data={chartData} fill="#4f46e5" />
                    </ScatterChart>
                );
            default:
                return <p>Unsupported chart type</p>;
        }
    };

    return (
        <div ref={chartWidgetRef} className="bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-[#374151] rounded-lg shadow-lg p-4 flex flex-col h-96">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900 dark:text-[#f9fafb] pr-2" title={config.title}>{config.title}</h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => onEdit(config.id)} className="text-gray-500 dark:text-[#d1d5db] hover:bg-gray-100 dark:hover:bg-[#374151] rounded-full p-1.5 transition-colors" title="Edit Chart">
                        <EditIcon/>
                    </button>
                    <div id={`export-menu-${config.id}`} className="relative">
                        <button onClick={() => setIsExportMenuOpen(prev => !prev)} className="text-gray-500 dark:text-[#d1d5db] hover:bg-gray-100 dark:hover:bg-[#374151] rounded-full p-1 transition-colors">
                            <EllipsisVerticalIcon/>
                        </button>
                        {isExportMenuOpen && (
                             <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-[#374151] rounded-md shadow-lg z-20">
                                <a onClick={() => exportChart('png')} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-[#d1d5db] hover:bg-gray-100 dark:hover:bg-[#374151] cursor-pointer"><PngIcon/> PNG</a>
                                <a onClick={() => exportChart('pdf')} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-[#d1d5db] hover:bg-gray-100 dark:hover:bg-[#374151] cursor-pointer"><PdfIcon/> PDF</a>
                            </div>
                        )}
                    </div>
                    <button onClick={() => onRemove(config.id)} className="text-gray-500 dark:text-[#d1d5db] hover:text-red-500 rounded-full p-1 transition-colors">
                       <CloseIcon/>
                    </button>
                </div>
            </div>
            <div className="flex-grow w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ChartWidget;