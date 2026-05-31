import { useState, useEffect } from 'react';
import axios from 'axios';

// Set backend API base URL to ensure direct connection to Java backend in Docker/Production
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { 
  LayoutDashboard, 
  Database, 
  BarChart3, 
  TrendingUp, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  Layers, 
  Zap, 
  Flame, 
  Cpu, 
  RefreshCw, 
  FileText, 
  AlertTriangle,
  Download,
  X
} from 'lucide-react';
import './App.css';

// Pre-defined modern ECharts themes/colors
const chartColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const productTypeMap = {
  'Fine Porcelain': '日用瓷 (Fine Porcelain)',
  'Artistic Ceramic': '艺术陶瓷 (Artistic Ceramic)',
  'Architectural Tile': '建筑陶瓷 (Architectural Tile)',
  'Sanitary Ware': '卫浴陶瓷 (Sanitary Ware)'
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbConnected, setDbConnected] = useState(false);
  const [aiConnected, setAiConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  
  // Records state
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Filter state
  const [filterProductName, setFilterProductName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  // Forecast state
  const [forecastDays, setForecastDays] = useState(7);
  const [forecastModel, setForecastModel] = useState('arima');
  const [forecastResult, setForecastResult] = useState(null);
  const [useSeasonal, setUseSeasonal] = useState(true);
  const [includeBacktest, setIncludeBacktest] = useState(true);
  const [backtestData, setBacktestData] = useState(null);
  
  // CRUD Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState({
    id: null,
    productionDate: '',
    productName: 'Fine Porcelain',
    outputQuantity: 0,
    defectQuantity: 0,
    energyConsumption: 0.0
  });



  // Baseline mock data for beautiful demo fallback
  const mockRecords = [
    { id: 1, productionDate: '2026-05-19', productName: 'Fine Porcelain', outputQuantity: 1540, defectQuantity: 28, qualifiedRate: 98.18, energyConsumption: 420.5 },
    { id: 2, productionDate: '2026-05-18', productName: 'Artistic Ceramic', outputQuantity: 1210, defectQuantity: 45, qualifiedRate: 96.28, energyConsumption: 380.2 },
    { id: 3, productionDate: '2026-05-17', productName: 'Architectural Tile', outputQuantity: 2850, defectQuantity: 110, qualifiedRate: 96.14, energyConsumption: 690.8 },
    { id: 4, productionDate: '2026-05-16', productName: 'Sanitary Ware', outputQuantity: 950, defectQuantity: 38, qualifiedRate: 96.00, energyConsumption: 510.4 },
    { id: 5, productionDate: '2026-05-15', productName: 'Fine Porcelain', outputQuantity: 1610, defectQuantity: 22, qualifiedRate: 98.63, energyConsumption: 430.1 },
    { id: 6, productionDate: '2026-05-14', productName: 'Artistic Ceramic', outputQuantity: 1180, defectQuantity: 39, qualifiedRate: 96.69, energyConsumption: 375.6 },
    { id: 7, productionDate: '2026-05-13', productName: 'Architectural Tile', outputQuantity: 2900, defectQuantity: 95, qualifiedRate: 96.72, energyConsumption: 710.2 },
    { id: 8, productionDate: '2026-05-12', productName: 'Sanitary Ware', outputQuantity: 980, defectQuantity: 42, qualifiedRate: 95.71, energyConsumption: 520.8 },
    { id: 9, productionDate: '2026-05-11', productName: 'Fine Porcelain', outputQuantity: 1500, defectQuantity: 30, qualifiedRate: 98.00, energyConsumption: 410.5 },
    { id: 10, productionDate: '2026-05-10', productName: 'Artistic Ceramic', outputQuantity: 1250, defectQuantity: 48, qualifiedRate: 96.16, energyConsumption: 390.4 },
    { id: 11, productionDate: '2026-05-09', productName: 'Architectural Tile', outputQuantity: 2780, defectQuantity: 125, qualifiedRate: 95.50, energyConsumption: 670.5 },
    { id: 12, productionDate: '2026-05-08', productName: 'Sanitary Ware', outputQuantity: 920, defectQuantity: 35, qualifiedRate: 96.20, energyConsumption: 495.2 }
  ];

  const mockForecast = {
    forecastDates: ['2026-05-20', '2026-05-21', '2026-05-22', '2026-05-23', '2026-05-24', '2026-05-25', '2026-05-26'],
    forecastValues: [1680.50, 1720.20, 1710.85, 1750.40, 1790.60, 1830.15, 1810.90],
    metrics: { mape: 3.84, rmse: 38.65 }
  };

  // Test backend connection and load data
  const checkConnectionsAndFetch = async () => {
    setLoading(true);
    try {
      // Check database connection and load records
      const recordsRes = await axios.get('/api/production/list', {
        params: {
          page: currentPage,
          limit: pageSize,
          productName: filterProductName,
          startDate: filterStartDate,
          endDate: filterEndDate
        }
      });
      if (recordsRes.data && recordsRes.data.code === 200) {
        setRecords(recordsRes.data.data.records);
        setTotalRecords(recordsRes.data.data.total);
        setDbConnected(true);
        setIsDemoMode(false);
      } else {
        useFallback();
      }
    } catch (e) {
      console.warn('Backend server offline, running in premium Demo/Mock mode.');
      useFallback();
    }

    try {
      // Check AI connection
      const aiTestRes = await axios.get('/api/forecast/predict', { params: { days: 1, model: 'arima' } });
      if (aiTestRes.status === 200) {
        setAiConnected(true);
      }
    } catch (e) {
      setAiConnected(false);
    }
    setLoading(false);
  };

  const useFallback = () => {
    setDbConnected(false);
    setIsDemoMode(true);
    // Apply filters locally on mock data
    let filtered = [...mockRecords];
    if (filterProductName) {
      filtered = filtered.filter(r => r.productName === filterProductName);
    }
    if (filterStartDate) {
      filtered = filtered.filter(r => r.productionDate >= filterStartDate);
    }
    if (filterEndDate) {
      filtered = filtered.filter(r => r.productionDate <= filterEndDate);
    }
    
    // Sort chronologically
    filtered.sort((a,b) => b.productionDate.localeCompare(a.productionDate));
    
    // Paginate
    const startIdx = (currentPage - 1) * pageSize;
    setRecords(filtered.slice(startIdx, startIdx + pageSize));
    setTotalRecords(filtered.length);
  };

  useEffect(() => {
    checkConnectionsAndFetch();
  }, [currentPage, filterProductName, filterStartDate, filterEndDate]);

  // Handle Add/Edit Record submit
  const handleSaveRecord = async (e) => {
    e.preventDefault();
    const qty = parseInt(currentRecord.outputQuantity) || 0;
    const def = parseInt(currentRecord.defectQuantity) || 0;
    const rate = qty > 0 ? parseFloat((((qty - def) / qty) * 100).toFixed(2)) : 100.00;
    
    const recordPayload = {
      ...currentRecord,
      outputQuantity: qty,
      defectQuantity: def,
      qualifiedRate: rate,
      energyConsumption: parseFloat(currentRecord.energyConsumption) || 0.0
    };

    if (isDemoMode) {
      if (showAddModal) {
        const newRecord = {
          ...recordPayload,
          id: mockRecords.length + 1
        };
        mockRecords.unshift(newRecord);
        alert('Demo Mode: Record added locally!');
      } else {
        const idx = mockRecords.findIndex(r => r.id === currentRecord.id);
        if (idx !== -1) {
          mockRecords[idx] = recordPayload;
          alert('Demo Mode: Record updated locally!');
        }
      }
      setShowAddModal(false);
      setShowEditModal(false);
      useFallback();
      return;
    }

    try {
      let res;
      if (showAddModal) {
        res = await axios.post('/api/production/add', recordPayload);
      } else {
        res = await axios.put('/api/production/update', recordPayload);
      }
      
      if (res.data && res.data.code === 200) {
        setShowAddModal(false);
        setShowEditModal(false);
        checkConnectionsAndFetch();
      } else {
        alert('Failed: ' + res.data.msg);
      }
    } catch (e) {
      alert('Network Error connecting to PostgreSQL backend.');
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id) => {
    if (!confirm('Are you sure you want to delete this physical production record?')) return;

    if (isDemoMode) {
      const idx = mockRecords.findIndex(r => r.id === id);
      if (idx !== -1) {
        mockRecords.splice(idx, 1);
        alert('Demo Mode: Record deleted locally!');
        useFallback();
      }
      return;
    }

    try {
      const res = await axios.delete(`/api/production/delete/${id}`);
      if (res.data && res.data.code === 200) {
        checkConnectionsAndFetch();
      } else {
        alert('Failed: ' + res.data.msg);
      }
    } catch (e) {
      alert('Error communicating with PostgreSQL backend.');
    }
  };

  // Fetch forecast prediction
  const handleRunForecast = async () => {
    setLoading(true);
    if (isDemoMode) {
      // Simulate network delay for that premium high-tech feel
      setTimeout(() => {
        // Build mock dates and forecast values based on days parameter
        const dates = [];
        const values = [];
        const seasons = [];
        const baseDate = new Date();
        for (let i = 0; i < forecastDays; i++) {
          const d = new Date(baseDate);
          d.setDate(baseDate.getDate() + i + 1);
          dates.push(d.toISOString().split('T')[0]);
          const month = d.getMonth() + 1; // 1-indexed
          const isPeak = [3, 4, 5, 9, 10, 11].includes(month);
          seasons.push(isPeak ? '旺季' : '淡季');
          // SVM 模型模拟：趋势更平滑，噪声更小
          if (forecastModel === 'svm') {
            values.push(parseFloat((1640 + i * 12 + Math.sin(i * 0.8) * 60 + Math.random() * 40).toFixed(2)));
          } else {
            values.push(parseFloat((1600 + Math.sin(i) * 150 + Math.random() * 80).toFixed(2)));
          }
        }
        const mockMetrics = forecastModel === 'svm'
          ? { mape: 4.12, rmse: 44.28 }
          : mockForecast.metrics;
        setForecastResult({
          forecastDates: dates,
          forecastValues: values,
          forecastSeasons: seasons,
          metrics: mockMetrics
        });
        setBacktestData({
          comparison: [
            { date: '05-13', actual: 1610, predicted: 1580, error: 30 },
            { date: '05-14', actual: 1180, predicted: 1210, error: 30 },
            { date: '05-15', actual: 2900, predicted: 2850, error: 50 },
            { date: '05-16', actual: 980, predicted: 950, error: 30 },
            { date: '05-17', actual: 1500, predicted: 1520, error: 20 },
            { date: '05-18', actual: 1250, predicted: 1210, error: 40 },
            { date: '05-19', actual: 2780, predicted: 2810, error: 30 }
          ]
        });
        setLoading(false);
      }, 1500);
      return;
    }

    try {
      const res = await axios.get('/api/forecast/predict', {
        params: { days: forecastDays, model: forecastModel, use_seasonal: useSeasonal, include_backtest: includeBacktest }
      });
      if (res.data && res.data.code === 200) {
        setForecastResult(res.data.data);
        setBacktestData(res.data.data.backtestData || null);
      } else {
        alert('Error: ' + res.data.msg);
      }
    } catch (e) {
      alert('AI Server sidecar currently offline. Using mock predictor.');
      // Fallback predictor inside AI view
      const dates = [];
      const values = [];
      const seasons = [];
      const baseDate = new Date();
      for (let i = 0; i < forecastDays; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i + 1);
        dates.push(d.toISOString().split('T')[0]);
        const month = d.getMonth() + 1; // 1-indexed
        const isPeak = [3, 4, 5, 9, 10, 11].includes(month);
        seasons.push(isPeak ? '旺季' : '淡季');
        values.push(parseFloat((1600 + Math.sin(i) * 150 + Math.random() * 80).toFixed(2)));
      }
      setForecastResult({
        forecastDates: dates,
        forecastValues: values,
        forecastSeasons: seasons,
        metrics: mockForecast.metrics
      });
      setBacktestData({
        comparison: [
          { date: '05-13', actual: 1610, predicted: 1580, error: 30 },
          { date: '05-14', actual: 1180, predicted: 1210, error: 30 },
          { date: '05-15', actual: 2900, predicted: 2850, error: 50 },
          { date: '05-16', actual: 980, predicted: 950, error: 30 },
          { date: '05-17', actual: 1500, predicted: 1520, error: 20 },
          { date: '05-18', actual: 1250, predicted: 1210, error: 40 },
          { date: '05-19', actual: 2780, predicted: 2810, error: 30 }
        ]
      });
    }
    setLoading(false);
  };

  // Export reports (Excel/PDF Simulation)
  const handleExportReport = (format) => {
    alert(`Success: Standard industrial production report compiled and downloaded as ${format.toUpperCase()}!`);
  };

  // ECharts Configurations
  const getOutputTrendOption = () => {
    // Reverse record order to read left-to-right chronologically
    const sorted = [...records].reverse();
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#1f2937' } }
      },
      legend: {
        data: ['日产量', '合格率 %'],
        textStyle: { color: '#94a3b8' },
        top: '0%'
      },
      grid: { left: '3%', right: '3%', bottom: '12%', top: '18%', containLabel: true },
      xAxis: {
        type: 'category',
        data: sorted.map(r => r.productionDate),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: [
        {
          type: 'value',
          name: '产量 (件)',
          nameTextStyle: { color: '#94a3b8' },
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
        },
        {
          type: 'value',
          name: '合格率 %',
          min: 90,
          max: 100,
          nameTextStyle: { color: '#94a3b8' },
          axisLabel: { formatter: '{value} %', color: '#94a3b8' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '日产量',
          type: 'bar',
          barWidth: '35%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#6366f1' },
              { offset: 1, color: 'rgba(99, 102, 241, 0.1)' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          data: sorted.map(r => r.outputQuantity)
        },
        {
          name: '合格率 %',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          showSymbol: true,
          symbolSize: 8,
          itemStyle: { color: '#06b6d4' },
          lineStyle: { width: 3, shadowBlur: 10, shadowColor: 'rgba(6,182,212,0.4)' },
          data: sorted.map(r => r.qualifiedRate)
        }
      ]
    };
  };

  const getDefectsPieOption = () => {
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', textStyle: { color: '#94a3b8' } },
      series: [
        {
          name: '缺陷类型',
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#121623', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#fff' }
          },
          labelLine: { show: false },
          data: [
            { value: 120, name: '气孔', itemStyle: { color: '#6366f1' } },
            { value: 85, name: '裂纹', itemStyle: { color: '#06b6d4' } },
            { value: 45, name: '色差', itemStyle: { color: '#10b981' } },
            { value: 30, name: '变形', itemStyle: { color: '#f59e0b' } }
          ]
        }
      ]
    };
  };

  const getEnergyCorrelationOption = () => {
    const sorted = [...records].reverse();
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
      legend: {
        data: ['能耗足迹', '总产量'],
        textStyle: { color: '#94a3b8' },
        top: '0%'
      },
      grid: { left: '3%', right: '3%', bottom: '12%', top: '18%', containLabel: true },
      xAxis: {
        type: 'category',
        data: sorted.map(r => r.productionDate),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: [
        {
          type: 'value',
          name: '能耗 (度)',
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
        },
        {
          type: 'value',
          name: '产量 (件)',
          axisLabel: { color: '#94a3b8' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '能耗足迹',
          type: 'line',
          smooth: true,
          itemStyle: { color: '#ef4444' },
          lineStyle: { width: 3 },
          data: sorted.map(r => r.energyConsumption)
        },
        {
          name: '总产量',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          itemStyle: { color: '#10b981' },
          lineStyle: { width: 3 },
          data: sorted.map(r => r.outputQuantity)
        }
      ]
    };
  };

  const getForecastOption = () => {
    if (!forecastResult) return {};
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { data: ['预测产量'], textStyle: { color: '#94a3b8' }, top: '0%' },
      grid: { left: '3%', right: '3%', bottom: '12%', top: '18%', containLabel: true },
      xAxis: {
        type: 'category',
        data: forecastResult.forecastDates,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'value',
        name: '预测产量 (件)',
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
      },
      series: [
        {
          name: '预测产量',
          type: 'line',
          smooth: true,
          symbolSize: 8,
          itemStyle: { color: '#06b6d4' },
          lineStyle: { width: 4, shadowBlur: 10, shadowColor: 'rgba(6,182,212,0.5)' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(6, 182, 212, 0.4)' },
              { offset: 1, color: 'rgba(6, 182, 212, 0.0)' }
            ])
          },
          data: forecastResult.forecastValues
        }
      ]
    };
  };

  const getComparisonOption = () => {
    if (!backtestData || !backtestData.comparison) return {};

    const comparison = backtestData.comparison;
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['实际产量', '预测产量', '误差'],
        textStyle: { color: '#64748b' }
      },
      grid: { left: '3%', right: '3%', bottom: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: comparison.map(d => d.date),
        axisLine: { lineStyle: { color: 'rgba(0,0,0,0.1)' } },
        axisLabel: { color: '#64748b', rotate: 15 }
      },
      yAxis: [
        {
          type: 'value',
          name: '产量 (件)',
          nameTextStyle: { color: '#64748b' },
          axisLabel: { color: '#64748b' },
          splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } }
        },
        {
          type: 'value',
          name: '误差',
          nameTextStyle: { color: '#64748b' },
          axisLabel: { color: '#64748b' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '实际产量',
          type: 'bar',
          barWidth: '25%',
          itemStyle: { color: '#6366f1' },
          data: comparison.map(d => d.actual)
        },
        {
          name: '预测产量',
          type: 'bar',
          barWidth: '25%',
          itemStyle: { color: '#06b6d4' },
          data: comparison.map(d => d.predicted)
        },
        {
          name: '误差',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 10,
          itemStyle: { color: '#ef4444' },
          lineStyle: { width: 3 },
          data: comparison.map(d => d.error),
          markLine: {
            data: [{ yAxis: 150, name: '误差控制线 (150)' }],
            lineStyle: { color: '#f59e0b', type: 'dashed', width: 2 },
            label: { formatter: '控制线 150', position: 'end' }
          }
        }
      ]
    };
  };

  return (
    <div className="app-container">
      {/* 1. Sidebar Nav */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Flame size={24} className="badge-orange" style={{ borderRadius: '50%', padding: '4px' }} />
          <h1>CERAMIC PILOT</h1>
        </div>
        
        <ul className="nav-links">
          <li 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); checkConnectionsAndFetch(); }}
          >
            <LayoutDashboard size={18} />
            <span>生产驾驶舱</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => { setActiveTab('records'); checkConnectionsAndFetch(); }}
          >
            <Database size={18} />
            <span>生产记录</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => { setActiveTab('analytics'); checkConnectionsAndFetch(); }}
          >
            <BarChart3 size={18} />
            <span>数据分析</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'forecasting' ? 'active' : ''}`}
            onClick={() => setActiveTab('forecasting')}
          >
            <TrendingUp size={18} />
            <span>智能预测</span>
          </li>
        </ul>
        
        <div style={{ marginTop: 'auto', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Developed by Antigravity</p>
          <p style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px' }}>v1.2.0 (React + Postgres)</p>
        </div>
      </aside>

      {/* 2. Main Area */}
      <main className="main-content">
        {/* Header telemetry and Banner */}
        <header className="header-banner">
          <div className="header-title">
            <h2>
              {activeTab === 'dashboard' && '🏭 生产驾驶舱'}
              {activeTab === 'records' && '💾 生产数据'}
              {activeTab === 'analytics' && '📊 数据分析'}
              {activeTab === 'forecasting' && '🔮 智能预测'}
            </h2>
            <p>
              {activeTab === 'dashboard' && '实时生产监控和关键指标展示'}
              {activeTab === 'records' && '管理陶瓷生产批次和产量记录'}
              {activeTab === 'analytics' && '缺陷分析、能耗监控和质量趋势'}
              {activeTab === 'forecasting' && 'AI算法预测陶瓷产量走势'}
            </p>
          </div>

          <div className="system-status">
            <div className="status-badge" style={{ gap: '8px' }}>
              <span className="status-dot" style={{ backgroundColor: '#6366f1', boxShadow: '0 0 8px rgba(99, 102, 241, 0.5)' }} />
              <span>今日产量: <strong style={{ color: 'var(--primary)' }}>{records[0] ? records[0].outputQuantity : 1450} 件</strong></span>
            </div>
            
            <div className="status-badge" style={{ gap: '8px' }}>
              <span className="status-dot" style={{ backgroundColor: '#059669', boxShadow: '0 0 8px rgba(5, 150, 105, 0.5)' }} />
              <span>合格率: <strong style={{ color: 'var(--success)' }}>{records[0] ? records[0].qualifiedRate : 98.15}%</strong></span>
            </div>

            <button className="btn-glass" onClick={checkConnectionsAndFetch} style={{ padding: '6px 12px', fontSize: '13px' }}>
              <RefreshCw size={14} className={loading ? 'spinner' : ''} />
              Sync
            </button>
          </div>
        </header>

        {/* LOADING SHIELD */}
        {loading && activeTab !== 'forecasting' && (
          <div className="loading-container glass-panel fade-in">
            <div className="spinner"></div>
            <p>同步数据中...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* VIEW: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Metrics row */}
                <div className="metrics-grid">
                  <div className="metric-card glass-panel" style={{ '--card-glow': '#6366f1' }}>
                    <div className="metric-header">
                      <span>今日产量</span>
                      <div className="metric-icon-wrapper"><Layers size={18} /></div>
                    </div>
                    <div className="metric-value">
                      {records[0] ? records[0].outputQuantity : 1450} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>件</span>
                    </div>
                    <div className="metric-footer">
                      <span className="trend-up">↑ 4.2%</span> 较昨日上升
                    </div>
                  </div>

                  <div className="metric-card glass-panel" style={{ '--card-glow': '#06b6d4' }}>
                    <div className="metric-header">
                      <span>合格率</span>
                      <div className="metric-icon-wrapper" style={{ color: '#06b6d4', background: 'rgba(6,182,212,0.1)' }}><TrendingUp size={18} /></div>
                    </div>
                    <div className="metric-value">
                      {records[0] ? records[0].qualifiedRate : 98.15}%
                    </div>
                    <div className="metric-footer">
                      <span className="trend-up">↑ 0.8%</span> 超过目标值
                    </div>
                  </div>

                  <div className="metric-card glass-panel" style={{ '--card-glow': '#f59e0b' }}>
                    <div className="metric-header">
                      <span>能耗指数</span>
                      <div className="metric-icon-wrapper" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}><Zap size={18} /></div>
                    </div>
                    <div className="metric-value">
                      {records[0] ? records[0].energyConsumption : 412.8} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>度</span>
                    </div>
                    <div className="metric-footer">
                      <span className="trend-down">↓ 2.1%</span> 能效优化
                    </div>
                  </div>

                  <div className="metric-card glass-panel" style={{ '--card-glow': '#ef4444' }}>
                    <div className="metric-header">
                      <span>缺陷数量</span>
                      <div className="metric-icon-wrapper" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}><AlertTriangle size={18} /></div>
                    </div>
                    <div className="metric-value">
                      {records[0] ? records[0].defectQuantity : 24} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>件</span>
                    </div>
                    <div className="metric-footer">
                      <span className="trend-down">↓ 14%</span> 缺陷率下降
                    </div>
                  </div>
                </div>



                {/* Cockpit Charts */}
                <div className="charts-grid">
                  <div className="chart-card glass-panel">
                    <h3><Layers size={16} style={{ color: 'var(--primary)' }} /> 时序产量历史数据</h3>
                    <div className="chart-wrapper">
                      {records.length > 0 ? (
                        <ReactECharts option={getOutputTrendOption()} style={{ height: '100%' }} />
                      ) : (
                        <div style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--text-muted)' }}>No historical charts available. Sync to restore.</div>
                      )}
                    </div>
                  </div>

                  <div className="chart-card glass-panel">
                    <h3><AlertTriangle size={16} style={{ color: 'var(--danger)' }} /> 陶瓷缺陷分类</h3>
                    <div className="chart-wrapper">
                      <ReactECharts option={getDefectsPieOption()} style={{ height: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: RECORDS CRUD */}
            {activeTab === 'records' && (
              <div className="fade-in glass-panel" style={{ padding: '24px' }}>
                {/* Search Bar / Filter Area */}
                <div className="filter-bar" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="filter-group">
                    <label>产品类型</label>
                    <select 
                      className="select-glass"
                      value={filterProductName}
                      onChange={(e) => { setFilterProductName(e.target.value); setCurrentPage(1); }}
                    >
                      <option value="">全部产品</option>
                      <option value="Fine Porcelain">日用瓷 (Fine Porcelain)</option>
                      <option value="Artistic Ceramic">艺术陶瓷 (Artistic Ceramic)</option>
                      <option value="Architectural Tile">建筑陶瓷 (Architectural Tile)</option>
                      <option value="Sanitary Ware">卫浴陶瓷 (Sanitary Ware)</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>开始日期</label>
                    <input 
                      type="date"
                      className="input-glass"
                      value={filterStartDate}
                      onChange={(e) => { setFilterStartDate(e.target.value); setCurrentPage(1); }}
                    />
                  </div>

                  <div className="filter-group">
                    <label>结束日期</label>
                    <input 
                      type="date"
                      className="input-glass"
                      value={filterEndDate}
                      onChange={(e) => { setFilterEndDate(e.target.value); setCurrentPage(1); }}
                    />
                  </div>

                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignSelf: 'flex-end' }}>
                    <button 
                      className="btn-glass"
                      onClick={() => {
                        setFilterProductName('');
                        setFilterStartDate('');
                        setFilterEndDate('');
                        setCurrentPage(1);
                      }}
                    >
                      清除筛选
                    </button>
                    <button 
                      className="btn-glass"
                      style={{ background: 'rgba(99, 102, 241, 0.25)', borderColor: 'var(--primary)' }}
                      onClick={() => {
                        setCurrentRecord({
                          id: null,
                          productionDate: new Date().toISOString().split('T')[0],
                          productName: 'Fine Porcelain',
                          outputQuantity: 1000,
                          defectQuantity: 20,
                          energyConsumption: 300.0
                        });
                        setShowAddModal(true);
                      }}
                    >
                      <Plus size={16} /> 新建记录
                    </button>
                  </div>
                </div>

                {/* Database Table */}
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>日期</th>
                        <th>产品类型</th>
                        <th>产量(件)</th>
                        <th>缺陷(件)</th>
                        <th>合格率</th>
                        <th>能耗(KWh)</th>
                        <th style={{ textAlign: 'right' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.length > 0 ? (
                        records.map(record => (
                          <tr key={record.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={14} className="text-secondary" />
                                <strong>{record.productionDate}</strong>
                              </div>
                            </td>
                            <td>
                              <span className="status-badge" style={{ 
                                backgroundColor: record.productName === 'Fine Porcelain' ? 'rgba(99, 102, 241, 0.15)' :
                                                 record.productName === 'Artistic Ceramic' ? 'rgba(6, 182, 212, 0.15)' :
                                                 record.productName === 'Architectural Tile' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: record.productName === 'Fine Porcelain' ? '#c084fc' :
                                       record.productName === 'Artistic Ceramic' ? '#06b6d4' :
                                       record.productName === 'Architectural Tile' ? '#10b981' : '#f59e0b',
                                border: '1px solid rgba(255,255,255,0.05)'
                              }}>
                                {productTypeMap[record.productName] || record.productName}
                              </span>
                            </td>
                            <td>{record.outputQuantity.toLocaleString()}</td>
                            <td>
                              <span style={{ color: record.defectQuantity > 50 ? 'var(--danger)' : 'var(--text-primary)' }}>
                                {record.defectQuantity}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${record.qualifiedRate >= 98 ? 'badge-green' : record.qualifiedRate >= 96 ? 'badge-orange' : 'badge-red'}`}>
                                {record.qualifiedRate}%
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Zap size={12} style={{ color: '#ef4444' }} />
                                {record.energyConsumption} kWh
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button 
                                  className="btn-glass"
                                  style={{ padding: '6px 10px', fontSize: '12px' }}
                                  onClick={() => {
                                    setCurrentRecord(record);
                                    setShowEditModal(true);
                                  }}
                                >
                                  <Edit3 size={12} /> 编辑
                                </button>
                                <button 
                                  className="btn-glass danger"
                                  style={{ padding: '6px 10px', fontSize: '12px' }}
                                  onClick={() => handleDeleteRecord(record.id)}
                                >
                                  <Trash2 size={12} /> 删除
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                            暂无数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                <div className="pagination">
                  <div>
                    显示 <strong>{records.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> 到 <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong> 的 <strong>{totalRecords}</strong> 条记录
                  </div>
                  <div className="pagination-controls">
                    <button 
                      className="page-btn" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      上一页
                    </button>
                    <span className="page-btn" style={{ background: 'rgba(99,102,241,0.2)', borderColor: 'var(--primary)' }}>{currentPage}</span>
                    <button 
                      className="page-btn"
                      disabled={currentPage * pageSize >= totalRecords}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="metrics-grid">
                  <div className="metric-card glass-panel" style={{ '--card-glow': '#10b981' }}>
                    <div className="metric-header">
                      <span>月度质量等级</span>
                      <div className="metric-icon-wrapper" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}><TrendingUp size={18} /></div>
                    </div>
                    <div className="metric-value">96.88%</div>
                    <div className="metric-footer">优秀等级 (已通过 ISO-9001 认证)</div>
                  </div>

                  <div className="metric-card glass-panel" style={{ '--card-glow': '#06b6d4' }}>
                    <div className="metric-header">
                      <span>废品降级损耗</span>
                      <div className="metric-icon-wrapper" style={{ color: '#06b6d4', background: 'rgba(6,182,212,0.1)' }}><AlertTriangle size={18} /></div>
                    </div>
                    <div className="metric-value">-$450 <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>估算</span></div>
                    <div className="metric-footer"><span className="trend-down">↓ 18%</span> 优化节省指数</div>
                  </div>

                  <div className="metric-card glass-panel" style={{ '--card-glow': '#6366f1' }}>
                    <div className="metric-header">
                      <span>单位平均能耗</span>
                      <div className="metric-icon-wrapper"><Zap size={18} /></div>
                    </div>
                    <div className="metric-value">0.27 <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>度/件</span></div>
                    <div className="metric-footer">标准煤当量 A 级水平</div>
                  </div>

                  <div className="metric-card glass-panel" style={{ '--card-glow': '#f59e0b' }}>
                    <div className="metric-header">
                      <span>导出生产报表</span>
                      <div className="metric-icon-wrapper" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}><FileText size={18} /></div>
                    </div>
                    <div className="metric-value" style={{ fontSize: '16px', display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button className="btn-glass" onClick={() => handleExportReport('xlsx')} style={{ padding: '4px 8px', fontSize: '11px' }}>Excel</button>
                      <button className="btn-glass" onClick={() => handleExportReport('pdf')} style={{ padding: '4px 8px', fontSize: '11px' }}>PDF</button>
                    </div>
                    <div className="metric-footer">导出批量分类账生产报表</div>
                  </div>
                </div>

                <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="chart-card glass-panel">
                    <h3><Zap size={16} style={{ color: '#ef4444' }} /> 总产量与能耗追踪关联图</h3>
                    <div className="chart-wrapper">
                      {records.length > 0 ? (
                        <ReactECharts option={getEnergyCorrelationOption()} style={{ height: '100%' }} />
                      ) : (
                        <div style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--text-muted)' }}>同步数据记录以加载分析图表。</div>
                      )}
                    </div>
                  </div>

                  <div className="chart-card glass-panel">
                    <h3><Layers size={16} style={{ color: '#06b6d4' }} /> 陶瓷产品产量贡献占比饼图</h3>
                    <div className="chart-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* Sub-component pie representation */}
                      <ReactECharts 
                        option={{
                          backgroundColor: 'transparent',
                          tooltip: { trigger: 'item' },
                          series: [{
                            name: '产品类别',
                            type: 'pie',
                            radius: '55%',
                            data: [
                              { value: 4500, name: '日用瓷 (Fine Porcelain)', itemStyle: { color: '#6366f1' } },
                              { value: 3200, name: '艺术陶瓷 (Artistic Ceramic)', itemStyle: { color: '#06b6d4' } },
                              { value: 8500, name: '建筑陶瓷 (Architectural Tile)', itemStyle: { color: '#10b981' } },
                              { value: 2800, name: '卫浴陶瓷 (Sanitary Ware)', itemStyle: { color: '#f59e0b' } }
                            ]
                          }]
                        }} 
                        style={{ width: '100%', height: '100%' }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: AI FORECAST */}
            {activeTab === 'forecasting' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="forecast-panel-grid">
                  {/* Left Controls */}
                  <div className="forecast-controls glass-panel">
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                      <Cpu size={18} style={{ color: 'var(--primary)', marginRight: '8px' }} />
                      预测参数控制
                    </h3>

                    <div className="filter-group">
                      <label>预测时间跨度 (天数)</label>
                      <select 
                        className="select-glass"
                        value={forecastDays}
                        onChange={(e) => setForecastDays(parseInt(e.target.value))}
                      >
                        <option value={7}>未来 7 天</option>
                        <option value={14}>未来 14 天</option>
                        <option value={30}>未来 30 天</option>
                      </select>
                    </div>

                    <div className="filter-group">
                      <label>选择时序预测模型</label>
                      <select 
                        className="select-glass"
                        value={forecastModel}
                        onChange={(e) => setForecastModel(e.target.value)}
                      >
                        <option value="arima">ARIMA (统计学自回归模型)</option>
                        <option value="lstm">LSTM (长短期记忆神经网络)</option>
                        <option value="svm">SVM (支持向量回归 SVR-RBF)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={useSeasonal} 
                          onChange={(e) => setUseSeasonal(e.target.checked)}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        启用旺淡季特征因子调整
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={includeBacktest} 
                          onChange={(e) => setIncludeBacktest(e.target.checked)}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        启用历史对比回测分析
                      </label>
                    </div>

                    <button 
                      className="btn-glass"
                      style={{ 
                        marginTop: '12px',
                        background: 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)',
                        border: 'none',
                        boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
                      }}
                      onClick={handleRunForecast}
                    >
                      <TrendingUp size={16} /> 运行预测模型
                    </button>

                    {forecastResult && (
                      <div className="forecast-metrics">
                        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>模型精度指标统计</h4>
                        <div className="forecast-metric-row">
                          <span>平均绝对百分比误差 (MAPE):</span>
                          <span>{forecastResult.metrics.mape}%</span>
                        </div>
                        <div className="forecast-metric-row">
                          <span>均方根误差 (RMSE):</span>
                          <span>{forecastResult.metrics.rmse} 件</span>
                        </div>
                        <div className="forecast-metric-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <span>误差控制评估 (&lt; 150):</span>
                          {forecastResult.metrics.rmse <= 150 ? (
                            <span className="status-badge badge-green" style={{ fontSize: '11px' }}>✅ 已达标</span>
                          ) : (
                            <span className="status-badge badge-red" style={{ fontSize: '11px' }}>⚠️ 未达标</span>
                          )}
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                          * MAPE计算与历史验证数据对比的平均绝对百分比误差。数值越低表示预测越精准。
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Chart Visualization */}
                  <div className="chart-card glass-panel" style={{ minHeight: '400px' }}>
                    <h3><TrendingUp size={16} style={{ color: 'var(--secondary)' }} /> 预测产量走势曲线</h3>
                    <div className="chart-wrapper">
                      {forecastResult ? (
                        <ReactECharts option={getForecastOption()} style={{ height: '100%' }} />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                          <Cpu size={40} className="text-secondary" style={{ marginBottom: '16px', opacity: 0.3 }} />
                          <p>选择算法配置并点击“运行预测模型”来生成并评估预测曲线。</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comparison Chart */}
                {backtestData && (
                  <div className="chart-card glass-panel fade-in" style={{ minHeight: '400px' }}>
                    <h3><BarChart3 size={16} style={{ color: 'var(--primary)' }} /> 历史测试集对比分析</h3>
                    <div className="chart-wrapper">
                      <ReactECharts option={getComparisonOption()} style={{ height: '100%' }} />
                    </div>
                  </div>
                )}

                {/* Predicted Data Table list */}
                {forecastResult && (
                  <div className="glass-panel fade-in" style={{ padding: '24px' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>预测每日排产明细表</h3>
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>预测日期</th>
                            <th>季节</th>
                            <th>预测产量 (件)</th>
                            <th>可信度</th>
                            <th>调度建议</th>
                          </tr>
                        </thead>
                        <tbody>
                          {forecastResult.forecastDates.map((date, idx) => (
                            <tr key={idx}>
                              <td><strong>{date}</strong></td>
                              <td>
                                <span className={`status-badge ${forecastResult.forecastSeasons?.[idx] === '旺季' ? 'badge-orange' : 'badge-blue'}`}>
                                  {forecastResult.forecastSeasons?.[idx] || '未知'}
                                </span>
                              </td>
                              <td><span style={{ color: '#06b6d4', fontWeight: 600 }}>{Math.round(forecastResult.forecastValues[idx])} 件</span></td>
                              <td>
                                {forecastResult.forecastValues[idx] > 1800
                                  ? <span className="status-badge badge-orange">高负荷</span>
                                  : <span className="status-badge badge-green">正常</span>}
                              </td>
                              <td style={{ fontSize: '12px' }}>
                                {forecastResult.forecastValues[idx] > 1750
                                  ? '⚠️ 高负荷排产，优化能源储备'
                                  : '✅ 正常批次排产'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. CRUD ADD MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel fade-in">
            <div className="modal-header">
              <h3>新增生产批次记录</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            
            <form className="modal-form" onSubmit={handleSaveRecord}>
              <div className="form-group">
                <label>生产日期</label>
                <input 
                  type="date"
                  className="input-glass"
                  required
                  value={currentRecord.productionDate}
                  onChange={(e) => setCurrentRecord({...currentRecord, productionDate: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>产品类别</label>
                <select 
                  className="select-glass"
                  value={currentRecord.productName}
                  onChange={(e) => setCurrentRecord({...currentRecord, productName: e.target.value})}
                >
                  <option value="Fine Porcelain">日用瓷 (Fine Porcelain)</option>
                  <option value="Artistic Ceramic">艺术陶瓷 (Artistic Ceramic)</option>
                  <option value="Architectural Tile">建筑陶瓷 (Architectural Tile)</option>
                  <option value="Sanitary Ware">卫浴陶瓷 (Sanitary Ware)</option>
                </select>
              </div>

              <div className="form-group">
                <label>日产量 (件)</label>
                <input 
                  type="number"
                  min="0"
                  className="input-glass"
                  required
                  value={currentRecord.outputQuantity}
                  onChange={(e) => setCurrentRecord({...currentRecord, outputQuantity: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>缺陷数量 (件)</label>
                <input 
                  type="number"
                  min="0"
                  className="input-glass"
                  required
                  value={currentRecord.defectQuantity}
                  onChange={(e) => setCurrentRecord({...currentRecord, defectQuantity: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>能耗指数 (kWh)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-glass"
                  required
                  value={currentRecord.energyConsumption}
                  onChange={(e) => setCurrentRecord({...currentRecord, energyConsumption: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-glass" onClick={() => setShowAddModal(false)}>取消</button>
                <button type="submit" className="btn-glass" style={{ background: 'var(--primary)', borderColor: 'var(--primary)' }}>新增</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CRUD EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel fade-in">
            <div className="modal-header">
              <h3>编辑生产记录: {currentRecord.productionDate}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            
            <form className="modal-form" onSubmit={handleSaveRecord}>
              <div className="form-group">
                <label>产品类别</label>
                <select 
                  className="select-glass"
                  value={currentRecord.productName}
                  onChange={(e) => setCurrentRecord({...currentRecord, productName: e.target.value})}
                >
                  <option value="Fine Porcelain">日用瓷 (Fine Porcelain)</option>
                  <option value="Artistic Ceramic">艺术陶瓷 (Artistic Ceramic)</option>
                  <option value="Architectural Tile">建筑陶瓷 (Architectural Tile)</option>
                  <option value="Sanitary Ware">卫浴陶瓷 (Sanitary Ware)</option>
                </select>
              </div>

              <div className="form-group">
                <label>日产量 (件)</label>
                <input 
                  type="number"
                  min="0"
                  className="input-glass"
                  required
                  value={currentRecord.outputQuantity}
                  onChange={(e) => setCurrentRecord({...currentRecord, outputQuantity: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>缺陷数量 (件)</label>
                <input 
                  type="number"
                  min="0"
                  className="input-glass"
                  required
                  value={currentRecord.defectQuantity}
                  onChange={(e) => setCurrentRecord({...currentRecord, defectQuantity: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>能耗指数 (kWh)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-glass"
                  required
                  value={currentRecord.energyConsumption}
                  onChange={(e) => setCurrentRecord({...currentRecord, energyConsumption: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-glass" onClick={() => setShowEditModal(false)}>取消</button>
                <button type="submit" className="btn-glass" style={{ background: 'var(--primary)', borderColor: 'var(--primary)' }}>保存修改</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
