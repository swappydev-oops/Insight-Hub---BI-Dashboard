import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { DataRow, ChartConfig, ChartSuggestion } from './types';
import { getAIInsights } from './services/geminiService';
import { getFileNameWithoutExtension, createSafeFileName } from './utils/fileUtils';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import ChartConfigModal from './components/ChartConfigModal';
import AiAssistantModal from './components/AiAssistantModal';
import { AiIcon, DownloadIcon, PdfIcon, PngIcon, RefreshIcon, ChangeDataIcon, LogoutIcon } from './components/icons';
import ThemeSwitcher from './components/ThemeSwitcher';
import Toolbox from './components/Toolbox';
import Login from './components/Login';
import { useToast } from './contexts/ToastContext';

// --- Constants for Local Storage Keys ---
// It's a good practice to keep keys in constants to avoid typos.
const INSIGHTHUB_AUTOSAVE_KEY = 'insighthub-autosave';
const INSIGHTHUB_THEME_KEY = 'insighthub-theme';
const INSIGHTHUB_AUTH_KEY = 'insighthub-auth';

export default function App() {
    // --- Core State Management ---
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [data, setData] = useState<DataRow[] | null>(null); // The raw data from the uploaded file.
    const [columns, setColumns] = useState<string[]>([]); // Column headers from the data.
    const [charts, setCharts] = useState<ChartConfig[]>([]); // User-created chart configurations.
    const [dashboardTitle, setDashboardTitle] = useState<string>('Untitled Dashboard');
    const [fileName, setFileName] = useState<string>('');
    const [isRestored, setIsRestored] = useState<boolean>(false); // Flag for when we load a saved session.

    // --- UI State ---
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [editingChart, setEditingChart] = useState<ChartConfig | null>(null); // Holds the chart being edited.
    const [draggedChartType, setDraggedChartType] = useState<ChartConfig['type'] | null>(null);
    const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<ChartSuggestion[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [sortOption, setSortOption] = useState<string>('date-desc');
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        // Load theme preference from localStorage, defaulting to dark.
        return (localStorage.getItem(INSIGHTHUB_THEME_KEY) as 'light' | 'dark') || 'dark';
    });

    // --- Hooks & Refs ---
    const { addToast } = useToast();
    const dashboardRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
     useEffect(() => {
        // On initial load, check if the user is already logged in via session storage.
        const loggedIn = sessionStorage.getItem(INSIGHTHUB_AUTH_KEY) === 'true';
        setIsAuthenticated(loggedIn);
     }, []);

     useEffect(() => {
        // Apply the dark/light theme to the root HTML element and save the preference.
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem(INSIGHTHUB_THEME_KEY, theme);
    }, [theme]);

    useEffect(() => {
        // If logged in, try to restore the dashboard from a previous session.
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
                    setIsRestored(true); // Let the app know we're in a restored state.
                }
            } catch (e) {
                console.error("Failed to parse saved dashboard state", e);
                localStorage.removeItem(INSIGHTHUB_AUTOSAVE_KEY); // Clear corrupted data.
            }
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // This effect handles auto-saving the dashboard state.
        // It's debounced to avoid writing to localStorage on every single keystroke or change,
        // which improves performance. It only saves when the user has stopped making changes for 1 second.
        if (!data) { // Don't save if there's no data loaded.
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
                
                // Only reset the dashboard if it's a completely new file,
                // not the one we're re-uploading for a restored session.
                if (!isRestored || fileName !== file.name) {
                     setDashboardTitle(getFileNameWithoutExtension(file.name));
                     setCharts([]);
                }
                
                setFileName(file.name);
                setIsRestored(false); // Reset the restored flag after upload.
            }
        };
        reader.readAsArrayBuffer(file);
    };
    
    const handleSaveChart = (config: ChartConfig) => {
        if (editingChart) { // If we are in "edit" mode
            setCharts(prevCharts => 
                prevCharts.map(chart => (chart.id === config.id ? config : chart))
            );
        } else { // If we are in "create" mode
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
            setDraggedChartType(null); // Ensure we're not in drag-and-drop mode
            setIsBuilderOpen(true);
        }
    };

    const handleGetAIInsights = useCallback(async () => {
        if (!data || data.length === 0) return;
        
        setIsAiAssistantOpen(true);
        setIsAiLoading(true);
        try {
            // Send a sample of the data to Gemini for analysis to keep the request payload small.
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
        
        const safeFileName = createSafeFileName(dashboardTitle, 'dashboard');

        // Using html2canvas to capture the state of the DOM.
        // Important options: `letterRendering: true` helps fix text spacing issues.
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
    
    const handleClearDashboard = () => {
        setCharts([]);
    };
    
    const handleCloseModal = () => {
        setIsBuilderOpen(false);
        setEditingChart(null);
        setDraggedChartType(null);
    };
    
    const handleChartDrop = (e: React.DragEvent) => {
        const type = e.dataTransfer.getData('chartType') as ChartConfig['type'];
        const chartTypes = ['Bar', 'Line', 'Area', 'Pie', 'Donut', 'Scatter'];
        if (type && chartTypes.includes(type)) {
            setDraggedChartType(type);
            setEditingChart(null); // Ensure we're not in edit mode
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
                 return sorted.sort((a, b) => parseInt(b.id) - parseInt(a.id)); // Default to newest first
        }
    }, [charts, sortOption]);

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
        // Reset the input value to allow uploading the same file again.
        if (e.target) {
            e.target.value = '';
        }
    };

    const handleLogin = (user: string, pass: string): boolean => {
        // In a real app, this would be a call to a backend service.
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
        // Reset the entire app state to its initial form.
        setData(null);
        setCharts([]);
        setColumns([]);
        setFileName('');
        setDashboardTitle('Untitled Dashboard');
        setIsRestored(false);
        addToast('You have been logged out.', 'info');
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
                            <button onClick={handleClearDashboard} title="Clear all charts from the dashboard" className="flex items-center gap-2 bg-gray-100 dark:bg-[#374151] text-gray-800 dark:text-[#f9fafb] px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-[#4b5563] transition-colors text-sm">
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
            <AiAssistantModal 
                isOpen={isAiAssistantOpen} 
                isLoading={isAiLoading} 
                suggestions={aiSuggestions} 
                onClose={() => setIsAiAssistantOpen(false)} 
                onAddChart={(config) => handleSaveChart(config)}
            />
        </div>
    );
}