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
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-darkBg text-brand-neonBlue">
        <RefreshCw className="w-10 h-10 text-brand-neonBlue animate-spin mb-4" />
        <h1 className="text-lg font-bold tracking-wider text-slate-800">Loading ColdChain AI Control Panel...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-darkBg text-slate-900 px-6 text-center">
        <ShieldAlert className="w-12 h-12 text-brand-danger mb-4" />
        <h1 className="text-xl font-bold mb-2 text-slate-800">Connection Failure</h1>
        <p className="text-slate-500 text-sm max-w-md mb-6">{error}</p>
        <button
          onClick={fetchConfig}
          className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-brand-glassBorder px-4 py-2 rounded-lg font-bold text-slate-700 shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-darkBg pb-4">
      
      {/* HEADER BAR */}
      <header className="glass-card mx-4 mt-4 px-6 py-3.5 rounded-lg border border-brand-glassBorder flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-brand-neonBlue flex items-center justify-center shadow-sm">
            <Snowflake className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 uppercase">
              ColdChain AI
            </h1>
            <p className="text-[10px] text-brand-neonBlue font-semibold uppercase tracking-widest leading-none">
              Vaccine Logistics & Thermal Decision Support
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs">
          <div className="flex items-center space-x-2">
            <Radio className={`w-4 h-4 ${wsConnected ? "text-brand-success animate-pulse" : "text-brand-danger"}`} />
            <span className="text-slate-500">WebSocket:</span>
            <span className={`font-bold uppercase ${wsConnected ? "text-brand-success" : "text-brand-danger"}`}>
              {wsConnected ? "Online" : "Connecting..."}
            </span>
          </div>

          <div className="flex items-center space-x-2 border-l border-brand-glassBorder pl-6">
            <Cpu className="w-4 h-4 text-brand-warning" />
            <span className="text-slate-500">Optimization:</span>
            <span className="font-bold text-brand-warning uppercase">Dijkstra + PELT</span>
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID WORKSPACE */}
      <main className="flex-1 px-4 mt-4 grid grid-cols-12 gap-4">
        
        {/* LEFT COLUMN - CONTROLS (3 cols) */}
        <section className="col-span-12 lg:col-span-3 h-full">
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

        {/* CENTER COLUMN - MAP & GRAPH (6 cols) */}
        <section className="col-span-12 lg:col-span-6 flex flex-col space-y-4">
          <div className="flex-1 min-h-[480px]">
            <MapView telemetry={telemetry} config={config} />
          </div>
          <div className="h-[220px]">
            <TempChart
              history={telemetry?.temp_history || []}
              threshold={telemetry?.temp_threshold || 8.0}
            />
          </div>
        </section>

        {/* RIGHT COLUMN - ANALYTICS & LOGS (3 cols) */}
        <section className="col-span-12 lg:col-span-3 flex flex-col space-y-4">
          <div className="flex-1 overflow-y-auto">
            <Analytics telemetry={telemetry} />
          </div>
          <div className="h-[200px]">
            <EventLogs logs={telemetry?.event_logs || []} />
          </div>
        </section>

      </main>

    </div>
  );
}
