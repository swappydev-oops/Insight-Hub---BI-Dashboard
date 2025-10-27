import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { DataRow, ChartConfig, ChartSuggestion } from './types';
import { ChartType, AggregationType } from './types';
import { getAIInsights } from './services/geminiService';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { AiIcon, DownloadIcon, PdfIcon, PngIcon, RefreshIcon, ChangeDataIcon, LogoutIcon } from './components/icons';
import ThemeSwitcher from './components/ThemeSwitcher';
import Toolbox from './components/Toolbox';
import Login from './components/Login';
import { useToast } from './contexts/ToastContext';

const ChartConfigModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: ChartConfig) => void;
    columns: string[];
    chartToEdit: ChartConfig | null;
    newChartType: ChartType | null;
}> = ({ isOpen, onClose, onSave, columns, chartToEdit, newChartType }) => {
    const isEditMode = !!chartToEdit;
    const [title, setTitle] = useState<string>('');
    const [chartType, setChartType] = useState<ChartType>(ChartType.Bar);
    const [xAxis, setXAxis] = useState<string>('');
    const [yAxis, setYAxis] = useState<string>('');
    const [aggregation, setAggregation] = useState<AggregationType>(AggregationType.Count);
    const { addToast } = useToast();

    useEffect(() => {
        if (isEditMode && chartToEdit) {
            setTitle(chartToEdit.title);
            setChartType(chartToEdit.type);
            setXAxis(chartToEdit.xAxis);
            setYAxis(chartToEdit.yAxis);
            setAggregation(chartToEdit.aggregation);
        } else {
            // Reset form for create mode
            setTitle('');
            setChartType(newChartType || ChartType.Bar);
            setXAxis('');
            setYAxis('');
            setAggregation(AggregationType.Count);
        }
    }, [chartToEdit, isEditMode, isOpen, newChartType]);


    const handleSubmit = () => {
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

const AiAssistantModal: React.FC<{
    isOpen: boolean;
    isLoading: boolean;
    suggestions: ChartSuggestion[];
    onClose: () => void;
    onAddChart: (config: ChartConfig) => void;
}> = ({ isOpen, isLoading, suggestions, onClose, onAddChart }) => {
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

const INSIGHTHUB_AUTOSAVE_KEY = 'insighthub-autosave';
const INSIGHTHUB_THEME_KEY = 'insighthub-theme';
const INSIGHTHUB_AUTH_KEY = 'insighthub-auth';

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [data, setData] = useState<DataRow[] | null>(null);
    const [columns, setColumns] = useState<string[]>([]);
    const [charts, setCharts] = useState<ChartConfig[]>([]);
    const [dashboardTitle, setDashboardTitle] = useState<string>('Untitled Dashboard');
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
    const [draggedChartType, setDraggedChartType] = useState<ChartType | null>(null);
    const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<ChartSuggestion[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [fileName, setFileName] = useState<string>('');
    const [isRestored, setIsRestored] = useState<boolean>(false);
    const [sortOption, setSortOption] = useState<string>('date-desc');
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem(INSIGHTHUB_THEME_KEY) as 'light' | 'dark') || 'dark';
    });
    const { addToast } = useToast();
    const dashboardRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
     useEffect(() => {
        const loggedIn = sessionStorage.getItem(INSIGHTHUB_AUTH_KEY) === 'true';
        setIsAuthenticated(loggedIn);
     }, []);

     useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem(INSIGHTHUB_THEME_KEY, theme);
    }, [theme]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const savedStateJSON = localStorage.getItem(INSIGHTHUB_AUTOSAVE_KEY);
        if (savedStateJSON) {
            try {
                const savedState = JSON.parse(savedStateJSON);
                if (savedState.charts && savedState.fileName) {
                    console.log("Restoring dashboard state from localStorage.");
                    setCharts(savedState.charts);
                    setFileName(savedState.fileName);
                    if (savedState.dashboardTitle) {
                        setDashboardTitle(savedState.dashboardTitle);
                    }
                    setIsRestored(true);
                }
            } catch (e) {
                console.error("Failed to parse saved dashboard state", e);
                localStorage.removeItem(INSIGHTHUB_AUTOSAVE_KEY);
            }
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!data) {
            return;
        }

        const debounceSave = setTimeout(() => {
            console.log("Auto-saving dashboard state...");
            const dashboardState = {
                charts,
                fileName,
                dashboardTitle,
            };
            localStorage.setItem(INSIGHTHUB_AUTOSAVE_KEY, JSON.stringify(dashboardState));
        }, 1000); 

        return () => clearTimeout(debounceSave);
    }, [charts, dashboardTitle, fileName, data]);

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileData = e.target?.result;
            if (fileData) {
                const workbook = XLSX.read(fileData, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<DataRow>(worksheet);
                
                setData(jsonData);
                if (jsonData.length > 0) {
                    setColumns(Object.keys(jsonData[0]));
                }
                
                const nameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                
                // Only set new title if it's a new file, not a restored session
                if (!isRestored || fileName !== file.name) {
                     setDashboardTitle(nameWithoutExtension);
                     setCharts([]);
                }
                
                setFileName(file.name);
                setIsRestored(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };
    
    const handleSaveChart = (config: ChartConfig) => {
        if (editingChart) {
            setCharts(prevCharts => 
                prevCharts.map(chart => (chart.id === config.id ? config : chart))
            );
        } else {
            setCharts(prev => [...prev, config]);
        }
        setEditingChart(null);
        setIsBuilderOpen(false);
    };

    const removeChart = (id: string) => {
        setCharts(prev => prev.filter(chart => chart.id !== id));
    };

    const handleOpenEditModal = (id: string) => {
        const chartToEdit = charts.find(c => c.id === id);
        if (chartToEdit) {
            setEditingChart(chartToEdit);
            setDraggedChartType(null);
            setIsBuilderOpen(true);
        }
    };

    const handleGetAIInsights = useCallback(async () => {
        if (!data || data.length === 0) return;
        
        setIsAiAssistantOpen(true);
        setIsAiLoading(true);
        try {
            const sampleData = data.slice(0, 10);
            const suggestions = await getAIInsights(columns, sampleData);
            setAiSuggestions(suggestions);
        } catch (error) {
            console.error("Error getting AI insights:", error);
            setAiSuggestions([]);
        } finally {
            setIsAiLoading(false);
        }
    }, [data, columns]);

    const exportDashboard = async (format: 'png' | 'pdf') => {
        if (!dashboardRef.current) return;
        
        const safeFileName = dashboardTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'dashboard';

        const canvas = await html2canvas(dashboardRef.current, {
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
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
    
    const handleRefresh = () => {
        setCharts([]);
        setIsRestored(false);
        localStorage.removeItem(INSIGHTHUB_AUTOSAVE_KEY);
    };
    
    const handleCloseModal = () => {
        setIsBuilderOpen(false);
        setEditingChart(null);
        setDraggedChartType(null);
    };
    
    const handleChartDrop = (e: React.DragEvent) => {
        const type = e.dataTransfer.getData('chartType') as ChartType;
        if (type && Object.values(ChartType).includes(type)) {
            setDraggedChartType(type);
            setEditingChart(null);
            setIsBuilderOpen(true);
        }
    };

    const sortedCharts = useMemo(() => {
        const sorted = [...charts];
        switch (sortOption) {
            case 'date-asc':
                return sorted.sort((a, b) => parseInt(a.id) - parseInt(b.id));
            case 'date-desc':
                return sorted.sort((a, b) => parseInt(b.id) - parseInt(a.id));
            case 'title-asc':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            case 'title-desc':
                return sorted.sort((a, b) => b.title.localeCompare(a.title));
            case 'type-asc':
                return sorted.sort((a, b) => a.type.localeCompare(b.type));
            default:
                 return sorted.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        }
    }, [charts, sortOption]);

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
        if (e.target) {
            e.target.value = '';
        }
    };

    const handleLogin = (user: string, pass: string): boolean => {
        if (user === 'admin' && pass === 'admin') {
            sessionStorage.setItem(INSIGHTHUB_AUTH_KEY, 'true');
            setIsAuthenticated(true);
            addToast('Login successful. Welcome!', 'success');
            return true;
        }
        return false;
    }

    const handleLogout = () => {
        sessionStorage.removeItem(INSIGHTHUB_AUTH_KEY);
        localStorage.removeItem(INSIGHTHUB_AUTOSAVE_KEY);
        setIsAuthenticated(false);
        // Reset app state
        setData(null);
        setCharts([]);
        setColumns([]);
        setFileName('');
        setDashboardTitle('Untitled Dashboard');
        setIsRestored(false);
        addToast('You have been logged out successfully.', 'info');
    }
    
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#111827] text-gray-900 dark:text-[#f9fafb] transition-colors duration-300 flex flex-col justify-center items-center">
                 <Login onLogin={handleLogin} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#111827] text-gray-900 dark:text-[#f9fafb] transition-colors duration-300 flex flex-col">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .csv"
            />
            <header className="bg-white dark:bg-[#1f2937] border-b border-gray-200 dark:border-[#374151] p-4 flex justify-between items-center sticky top-0 z-40 flex-shrink-0">
                <h1 className="text-2xl font-bold">InsightHub</h1>
                <div className="flex items-center gap-2 md:gap-4">
                    {data && (
                        <>
                            <button onClick={handleGetAIInsights} className="flex items-center gap-2 bg-gray-100 dark:bg-[#374151] text-gray-800 dark:text-[#f9fafb] px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-[#4b5563] transition-colors text-sm">
                                <AiIcon /> <span className="hidden md:inline">AI Insights</span>
                            </button>
                            <button onClick={triggerFileUpload} title="Upload a new data file" className="flex items-center gap-2 bg-gray-100 dark:bg-[#374151] text-gray-800 dark:text-[#f9fafb] px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-[#4b5563] transition-colors text-sm">
                                <ChangeDataIcon /> <span className="hidden md:inline">Change Data</span>
                            </button>
                            <button onClick={handleRefresh} title="Clear dashboard and start over with the same data file" className="flex items-center gap-2 bg-gray-100 dark:bg-[#374151] text-gray-800 dark:text-[#f9fafb] px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-[#4b5563] transition-colors text-sm">
                                <RefreshIcon /> <span className="hidden md:inline">Clear Dashboard</span>
                            </button>
                            <div className="relative group">
                                <button className="flex items-center gap-2 bg-gray-100 dark:bg-[#374151] text-gray-800 dark:text-[#f9fafb] px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-[#4b5563] transition-colors text-sm">
                                   <DownloadIcon/> <span className="hidden md:inline">Export</span>
                                </button>
                                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-[#374151] rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                    <a onClick={() => exportDashboard('png')} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-[#d1d5db] hover:bg-gray-100 dark:hover:bg-[#374151] cursor-pointer"><PngIcon/> PNG</a>
                                    <a onClick={() => exportDashboard('pdf')} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-[#d1d5db] hover:bg-gray-100 dark:hover:bg-[#374151] cursor-pointer"><PdfIcon/> PDF</a>
                                </div>
                            </div>
                        </>
                    )}
                     <ThemeSwitcher theme={theme} setTheme={setTheme} />
                     <button onClick={handleLogout} title="Logout" className="flex items-center gap-2 bg-gray-100 dark:bg-[#374151] text-gray-800 dark:text-[#f9fafb] px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-[#4b5563] transition-colors text-sm">
                        <LogoutIcon /> <span className="hidden md:inline">Logout</span>
                    </button>
                </div>
            </header>
            
            <div className="flex flex-grow overflow-hidden">
                {data ? (
                     <>
                        <Toolbox />
                        <main className="flex-grow p-4 md:p-8 overflow-y-auto">
                            <div className="mb-6 flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <input
                                        type="text"
                                        value={dashboardTitle}
                                        onChange={(e) => setDashboardTitle(e.target.value)}
                                        className="text-2xl font-bold bg-transparent border-0 border-b-2 border-transparent dark:text-white focus:border-primary focus:ring-0 p-0 w-full max-w-lg transition-colors"
                                        placeholder="Untitled Dashboard"
                                        aria-label="Dashboard Title"
                                    />
                                    <p className="text-sm text-gray-500 dark:text-[#d1d5db] mt-1">
                                        <span className="font-medium">Source:</span> {fileName}
                                    </p>
                                </div>
                                {charts.length > 1 && (
                                    <div className="flex items-center gap-2 pt-2">
                                        <label htmlFor="sort-charts" className="text-sm font-medium text-gray-600 dark:text-[#d1d5db]">Sort by</label>
                                        <select
                                            id="sort-charts"
                                            value={sortOption}
                                            onChange={e => setSortOption(e.target.value)}
                                            className="bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-[#4b5563] rounded-md py-1.5 px-2 text-sm text-gray-900 dark:text-[#f9fafb] focus:ring-2 focus:ring-primary focus:outline-none"
                                        >
                                            <option value="date-desc">Newest First</option>
                                            <option value="date-asc">Oldest First</option>
                                            <option value="title-asc">Title (A-Z)</option>
                                            <option value="title-desc">Title (Z-A)</option>
                                            <option value="type-asc">Chart Type</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <Dashboard
                                ref={dashboardRef}
                                charts={sortedCharts}
                                data={data}
                                removeChart={removeChart}
                                onEditChart={handleOpenEditModal}
                                onChartDrop={handleChartDrop}
                                theme={theme}
                            />
                        </main>
                    </>
                ) : (
                     <main className="flex-grow p-4 md:p-8">
                        <FileUpload
                            onFileUpload={handleFileUpload}
                            restoredFileName={isRestored ? fileName : null}
                        />
                    </main>
                )}
            </div>

            <ChartConfigModal 
                isOpen={isBuilderOpen}
                onClose={handleCloseModal}
                onSave={handleSaveChart}
                columns={columns}
                chartToEdit={editingChart}
                newChartType={draggedChartType}
            />
            <AiAssistantModal isOpen={isAiAssistantOpen} isLoading={isAiLoading} suggestions={aiSuggestions} onClose={() => setIsAiAssistantOpen(false)} onAddChart={(config) => handleSaveChart(config)}/>
        </div>
    );
}