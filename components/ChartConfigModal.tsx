import React, { useState, useEffect } from 'react';
import { ChartConfig, ChartType, AggregationType } from '../types';
import { useToast } from '../contexts/ToastContext';

interface ChartConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: ChartConfig) => void;
    columns: string[];
    chartToEdit: ChartConfig | null;
    newChartType: ChartType | null;
}

const ChartConfigModal: React.FC<ChartConfigModalProps> = ({ isOpen, onClose, onSave, columns, chartToEdit, newChartType }) => {
    const isEditMode = !!chartToEdit;
    const [title, setTitle] = useState<string>('');
    const [chartType, setChartType] = useState<ChartType>(ChartType.Bar);
    const [xAxis, setXAxis] = useState<string>('');
    const [yAxis, setYAxis] = useState<string>('');
    const [aggregation, setAggregation] = useState<AggregationType>(AggregationType.Count);
    const { addToast } = useToast();

    useEffect(() => {
        if (isEditMode && chartToEdit) {
            // Populate form with existing chart data for editing
            setTitle(chartToEdit.title);
            setChartType(chartToEdit.type);
            setXAxis(chartToEdit.xAxis);
            setYAxis(chartToEdit.yAxis);
            setAggregation(chartToEdit.aggregation);
        } else {
            // Reset form for create mode, pre-selecting the dragged chart type
            setTitle('');
            setChartType(newChartType || ChartType.Bar);
            setXAxis('');
            setYAxis('');
            setAggregation(AggregationType.Count);
        }
    }, [chartToEdit, isEditMode, isOpen, newChartType]);


    const handleSubmit = () => {
        // Basic form validation
        if (!title || !xAxis || !yAxis) {
            addToast('Please fill out all fields: Title, X-Axis, and Y-Axis.', 'error');
            return;
        }
        onSave({
            id: isEditMode && chartToEdit ? chartToEdit.id : Date.now().toString(),
            title,
            type: chartType,
            xAxis,
            yAxis,
            aggregation,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-[#1f2937] p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-[#374151]">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-[#f9fafb]">{isEditMode ? 'Edit Chart' : 'Configure New Chart'}</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-[#d1d5db] mb-1">Chart Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Sales per Region"
                            className="w-full bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-[#4b5563] rounded-md p-2 text-gray-900 dark:text-[#f9fafb] focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-[#d1d5db] mb-1">Chart Type</label>
                        <select value={chartType} onChange={e => setChartType(e.target.value as ChartType)} className="w-full bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-[#4b5563] rounded-md p-2 text-gray-900 dark:text-[#f9fafb] focus:ring-2 focus:ring-primary focus:outline-none">
                            {Object.values(ChartType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-[#d1d5db] mb-1">X-Axis (Dimension)</label>
                        <select value={xAxis} onChange={e => setXAxis(e.target.value)} className="w-full bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-[#4b5563] rounded-md p-2 text-gray-900 dark:text-[#f9fafb] focus:ring-2 focus:ring-primary focus:outline-none">
                            <option value="">Select Column</option>
                            {columns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-[#d1d5db] mb-1">Y-Axis (Measure)</label>
                        <select value={yAxis} onChange={e => setYAxis(e.target.value)} className="w-full bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-[#4b5563] rounded-md p-2 text-gray-900 dark:text-[#f9fafb] focus:ring-2 focus:ring-primary focus:outline-none">
                            <option value="">Select Column</option>
                            {columns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-[#d1d5db] mb-1">Aggregation</label>
                        <select value={aggregation} onChange={e => setAggregation(e.target.value as AggregationType)} className="w-full bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-[#4b5563] rounded-md p-2 text-gray-900 dark:text-[#f9fafb] focus:ring-2 focus:ring-primary focus:outline-none">
                            {Object.values(AggregationType).map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-[#374151] text-gray-800 dark:text-[#f9fafb] hover:bg-gray-300 dark:hover:bg-[#4b5563] transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-primary text-white hover:bg-indigo-600 transition-colors">{isEditMode ? 'Save Changes' : 'Create Chart'}</button>
                </div>
            </div>
        </div>
    );
};

export default ChartConfigModal;
