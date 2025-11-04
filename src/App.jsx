// src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend, ReferenceLine, BarChart, Bar } from 'recharts';

// --- Configuration ---
// IMPORTANT: This must match the URL of your running Flask API
const API_URL = 
  process.env.VITE_REACT_APP_API_URL || 
  process.env.REACT_APP_API_URL || 
  'http://localhost:5000'; // Fallback for local dev

// --- Utility Components ---

/** Card wrapper for consistency and mobile responsiveness */
const DashboardCard = ({ title, children, takeaway, value }) => (
  <div className="p-4 bg-white rounded-xl shadow-lg transition-shadow hover:shadow-xl flex flex-col h-full">
    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">{title}</h3>
    <div className="flex-grow">
      {value && <p className="text-3xl font-bold text-gray-800 mb-2">{value}</p>}
      {children}
    </div>
    {takeaway && (
      <p className="mt-4 pt-2 border-t text-sm italic text-blue-600 font-medium">
        Takeaway: "{takeaway}"
      </p>
    )}
  </div>
);

/** Gauge component for OHS */
const OperationalHealthGauge = ({ score, status }) => {
  const data = [
    { name: 'Health', uv: score, fill: score >= 90 ? '#4ADE80' : score >= 80 ? '#FBBF24' : '#F87171' },
    { name: 'Remaining', uv: 100 - score, fill: '#E5E7EB' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <RadialBarChart 
        width={200} 
        height={200} 
        cx={100} 
        cy={100} 
        innerRadius={60} 
        outerRadius={80} 
        barSize={20} 
        data={data}
        startAngle={270}
        endAngle={-90}
      >
        <RadialBar minAngle={15} background clockWise dataKey="uv" />
        <text 
          x={100} 
          y={100} 
          textAnchor="middle" 
          dominantBaseline="middle" 
          className="text-4xl font-bold"
        >
          {score}
        </text>
        <text 
          x={100} 
          y={125} 
          textAnchor="middle" 
          dominantBaseline="middle" 
          className="text-sm text-gray-500"
        >
          /100
        </text>
      </RadialBarChart>
      <div className={`mt-2 text-md font-semibold ${status === 'stable' ? 'text-green-600' : 'text-yellow-600'}`}>
        Status: {status}
      </div>
    </div>
  );
};

// Utility component for the Risk Matrix
const RiskMatrix = ({ assets }) => {
  const getCellColor = (impact, likelihood) => {
    if (impact === 'High' && likelihood === 'High') return 'bg-red-600';
    if (impact === 'High' && likelihood === 'Low') return 'bg-yellow-500';
    if (impact === 'Low' && likelihood === 'High') return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const getAssetForQuadrant = (impact, likelihood) => {
    return assets.find(a => a.impact === impact && a.likelihood === likelihood);
  };

  const Quadrant = ({ impact, likelihood, label }) => {
    const asset = getAssetForQuadrant(impact, likelihood);
    const color = getCellColor(impact, likelihood);
    
    return (
      <div className={`p-4 h-40 flex flex-col justify-center items-center text-white font-bold transition-all duration-300 ${color} ${asset ? 'shadow-2xl scale-105' : 'opacity-80'}`}>
        <div className="text-sm opacity-75">{label}</div>
        {asset ? (
          <div className="text-lg mt-1 text-center">
            {asset.asset}
          </div>
        ) : (
          <div className="text-sm mt-1 text-center font-normal">
            No Critical Assets
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center p-4">
      {/* Likelihood Axis Label */}
      <div className="text-sm font-semibold mb-2 text-gray-500">Predicted Failure Likelihood</div>
      <div className="grid grid-cols-2 grid-rows-2 w-full max-w-3xl border border-gray-300">
        
        {/* Row 1 (High Likelihood) */}
        <Quadrant impact="Low" likelihood="High" label="Low Impact / High Likelihood" />
        <Quadrant impact="High" likelihood="High" label="High Impact / High Likelihood" />

        {/* Row 2 (Low Likelihood) */}
        <Quadrant impact="Low" likelihood="Low" label="Low Impact / Low Likelihood" />
        <Quadrant impact="High" likelihood="Low" label="High Impact / Low Likelihood" />
      </div>

      {/* Operational Impact Axis Label (Vertical) */}
      <div className="text-sm font-semibold mt-4 text-gray-500">Operational Impact</div>
    </div>
  );
};


// --- View 1: Executive Overview Content ---
const ExecutiveView = ({ dashboardData, ohsTrendData }) => {
  const executiveData = dashboardData.executive;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
      
      {/* Block: Operational Health Score (OHS) Gauge */}
      <DashboardCard 
        title="Operational Health Score (OHS)"
        takeaway={`The mill is ${executiveData.ohs_status}, but we are actively managing ${executiveData.critical_asset_risk_matrix.filter(a => a.impact === 'High' && a.likelihood === 'High').length} high-risk component.`}
      >
        <OperationalHealthGauge 
          score={executiveData.ohs_score} 
          status={executiveData.ohs_status}
        />
      </DashboardCard>

      {/* Block: Avoided Cost Summary */}
      <DashboardCard 
        title="Avoided Cost Summary"
        takeaway={`Your PdM investment pays for itself by preventing just ${executiveData.avoided_events} catastrophic mill failure.`}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-sm text-gray-500">Total Avoided Downtime (Estimated)</p>
          <p className="text-4xl lg:text-5xl font-extrabold text-green-600 mt-1">
            {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(executiveData.avoided_cost_zar)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Averted over PoC period</p>
        </div>
      </DashboardCard>

      {/* Block: OHS Trend Line */}
      <DashboardCard 
        title="OHS Stability (Last 30 Days)"
        takeaway="The overall health trend confirms stable, predictable operations."
      >
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={ohsTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
            <XAxis dataKey="day" interval={4} tick={{ fontSize: 10 }} />
            <YAxis domain={[95, 100]} tick={{ fontSize: 10 }}/>
            <Tooltip />
            <Line type="monotone" dataKey="Score" stroke="#4F46E5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </DashboardCard>

      {/* Block: Critical Asset Risk Matrix (Full width on mobile, 2/3 on desktop) */}
      <div className="lg:col-span-3">
        <DashboardCard 
          title="Critical Asset Risk Matrix"
          takeaway="We know exactly what to fix and why. This is proactive budget control."
        >
          <RiskMatrix assets={executiveData.critical_asset_risk_matrix} />
        </DashboardCard>
      </div>

    </div>
  );
};

// --- View 2: Operations Manager View Content ---
const OperationsView = ({ dashboardData, rulCurveData, handleGenerateWorkOrder, cmmsNotification }) => {
  const operationsData = dashboardData.operations;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
      
      {/* Block: RUL (Remaining Useful Life) Curve - Full Width */}
      <div className="lg:col-span-3">
        <DashboardCard 
          title="RUL (Remaining Useful Life) Curve: Roller Mill #3 Bearing"
          takeaway="This prediction isn't a guess—it's based on the asset's actual degradation trend."
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rulCurveData} margin={{ top: 10, right: 30, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                <XAxis dataKey="day" label={{ value: 'Days from Alert', position: 'bottom' }} tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} label={{ value: 'Health (%)', angle: -90, position: 'left' }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Health']}/>
                
                {/* The RUL Prediction Line */}
                <Line type="monotone" dataKey="Health" stroke="#F97316" strokeWidth={3} dot={false} />

                {/* Action Threshold (Red Zone) */}
                <ReferenceLine 
                  y={operationsData.action_threshold} 
                  stroke="rgb(239 68 68)" 
                  strokeDasharray="5 5" 
                  label={{ 
                    value: `Action Threshold (${operationsData.action_threshold}%)`, 
                    position: 'top', 
                    fill: 'rgb(239 68 68)', 
                    fontSize: 12 
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>
      
      {/* Block: Pending Predictive Alerts List - Full Width */}
      <div className="lg:col-span-3">
        <DashboardCard 
          title="Pending Predictive Alerts List"
          takeaway="We have 6 weeks of runway to schedule this repair, order parts, and avoid any operational rush."
        >
          {operationsData.alerts_list.map((alert) => (
            <div 
              key={alert.id} 
              className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 my-2 border border-yellow-300 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition duration-150"
            >
              <div className="flex-grow">
                <p className="text-lg font-bold text-red-600">{alert.asset}</p>
                <p className="text-sm text-gray-700">Fault: <span className='font-semibold'>{alert.fault}</span> (Confidence: {alert.confidence}%)</p>
                <p className="text-sm text-gray-700">Predicted Failure Date: <span className='font-semibold'>{alert.predicted_date}</span> (Runway: {alert.runway_weeks} weeks)</p>
              </div>
              
              {/* CMMS Integration Mock-up */}
              <div className="mt-3 md:mt-0">
                <button
                  onClick={() => handleGenerateWorkOrder(alert)}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 transform hover:scale-[1.02]"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Generate Work Order
                </button>
              </div>
            </div>
          ))}
        </DashboardCard>
      </div>

      {/* Notification Modal for CMMS Mock-up */}
      {cmmsNotification && (
        <div className="fixed inset-0 flex items-start justify-center pt-20 z-50 pointer-events-none">
          <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl text-lg font-semibold animate-pulse">
            {cmmsNotification}
          </div>
        </div>
      )}

    </div>
  );
};


// --- View 3: Maintenance Engineer View Content ---
const EngineerView = ({ dashboardData }) => {
  // FIX: Use optional chaining to safely access engineer_diagnosis
  const engineerData = dashboardData?.engineer_diagnosis;

  // Guard clause to handle the case where engineerData is not yet loaded or missing
  if (!engineerData) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-lg m-6">
        <h3 className="text-2xl font-bold text-gray-700 mb-4">Loading Maintenance Engineer Data...</h3>
        <p className="text-lg text-gray-500">Awaiting detailed diagnostic data from the API response structure.</p>
      </div>
    );
  }
  
  // Mock data placeholders for now, since data.py doesn't have asset_name, etc.
  // The 'Mill #1 Bearing' is the high-risk asset from the Executive View.
  const assetName = "Mill #1 Bearing"; 
  const assetId = "M-B-049";
  const rulDays = "45";
  const faultCode = "IRF (Inner Race Fault)";
  const rootCause = "Inner Race Bearing Failure";
  const diagnosisReason = "Excessive roller element impact and high-frequency energy spikes (BSF harmonics)";
  const cmmsWo = "WO-Kroon-1123";


  // Prepare data for Vibration Chart - FIXED to show Spectrum
  const vibrationData = useMemo(() => {
    // Corrected to use the 'vibration_spectrum' data from data.py
    return engineerData.vibration_spectrum?.map(item => ({
      freq: item.freq,
      Amplitude: item.amp, // Y-axis value
    })) || [];
  }, [engineerData]);

  // Prepare data for Energy Chart - FIXED XAxis
  const energyData = useMemo(() => {
    // Corrected to use the 'energy_correlation' data from data.py
    return engineerData.energy_correlation?.map(item => ({
      month: item.month, // Use month for X-axis
      Baseline: item.kw - 5, // Mock a baseline for comparison
      Actual: item.kw
    })) || [];
  }, [engineerData]);


  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-[calc(100vh-140px)]">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Asset Deep-Dive: {assetName}</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Asset Details and Summary */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <DashboardCard title="Asset Status and Risk" takeaway="This confirms the high-risk, high-impact diagnosis for the asset.">
            <div className="mt-2 space-y-2 text-gray-700">
              <p><span className="font-semibold">Asset ID:</span> <span className="font-mono text-sm bg-gray-100 p-1 rounded">{assetId}</span></p>
              <p><span className="font-semibold">Status:</span> <span className="text-red-600 font-bold">CRITICAL WARNING</span></p>
              <p><span className="font-semibold">RUL Estimate:</span> <span className="font-bold text-orange-600">{rulDays} Days</span></p>
              <p><span className="font-semibold">Fault Code:</span> <span className="font-bold">{faultCode}</span></p>
            </div>
          </DashboardCard>

          <DashboardCard title="Diagnosis Summary" takeaway="The combined data indicates failure is imminent—proactive action is necessary.">
            <p className="mt-2 text-gray-700 font-semibold">
              Root Cause: **{rootCause}**
            </p>
            <p className="mt-2 text-sm text-gray-600">
              **Reasoning:** High-frequency vibration anomaly coincides with an unexpected energy spike, strongly indicating **{diagnosisReason}** on the motor bearing.
            </p>
            <p className="mt-3 text-sm font-semibold text-indigo-700">
              Recommendation: Proceed immediately with Work Order #{cmmsWo}.
            </p>
          </DashboardCard>
        </div>

        {/* Column 2 & 3: Diagnostic Charts */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          
          {/* Vibration Chart - FIXED to show Spectrum */}
          <DashboardCard title="Vibration Frequency Spectrum (mm/s)" takeaway="Key spikes at 85Hz, 170Hz, and 340Hz confirm a characteristic inner race bearing fault.">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {/* Changed to BarChart for frequency spectrum analysis */}
                <BarChart data={vibrationData} margin={{ top: 5, right: 30, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="freq" label={{ value: 'Frequency (Hz)', position: 'bottom' }} />
                  <YAxis label={{ value: 'Amplitude (mm/s)', angle: -90, position: 'insideLeft' }} domain={[0, 'auto']} />
                  <Tooltip formatter={(value, name, props) => [`${value} mm/s`, 'Amplitude']} />
                  
                  {/* Added ReferenceLines to highlight the BSF spike and harmonics */}
                  <ReferenceLine x={85} stroke="#F97316" strokeDasharray="3 3" label={{ value: 'BSF', position: 'top', fill: '#F97316', fontSize: 10 }} />
                  <ReferenceLine x={170} stroke="#FBBF24" strokeDasharray="3 3" label={{ value: '2x BSF', position: 'top', fill: '#FBBF24', fontSize: 10 }} />

                  <Bar dataKey="Amplitude" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Energy Chart - FIXED XAxis */}
          <DashboardCard title="Motor Energy Consumption (kWh)" takeaway="The spike in Jan indicates increased friction and load corresponding with the degradation.">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={energyData} margin={{ top: 5, right: 30, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" /> {/* FIXED: dataKey changed to 'month' */}
                  <YAxis label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Baseline" fill="#3B82F6" />
                  <Bar dataKey="Actual" fill="#F97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
};


// --- View 4: PoC Tracking Content (NEW) ---
const PoCTrackingView = () => {
    // Mock data for PoC success metrics over a 6-month period
    const PoC_KPI_DATA = {
        totalAvoidedDowntimeHours: 120,
        totalCostReductionZAR: 480000, // ZAR 480k
        ohsAverageDelta: 4.5, // 4.5% improvement

        monthlyTrends: [
            { month: 'Month 1', downtimeHours: 10, costReduction: 40000, ohsDelta: 1.0 },
            { month: 'Month 2', downtimeHours: 15, costReduction: 60000, ohsDelta: 0.5 },
            { month: 'Month 3', downtimeHours: 25, costReduction: 100000, ohsDelta: 1.5 },
            { month: 'Month 4', downtimeHours: 30, costReduction: 120000, ohsDelta: 0.8 },
            { month: 'Month 5', downtimeHours: 20, costReduction: 80000, ohsDelta: 0.3 },
            { month: 'Month 6', downtimeHours: 20, costReduction: 80000, ohsDelta: 0.4 },
        ],
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-[calc(100vh-140px)]">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">PoC Success Metric Tracking</h2>
            <p className="text-gray-600 mb-8">
                Tracking key performance indicators to validate the value proposition of the Predictive Maintenance Proof of Concept over the six-month trial period.
            </p>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DashboardCard 
                    title="Total Avoided Downtime"
                    value={`${PoC_KPI_DATA.totalAvoidedDowntimeHours} Hours`}
                    takeaway="Equivalent to 5 full days of unplanned operation."
                >
                    <p className="text-sm text-gray-500">Total operational hours saved from critical asset failures predicted by the system.</p>
                </DashboardCard>

                <DashboardCard 
                    title="Maintenance Cost Reduction"
                    value={formatCurrency(PoC_KPI_DATA.totalCostReductionZAR)}
                    takeaway="Exceeded the initial PoC budget target by 12%."
                >
                    <p className="text-sm text-gray-500">Savings from avoiding catastrophic failures and reducing parts costs through planned procurement.</p>
                </DashboardCard>

                <DashboardCard 
                    title="OHS (Operational Health Score) Improvement"
                    value={`+${PoC_KPI_DATA.ohsAverageDelta}%`}
                    takeaway="The average health score increased across all monitored assets."
                >
                    <p className="text-sm text-gray-500">The average percentage increase in overall asset health and operational predictability.</p>
                </DashboardCard>
            </div>

            {/* KPI Trend Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Avoided Downtime Trend */}
                <DashboardCard 
                    title="Monthly Avoided Downtime (Hours)"
                    takeaway="Downtime avoidance stabilized in later months, reflecting improved asset predictability."
                >
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={PoC_KPI_DATA.monthlyTrends} margin={{ top: 10, right: 30, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                                <XAxis dataKey="month" />
                                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="downtimeHours" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </DashboardCard>
                
                {/* Maintenance Cost Reduction Trend */}
                <DashboardCard 
                    title="Monthly Cost Reduction (ZAR)"
                    takeaway="The largest savings occurred when major bearing faults were preempted in Month 4."
                >
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={PoC_KPI_DATA.monthlyTrends} margin={{ top: 10, right: 30, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={formatCurrency} label={{ value: 'Savings (ZAR)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip formatter={(value) => [formatCurrency(value), 'Savings']} />
                                <Bar dataKey="costReduction" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </DashboardCard>
            </div>
            
            {/* OHS Improvement Trend - Full Width */}
            <div className='mt-6'>
                <DashboardCard 
                    title="Monthly OHS Improvement Delta (%)"
                    takeaway="Sustained positive growth confirms the predictive system is driving operational stability."
                >
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={PoC_KPI_DATA.monthlyTrends} margin={{ top: 10, right: 30, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                                <XAxis dataKey="month" />
                                <YAxis label={{ value: 'OHS Delta (%)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip formatter={(value) => [`+${value}%`, 'Improvement']}/>
                                <Line type="monotone" dataKey="ohsDelta" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
                                <ReferenceLine y={0.5} stroke="#FBBF24" strokeDasharray="3 3" label={{ value: 'Target Delta', position: 'insideTopLeft', fill: '#FBBF24', fontSize: 10 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </DashboardCard>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
const App = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('executive'); // State to manage views
  const [cmmsNotification, setCmmsNotification] = useState(null); // State for WO creation mock

  // 1. Data Fetching Logic (Connect to Flask API)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDashboardData(data);
        setError(null);
      } catch (e) {
        console.error("Failed to fetch dashboard data:", e);
        setError("Could not connect to Flask API. Ensure the API is running on port 5000.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // Runs only once on mount

  // Prepare data for the OHS trend line (View 1)
  const ohsTrendData = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData.executive.ohs_trend.map(item => ({
      name: `Day ${item.day}`,
      Score: item.score,
      day: item.day
    }));
  }, [dashboardData]);

  // Prepare data for the RUL curve (View 2)
  const rulCurveData = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData.operations.rul_curve_data.map(item => ({
      day: `Day ${item.day}`,
      Health: item.health
    }));
  }, [dashboardData]);


  // Handle CMMS Work Order generation
  const handleGenerateWorkOrder = (alert) => {
    setCmmsNotification(`Work Order ${alert.cmms_wo} automatically created in CMMS. Priority: Medium (Scheduled)`);
    // Clear notification after 5 seconds
    setTimeout(() => setCmmsNotification(null), 5000);
  };

  // Handle loading and error states
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-xl font-medium text-gray-600">Loading Operational Certainty Data...</div>
      <style>{`
        /* Simple loading spinner CSS */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          border: 4px solid #f3f3f3; /* Light grey */
          border-top: 4px solid #4F46E5; /* Blue */
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin-left: 10px;
        }
      `}</style>
      <div className="spinner"></div>
    </div>
  );
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-8">
      <h1 className="text-2xl font-bold text-red-700">API Connection Error</h1>
      <p className="mt-4 p-4 bg-red-100 rounded-lg text-red-600 border-red-300 border w-full max-w-lg">
        {error}
        <br/><br/>
        Please ensure your Flask API is running in a separate terminal with: <code className="block bg-gray-800 text-white p-2 mt-1 rounded">py app.py</code>
      </p>
    </div>
  );

  // --- Render Navigation and Current View ---
  const renderView = () => {
    // Ensure dashboardData is not null before accessing its properties
    if (!dashboardData) {
        return (
            <div className="p-8 text-center bg-white rounded-xl shadow-lg m-6">
                <h3 className="text-2xl font-bold text-gray-700 mb-4">Error: Data Structure Missing</h3>
                <p className="text-lg text-gray-500">The application loaded but the dashboard data object is empty or improperly structured.</p>
            </div>
        );
    }
    
    switch (currentView) {
      case 'executive':
        return <ExecutiveView dashboardData={dashboardData} ohsTrendData={ohsTrendData} />;
      case 'operations':
        return <OperationsView dashboardData={dashboardData} rulCurveData={rulCurveData} handleGenerateWorkOrder={handleGenerateWorkOrder} cmmsNotification={cmmsNotification} />;
      case 'engineer':
        return <EngineerView dashboardData={dashboardData} />; // Renders the Maintenance Engineer View
      case 'tracking':
        return <PoCTrackingView />; // Renders the new PoC Tracking View
      default:
        return <ExecutiveView dashboardData={dashboardData} ohsTrendData={ohsTrendData} />;
    }
  };

  const navItems = [
    { id: 'executive', label: 'C-Suite Overview' },
    { id: 'operations', label: 'Operations Manager' },
    { id: 'engineer', label: 'Maintenance Engineer' },
    { id: 'tracking', label: 'PoC Tracking' },
  ];

  const NavButton = ({ id, label }) => (
    <button
      onClick={() => setCurrentView(id)}
      className={`px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-lg whitespace-nowrap 
        ${currentView === id 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* Header and Title */}
      <header className="bg-white shadow-lg p-4 sticky top-0 z-10">
        <div className="container mx-auto">
          <h1 className="text-2xl font-extrabold text-indigo-700">
            <span className="text-indigo-400">OCP:</span> Operational Certainty Platform
          </h1>
          <p className="text-sm text-gray-500 mt-1">Kroonstad Maize Mill | PdM Demo</p>
        </div>
      </header>

      {/* Navigation Bar (Mobile Scrollable) */}
      <nav className="bg-white border-b sticky top-[72px] lg:top-[76px] z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex space-x-3 py-3 overflow-x-auto scrollbar-hide">
            {navItems.map(item => (
              <NavButton key={item.id} id={item.id} label={item.label} />
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container mx-auto p-4 md:p-6">
        {renderView()}
      </main>
      
      {/* Styling for hidden scrollbar on mobile */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
};

export default App;

