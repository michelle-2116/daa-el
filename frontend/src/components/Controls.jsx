import React, { useState } from "react";
import { Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, Navigation, Sliders, Flame, Snowflake, Thermometer } from "lucide-react";

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
    <div className="space-y-6 flex flex-col h-full select-none text-gray-200">
      
      {/* 1. Route Planning Card */}
      <div className="glass-card p-4 rounded-xl border border-brand-glassBorder shadow-md">
        <div className="flex items-center space-x-2 border-b border-brand-glassBorder pb-2 mb-3">
          <Navigation className="w-5 h-5 text-brand-neonBlue" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-brand-neonBlue">Route Planner</h2>
        </div>
        
        <form onSubmit={handleRouteSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1">Source City</label>
            <select
              value={startCity}
              onChange={(e) => setStartCity(e.target.value)}
              disabled={status === "running" || status === "paused"}
              className="w-full bg-[#111928] text-white border border-brand-glassBorder text-sm rounded-lg p-2 outline-none focus:border-brand-neonBlue disabled:opacity-50"
            >
              {cities.map((city) => (
                <option key={`start-${city.name}`} value={city.name}>
                  {city.name} ({city.lat.toFixed(1)}°N, {city.lon.toFixed(1)}°E)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1">Destination City</label>
            <select
              value={endCity}
              onChange={(e) => setEndCity(e.target.value)}
              disabled={status === "running" || status === "paused"}
              className="w-full bg-[#111928] text-white border border-brand-glassBorder text-sm rounded-lg p-2 outline-none focus:border-brand-neonBlue disabled:opacity-50"
            >
              {cities.map((city) => (
                <option key={`end-${city.name}`} value={city.name}>
                  {city.name} ({city.lat.toFixed(1)}°N, {city.lon.toFixed(1)}°E)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-0.5">Alpha (Dist Weight)</label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={alpha}
                onChange={(e) => handleWeightChange(parseFloat(e.target.value), beta)}
                className="w-full bg-[#111928] text-white border border-brand-glassBorder text-sm rounded-lg p-2 outline-none focus:border-brand-neonBlue"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-0.5">Beta (Risk Weight)</label>
              <input
                type="number"
                min="0"
                max="1000"
                step="10"
                value={beta}
                onChange={(e) => handleWeightChange(alpha, parseFloat(e.target.value))}
                className="w-full bg-[#111928] text-white border border-brand-glassBorder text-sm rounded-lg p-2 outline-none focus:border-brand-neonBlue"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === "running" || status === "paused"}
            className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-brand-darkBg font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            Generate Route
          </button>
        </form>
      </div>

      {/* 2. Simulation Control Card */}
      <div className="glass-card p-4 rounded-xl border border-brand-glassBorder shadow-md">
        <div className="flex items-center space-x-2 border-b border-brand-glassBorder pb-2 mb-3">
          <Sliders className="w-5 h-5 text-brand-neonBlue" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-brand-neonBlue">Simulation Controls</h2>
        </div>

        {/* Play State Buttons */}
        <div className="flex gap-2 mb-4">
          {status === "idle" || status === "finished" ? (
            <button
              onClick={onStartSimulation}
              disabled={!telemetry?.route_coords || telemetry.route_coords.length === 0}
              className="flex-1 flex items-center justify-center space-x-1.5 bg-brand-success hover:bg-emerald-400 text-brand-darkBg font-bold py-2 rounded-lg transition-all disabled:opacity-50 active:scale-95"
            >
              <Play className="w-4 h-4 fill-brand-darkBg" />
              <span>Start</span>
            </button>
          ) : status === "running" ? (
            <button
              onClick={onPauseSimulation}
              className="flex-1 flex items-center justify-center space-x-1.5 bg-brand-warning hover:bg-amber-400 text-brand-darkBg font-bold py-2 rounded-lg transition-all active:scale-95"
            >
              <Pause className="w-4 h-4 fill-brand-darkBg" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onResumeSimulation}
              className="flex-1 flex items-center justify-center space-x-1.5 bg-brand-success hover:bg-emerald-400 text-brand-darkBg font-bold py-2 rounded-lg transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-brand-darkBg" />
              <span>Resume</span>
            </button>
          )}

          <button
            onClick={onResetSimulation}
            className="flex-1 flex items-center justify-center space-x-1.5 bg-[#1F2937] hover:bg-gray-700 border border-brand-glassBorder text-white font-bold py-2 rounded-lg transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        {/* Telemetry settings sliders */}
        <div className="space-y-4">
          {/* Speed Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Simulation Speed</span>
              <span className="text-brand-neonBlue font-semibold">{telemetry?.speed_multiplier || 1}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={telemetry?.speed_multiplier || 1}
              onChange={(e) => onUpdateSpeed(parseInt(e.target.value))}
              className="w-full accent-brand-neonBlue bg-[#111928] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Threshold Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Safety Threshold</span>
              <span className="text-brand-danger font-semibold">{telemetry?.temp_threshold || 8.0}°C</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="15.0"
              step="0.5"
              value={telemetry?.temp_threshold || 8.0}
              onChange={(e) => onUpdateThreshold(parseFloat(e.target.value))}
              className="w-full accent-brand-danger bg-[#111928] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Manual Temp Override */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Vaccine Internal Temp</span>
              <span className="text-purple-400 font-semibold">{telemetry?.internal_temp?.toFixed(1) || 4.0}°C</span>
            </div>
            <input
              type="range"
              min="-2"
              max="25"
              step="0.2"
              value={telemetry?.internal_temp || 4.0}
              onChange={(e) => onUpdateTempOverride(parseFloat(e.target.value))}
              className="w-full accent-purple-500 bg-[#111928] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Failure Trigger Button */}
        <div className="mt-5 pt-3 border-t border-brand-glassBorder">
          {coolingActive ? (
            <button
              onClick={() => onToggleCooling(false)}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-glowRed transition-all active:scale-[0.98]"
            >
              <Flame className="w-4 h-4 fill-white" />
              <span>Trigger Cooling Failure</span>
            </button>
          ) : (
            <button
              onClick={() => onToggleCooling(true)}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-4 rounded-lg shadow-glowGreen transition-all active:scale-[0.98]"
            >
              <Snowflake className="w-4 h-4 animate-spin" />
              <span>Repair & Restore Cooling</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Live Environmental Adjustments */}
      <div className="glass-card p-4 rounded-xl border border-brand-glassBorder shadow-md flex-1 overflow-y-auto max-h-[300px]">
        <div className="flex items-center space-x-2 border-b border-brand-glassBorder pb-2 mb-3">
          <Thermometer className="w-5 h-5 text-brand-neonBlue" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-brand-neonBlue">Zone Temperatures</h2>
        </div>

        <div className="space-y-4 pr-1">
          {zones.map((zone) => {
            const liveTemp = telemetry?.zones_temperatures?.[zone.id] ?? zone.default_temp;
            let barColor = "accent-brand-neonBlue"; // Cool
            if (liveTemp > 15.0 && liveTemp <= 32.0) {
              barColor = "accent-brand-warning"; // Moderate
            } else if (liveTemp > 32.0) {
              barColor = "accent-brand-danger"; // Danger
            }

            return (
              <div key={zone.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-300">{zone.name}</span>
                  <span className={`font-semibold ${liveTemp > 32.0 ? "text-brand-danger" : liveTemp > 15.0 ? "text-brand-warning" : "text-brand-neonCyan"}`}>
                    {liveTemp.toFixed(1)}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="50"
                  step="0.5"
                  value={liveTemp}
                  onChange={(e) => onUpdateZoneTemp(zone.id, parseFloat(e.target.value))}
                  className={`w-full ${barColor} bg-[#111928] h-1.5 rounded-lg appearance-none cursor-pointer`}
                />
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
