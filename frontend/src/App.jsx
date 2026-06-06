import React, { useState, useEffect, useRef } from "react";
import { Snowflake, ShieldAlert, Cpu, Radio, RefreshCw } from "lucide-react";
import Controls from "./components/Controls";
import MapView from "./components/MapView";
import Analytics from "./components/Analytics";
import TempChart from "./components/TempChart";
import EventLogs from "./components/EventLogs";

export default function App() {
  const [config, setConfig] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectInterval = useRef(null);

  // 1. Fetch system configs on mount
  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Could not load backend configurations.");
      const data = await res.json();
      setConfig(data);
      
      // Also fetch current state in case simulation is already running
      const stateRes = await fetch("/api/state");
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        setTelemetry(stateData);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to FastAPI backend. Ensure the server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectInterval.current) clearInterval(reconnectInterval.current);
    };
  }, []);

  // 2. Setup WebSocket connection with auto-reconnect
  const connectWebSocket = () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Connect to local WS server proxy
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    console.log(`Attempting WebSocket connection to ${wsUrl}...`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connection established successfully!");
      setWsConnected(true);
      if (reconnectInterval.current) {
        clearInterval(reconnectInterval.current);
        reconnectInterval.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTelemetry(data);
      } catch (err) {
        console.error("Error parsing telemetry WebSocket data: ", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected.");
      setWsConnected(false);
      // Attempt reconnect every 3s
      if (!reconnectInterval.current) {
        reconnectInterval.current = setInterval(() => {
          connectWebSocket();
        }, 3000);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error: ", err);
      ws.close();
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    if (config) {
      connectWebSocket();
    }
  }, [config]);

  // 3. API Commands
  const apiPost = async (url, body = {}) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "API request failed.");
      }
      const data = await res.json();
      setTelemetry(data);
    } catch (err) {
      alert(`API Command Error: ${err.message}`);
    }
  };

  const handleGenerateRoute = (req) => apiPost("/api/route/generate", req);
  const handleStartSimulation = () => apiPost("/api/simulation/start");
  const handlePauseSimulation = () => apiPost("/api/simulation/pause");
  const handleResumeSimulation = () => apiPost("/api/simulation/resume");
  const handleResetSimulation = () => apiPost("/api/simulation/reset");
  
  const handleToggleCooling = (active) => apiPost("/api/simulation/cooling", { cooling_active: active });
  const handleUpdateSpeed = (speed) => apiPost("/api/simulation/speed", { speed });
  const handleUpdateThreshold = (threshold) => apiPost("/api/simulation/threshold", { threshold });
  const handleUpdateTempOverride = (temp) => apiPost("/api/simulation/temp-override", { temp });
  
  const handleUpdateZoneTemp = (zone_id, temperature) => {
    // Send immediate update to backend
    apiPost("/api/zone/temperature", { zone_id, temperature });
  };

  const handleUpdateWeights = (alpha, beta) => {
    // Helper to log or save weights locally so they are sent in Generate Route
    console.log("Weights updated locally: ", alpha, beta);
  };

  // Loading and Error States
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-darkBg text-brand-accent">
        <RefreshCw className="w-6 h-6 animate-spin mb-3 text-brand-accent" />
        <h1 className="text-xs font-mono tracking-widest text-slate-650 uppercase">Loading Vaccine Logistics Console...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-darkBg text-slate-900 px-6 text-center">
        <ShieldAlert className="w-10 h-10 text-brand-danger mb-3" />
        <h1 className="text-sm font-bold tracking-tight mb-1 text-slate-800">Connection Failure</h1>
        <p className="text-slate-500 text-xs max-w-sm mb-4">{error}</p>
        <button
          onClick={fetchConfig}
          className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-brand-border px-3 py-1.5 rounded text-xs font-semibold text-slate-700 shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-brand-darkBg overflow-hidden text-slate-700 text-xs antialiased">
      
      {/* HEADER BAR */}
      <header className="h-9 px-3 bg-white border-b border-brand-border flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-brand-accent rounded-sm shrink-0" />
          <span className="font-mono text-xs font-bold tracking-wider text-slate-900 uppercase">
            VACCINE.LOGISTICS.CONTROL
          </span>
          <span className="text-[9px] font-mono text-slate-400 border border-slate-200 px-1 rounded-sm uppercase tracking-wider">
            Live Transit
          </span>
        </div>

        <div className="flex items-center space-x-4 font-mono text-[10px]">
          <div className="flex items-center space-x-1.5">
            <Radio className={`w-3.5 h-3.5 ${wsConnected ? "text-brand-success" : "text-brand-danger"}`} />
            <span className="text-slate-400">WS:</span>
            <span className={`font-bold uppercase ${wsConnected ? "text-brand-success" : "text-brand-danger"}`}>
              {wsConnected ? "Online" : "Offline"}
            </span>
          </div>

          <div className="h-3 w-px bg-brand-border" />

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">ENGINE:</span>
            <span className="font-bold text-slate-600">Dijkstra + PELT</span>
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID WORKSPACE */}
      <main className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
        
        {/* LEFT COLUMN - CONTROLS (280px wide) */}
        <section className="w-[280px] shrink-0 border-r border-brand-border bg-white flex flex-col overflow-y-auto p-2.5 min-w-0">
          <Controls
            telemetry={telemetry}
            config={config}
            onGenerateRoute={handleGenerateRoute}
            onStartSimulation={handleStartSimulation}
            onPauseSimulation={handlePauseSimulation}
            onResumeSimulation={handleResumeSimulation}
            onResetSimulation={handleResetSimulation}
            onToggleCooling={handleToggleCooling}
            onUpdateSpeed={handleUpdateSpeed}
            onUpdateThreshold={handleUpdateThreshold}
            onUpdateTempOverride={handleUpdateTempOverride}
            onUpdateZoneTemp={handleUpdateZoneTemp}
            onUpdateWeights={handleUpdateWeights}
          />
        </section>

        {/* CENTER COLUMN - MAP (large, uninterrupted) */}
        <section className="flex-1 flex flex-col min-w-0 min-h-0 p-2 bg-brand-darkBg">
          <MapView telemetry={telemetry} config={config} />
        </section>

        {/* RIGHT COLUMN - ANALYTICS, CHART & LOGS (340px wide) */}
        <section className="w-[340px] shrink-0 border-l border-brand-border bg-white flex flex-col overflow-y-auto p-2.5 min-w-0 gap-3">
          <Analytics telemetry={telemetry} />
          
          <div className="border-t border-brand-border pt-2.5">
            <TempChart
              history={telemetry?.temp_history || []}
              threshold={telemetry?.temp_threshold || 8.0}
            />
          </div>

          <div className="border-t border-brand-border pt-2.5 flex-1 flex flex-col min-h-[180px]">
            <EventLogs logs={telemetry?.event_logs || []} />
          </div>
        </section>

      </main>

    </div>
  );
}
