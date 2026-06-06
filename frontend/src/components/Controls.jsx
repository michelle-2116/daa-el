import React, { useState } from "react";
import { Play, Pause, RotateCcw, AlertOctagon, RefreshCw, Compass } from "lucide-react";

export default function Controls({
  telemetry,
  config,
  onGenerateRoute,
  onStartSimulation,
  onPauseSimulation,
  onResumeSimulation,
  onResetSimulation,
  onToggleCooling,
  onUpdateSpeed,
  onUpdateThreshold,
  onUpdateTempOverride,
  onUpdateZoneTemp,
  onUpdateWeights
}) {
  const [startCity, setStartCity] = useState("Srinagar");
  const [endCity, setEndCity] = useState("Kochi");
  const [alpha, setAlpha] = useState(1.0);
  const [beta, setBeta] = useState(250.0);

  const cities = config?.cities || [];
  const zones = config?.zones || [];
  const status = telemetry?.status || "idle";
  const coolingActive = telemetry?.cooling_active ?? true;

  const handleRouteSubmit = (e) => {
    e.preventDefault();
    onGenerateRoute({ start_city: startCity, end_city: endCity, alpha, beta });
  };

  const handleWeightChange = (newAlpha, newBeta) => {
    setAlpha(newAlpha);
    setBeta(newBeta);
    onUpdateWeights(newAlpha, newBeta);
  };

  return (
    <div className="space-y-4 flex flex-col h-full select-none text-slate-700 text-xs">
      
      {/* 1. Route Planning Panel */}
      <div className="pb-3 border-b border-brand-border">
        <div className="flex items-center space-x-1.5 border-b border-brand-border pb-1.5 mb-2.5">
          <Compass className="w-3.5 h-3.5 text-brand-accent" />
          <h2 className="font-mono font-bold text-[10px] uppercase tracking-wider text-slate-800">Route Selection</h2>
        </div>
        
        <form onSubmit={handleRouteSubmit} className="space-y-2">
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-mono mb-0.5">Source City</label>
            <select
              value={startCity}
              onChange={(e) => setStartCity(e.target.value)}
              disabled={status === "running" || status === "paused"}
              className="w-full bg-white text-slate-900 border border-brand-border text-xs rounded p-1 outline-none focus:border-brand-accent disabled:opacity-50"
            >
              {cities.map((city) => (
                <option key={`start-${city.name}`} value={city.name}>
                  {city.name} ({city.lat.toFixed(1)}N, {city.lon.toFixed(1)}E)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-mono mb-0.5">Destination City</label>
            <select
              value={endCity}
              onChange={(e) => setEndCity(e.target.value)}
              disabled={status === "running" || status === "paused"}
              className="w-full bg-white text-slate-900 border border-brand-border text-xs rounded p-1 outline-none focus:border-brand-accent disabled:opacity-50"
            >
              {cities.map((city) => (
                <option key={`end-${city.name}`} value={city.name}>
                  {city.name} ({city.lat.toFixed(1)}N, {city.lon.toFixed(1)}E)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-mono mb-0.5">Alpha (Dist Weight)</label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={alpha}
                onChange={(e) => handleWeightChange(parseFloat(e.target.value), beta)}
                className="w-full bg-white text-slate-900 border border-brand-border text-xs rounded p-1 outline-none focus:border-brand-accent"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-mono mb-0.5">Beta (Risk Weight)</label>
              <input
                type="number"
                min="0"
                max="1000"
                step="10"
                value={beta}
                onChange={(e) => handleWeightChange(alpha, parseFloat(e.target.value))}
                className="w-full bg-white text-slate-900 border border-brand-border text-xs rounded p-1 outline-none focus:border-brand-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === "running" || status === "paused"}
            className="w-full mt-1.5 border border-brand-border hover:bg-slate-50 text-slate-800 font-bold py-1.5 px-3 rounded tracking-wider uppercase text-[10px] active:bg-slate-100 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Compute Route
          </button>
        </form>
      </div>

      {/* 2. Simulation Control Panel */}
      <div className="py-3 border-b border-brand-border">
        <div className="flex items-center justify-between border-b border-brand-border pb-1.5 mb-2.5">
          <h2 className="font-mono font-bold text-[10px] uppercase tracking-wider text-slate-800">Simulation Engine</h2>
          <span className="text-[9px] font-mono uppercase text-slate-450 border border-slate-200 px-1 rounded-sm">
            {status}
          </span>
        </div>

        {/* Action Toolbar */}
        <div className="flex gap-1.5 mb-3 select-none">
          {status === "idle" || status === "finished" ? (
            <button
              onClick={onStartSimulation}
              disabled={!telemetry?.route_coords || telemetry.route_coords.length === 0}
              className="flex-1 flex items-center justify-center space-x-1 border border-brand-success text-brand-success hover:bg-emerald-50 font-bold py-1 rounded transition-colors disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>START</span>
            </button>
          ) : status === "running" ? (
            <button
              onClick={onPauseSimulation}
              className="flex-1 flex items-center justify-center space-x-1 border border-brand-warning text-brand-warning hover:bg-amber-50 font-bold py-1 rounded transition-colors"
            >
              <Pause className="w-3 h-3 fill-current" />
              <span>PAUSE</span>
            </button>
          ) : (
            <button
              onClick={onResumeSimulation}
              className="flex-1 flex items-center justify-center space-x-1 border border-brand-success text-brand-success hover:bg-emerald-50 font-bold py-1 rounded transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>RESUME</span>
            </button>
          )}

          <button
            onClick={onResetSimulation}
            className="flex-1 flex items-center justify-center space-x-1 border border-brand-border text-slate-700 hover:bg-slate-50 font-bold py-1 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET</span>
          </button>
        </div>

        {/* Parameter Sliders */}
        <div className="space-y-3 font-mono text-[10px]">
          {/* Speed */}
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-slate-400 uppercase">Sim Speed</span>
              <span className="text-brand-accent font-bold">{telemetry?.speed_multiplier || 1}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={telemetry?.speed_multiplier || 1}
              onChange={(e) => onUpdateSpeed(parseInt(e.target.value))}
              className="w-full accent-brand-accent bg-slate-200 h-1 rounded appearance-none cursor-pointer"
            />
          </div>

          {/* Threshold */}
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-slate-400 uppercase">Limit Threshold</span>
              <span className="text-brand-danger font-bold">{telemetry?.temp_threshold || 8.0}C</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="15.0"
              step="0.5"
              value={telemetry?.temp_threshold || 8.0}
              onChange={(e) => onUpdateThreshold(parseFloat(e.target.value))}
              className="w-full accent-brand-danger bg-slate-200 h-1 rounded appearance-none cursor-pointer"
            />
          </div>

          {/* Manual Override */}
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-slate-400 uppercase">Cargo Internal Temp</span>
              <span className="text-brand-accent font-bold">{telemetry?.internal_temp?.toFixed(1) || 4.0}C</span>
            </div>
            <input
              type="range"
              min="-2"
              max="25"
              step="0.2"
              value={telemetry?.internal_temp || 4.0}
              onChange={(e) => onUpdateTempOverride(parseFloat(e.target.value))}
              className="w-full accent-brand-accent bg-slate-200 h-1 rounded appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Cooler Status Controller */}
        <div className="mt-3 pt-2.5 border-t border-brand-border select-none">
          {coolingActive ? (
            <button
              onClick={() => onToggleCooling(false)}
              className="w-full flex items-center justify-center space-x-1.5 border border-brand-danger text-brand-danger hover:bg-rose-50 font-bold py-1.5 rounded uppercase tracking-wider text-[10px] transition-colors"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-brand-danger" />
              <span>Disable Active Cooling</span>
            </button>
          ) : (
            <button
              onClick={() => onToggleCooling(true)}
              className="w-full flex items-center justify-center space-x-1.5 border border-brand-success text-brand-success hover:bg-emerald-50 font-bold py-1.5 rounded uppercase tracking-wider text-[10px] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-success" />
              <span>Restore Refrigeration</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Environmental Sliders */}
      <div className="pt-3 flex-1 overflow-y-auto min-h-[120px]">
        <div className="border-b border-brand-border pb-1.5 mb-2">
          <h2 className="font-mono font-bold text-[10px] uppercase tracking-wider text-slate-800">Zone Grid Temperatures</h2>
        </div>

        <div className="space-y-2 pr-0.5">
          {zones.map((zone) => {
            const liveTemp = telemetry?.zones_temperatures?.[zone.id] ?? zone.default_temp;
            let barColor = "accent-brand-accent";
            let textColor = "text-brand-accent";
            
            if (liveTemp > 15.0 && liveTemp <= 32.0) {
              barColor = "accent-brand-warning";
              textColor = "text-brand-warning";
            } else if (liveTemp > 32.0) {
              barColor = "accent-brand-danger";
              textColor = "text-brand-danger";
            }

            return (
              <div key={zone.id} className="font-mono text-[9px] space-y-0.5">
                <div className="flex justify-between font-sans">
                  <span className="font-medium text-slate-500">{zone.name}</span>
                  <span className={`font-mono font-bold ${textColor}`}>
                    {liveTemp.toFixed(1)}C
                  </span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="50"
                  step="0.5"
                  value={liveTemp}
                  onChange={(e) => onUpdateZoneTemp(zone.id, parseFloat(e.target.value))}
                  className={`w-full ${barColor} bg-slate-200 h-1 rounded appearance-none cursor-pointer`}
                />
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
