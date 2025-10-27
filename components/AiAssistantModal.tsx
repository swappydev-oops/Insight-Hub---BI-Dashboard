import React from 'react';
import type { ChartConfig, ChartSuggestion } from '../types';
import { AiIcon } from './icons';

interface AiAssistantModalProps {
    isOpen: boolean;
    isLoading: boolean;
    suggestions: ChartSuggestion[];
    onClose: () => void;
    onAddChart: (config: ChartConfig) => void;
}

const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, isLoading, suggestions, onClose, onAddChart }) => {
    if (!isOpen) return null;

    const handleAddChart = (suggestion: ChartSuggestion) => {
        onAddChart({
            id: Date.now().toString(),
            title: suggestion.title,
            type: suggestion.type,
            xAxis: suggestion.xAxis,
            yAxis: suggestion.yAxis,
            aggregation: suggestion.aggregation,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-[#1f2937] p-6 rounded-lg shadow-xl w-full max-w-2xl border border-gray-200 dark:border-[#374151]">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-[#f9fafb] flex items-center gap-2"><AiIcon/> AI-Powered Insights</h2>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : suggestions.length > 0 ? (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {suggestions.map((s, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-[#374151] p-4 rounded-lg border border-gray-200 dark:border-[#4b5563]">
                                <p className="text-gray-900 dark:text-[#f9fafb] font-semibold">{s.title}</p>
                                <p className="text-gray-600 dark:text-[#d1d5db] text-sm mb-3">{s.description}</p>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                                        {s.type} Chart | X: {s.xAxis} | Y: {s.yAxis} ({s.aggregation})
                                    </div>
                                    <button onClick={() => handleAddChart(s)} className="flex items-center gap-1 text-sm px-3 py-1 rounded-md bg-primary text-white hover:bg-indigo-600 transition-colors">
                                        Add
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-[#d1d5db] text-center h-48 flex items-center justify-center">No suggestions available. The AI might not have been able to process the data.</p>
                )}
                 <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-[#374151] text-gray-800 dark:text-[#f9fafb] hover:bg-gray-300 dark:hover:bg-[#4b5563] transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
};

export default AiAssistantModal;
