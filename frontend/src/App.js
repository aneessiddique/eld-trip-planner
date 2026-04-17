import React, { useEffect, useRef, useState } from "react";
import { Truck, Map as MapIcon, ClipboardList, Info } from "lucide-react";
import TripInputForm from "./components/TripInputForm";
import RouteMap from "./components/RouteMap";
import RouteInstructions from "./components/RouteInstructions";
import LogSheetRenderer from "./components/LogSheetRenderer";
import { calculateTrip } from "./services/api";
import "./App.css";

function App() {
  const [route, setRoute] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [dailySheets, setDailySheets] = useState([]);
  const [cycleUsed, setCycleUsed] = useState(0);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [loading, setLoading] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const phase2Ref = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (summary) {
      setActiveTab('map');
      phase2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [summary]);

  const handleCalculate = async (values) => {
    setError(null);
    setLoading(true);
    try {
      const response = await calculateTrip(values);
      setRoute(response.route);
      setInstructions(response.instructions);
      setDailySheets(response.daily_sheets);
      setCycleUsed(response.cycle_used_hours);
      setSummary({
        route: `${values.current_location} → ${values.pickup_location} → ${values.dropoff_location}`,
        totalDistance: response.route?.distance_miles ?? 0,
        estimatedDuration: response.route?.duration_hours ?? 0,
        currentCycleUsed: values.current_cycle_used_hours,
      });
    } catch (err) {
      setError(err.message || "Failed to calculate trip");
    } finally {
      setLoading(false);
    }
  };

  const mapPoints = route?.geometry || [];

  return (
    <div className="min-h-screen pb-12 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-slate-900 text-white py-3 px-4 sticky top-0 z-50 shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg ring-4 ring-blue-600/20">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter leading-none italic">
                ELD Trip <span className="text-blue-500">PLANNER</span>
              </h1>
            </div>
          </div>
          <div className="hidden md:flex gap-6 items-center text-slate-200 text-[16px] tracking-widest">
            <span>{`${String(currentDateTime.getDate()).padStart(2, '0')}/${String(currentDateTime.getMonth() + 1).padStart(2, '0')}/${String(currentDateTime.getFullYear()).slice(-2)} ${String(currentDateTime.getHours()).padStart(2, '0')}:${String(currentDateTime.getMinutes()).padStart(2, '0')}:${String(currentDateTime.getSeconds()).padStart(2, '0')}`}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        {/* Input Phase */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-500" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-600 italic">Trip Parameters</h2>
          </div>
          <TripInputForm onCalculate={handleCalculate} loading={loading} />
        </section>

        {summary && (
          <div ref={phase2Ref} className="space-y-8">
            {/* Stats Phase */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-green-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-600 italic">Live Summary</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  label="Route" 
                  value={summary.route} 
                  icon={<MapIcon className="text-blue-500" />} 
                  subValue="Optimized Path"
                />
                <StatCard 
                  label="Total Distance" 
                  value={`${summary.totalDistance} miles`} 
                  icon={<MapIcon className="text-green-500" />} 
                  subValue="Calculated Estimate"
                />
                <StatCard 
                  label="Estimated Duration" 
                  value={`${summary.estimatedDuration.toFixed(1)} hours`} 
                  icon={<ClipboardList className="text-orange-500" />} 
                  subValue="Total Driving Time"
                />
                <StatCard 
                  label="Current Cycle Used" 
                  value={`${summary.currentCycleUsed} hrs`} 
                  icon={<Info className="text-purple-500" />} 
                  subValue="Remaining Balance: 46 hrs"
                />
              </div>
            </section>

            {/* Visualization Phase */}
            <section className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-100 flex p-1">
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                    activeTab === 'map' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                  Route Map
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                    activeTab === 'logs' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  ELD Log Sheets
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'map' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <RouteMap points={mapPoints} />
                    </div>
                    <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      <RouteInstructions instructions={instructions} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {dailySheets.map((log, i) => (
                      <LogSheetRenderer key={i} log={log} route={route} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {error && <div className="app-error">{error}</div>}
      </main>
      
    </div>
  );
}

const StatCard = ({ label, value, icon, subValue }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full group hover:border-blue-200 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
        {React.cloneElement(icon, { size: 20 })}
      </div>
    </div>
    <div>
      <div className="text-xl font-bold font-mono text-slate-800 break-words line-clamp-2">
        {value}
      </div>
      <div className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
        {subValue}
      </div>
    </div>
  </div>
);

export default App;
