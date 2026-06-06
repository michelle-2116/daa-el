import React from "react";
import { ShieldAlert, ShieldCheck, HelpCircle, Activity, Compass, MapPin, Wind, TrendingUp, Clock, GitCommit } from "lucide-react";

export default function Analytics({ telemetry }) {
  if (!telemetry) return null;

  const {
    internal_temp,
    external_temp,
    current_zone_name,
    current_risk_score,
    truck_speed_kmh,
    speed_multiplier,
    distance_km,
    avg_risk,
    cost,
    eta_seconds,
    route_type,
    active_anomaly,
    temp_threshold,
    truck_position,
    route_comparison
  } = telemetry;

  // Format ETA to hours, minutes, seconds
  const formatETA = (totalSecs) => {
    if (totalSecs <= 0) return "Arrived";
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = Math.floor(totalSecs % 60);
    
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const currentSpeed = truck_speed_kmh * speed_multiplier;
  const isOverThreshold = internal_temp > temp_threshold;

  // Risk Rating logic
  const getRiskLabel = (risk) => {
    if (risk <= 1.5) return { text: "LOW", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-250" };
    if (risk <= 3.0) return { text: "MODERATE", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-250" };
    return { text: "CRITICAL", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-250" };
  };

  const activeRiskInfo = getRiskLabel(current_risk_score);
  const routeRiskInfo = getRiskLabel(avg_risk);

  return (
    <div className="space-y-3.5 text-slate-700 text-xs">

      {/* 1. Telemetry Dashboard Grid */}
      <div className="grid grid-cols-2 border border-brand-border bg-white select-none">
        {/* Lat/Lon */}
        <div className="border-b border-r border-brand-border p-2 flex items-center space-x-2">
          <MapPin className="w-3.5 h-3.5 text-brand-accent shrink-0" />
          <div>
            <div className="text-[9px] text-slate-400 font-mono uppercase">Coordinates</div>
            <div className="text-xs font-mono font-bold text-slate-800 leading-tight">
              {truck_position?.lat?.toFixed(4)} N<br/>
              {truck_position?.lon?.toFixed(4)} E
            </div>
          </div>
        </div>

        {/* Route Type */}
        <div className="border-b border-brand-border p-2 flex items-center space-x-2">
          <GitCommit className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div>
            <div className="text-[9px] text-slate-400 font-mono uppercase">Route Status</div>
            <div className={`text-xs font-mono font-bold leading-tight ${route_type === "rerouted" ? "text-amber-600" : "text-slate-600"}`}>
              {route_type === "rerouted" ? "REROUTED" : "STANDARD"}
            </div>
          </div>
        </div>

        {/* Internal Temp */}
        <div className={`border-b border-r border-brand-border p-2 flex items-center space-x-2 transition-all ${isOverThreshold ? "bg-rose-50/50" : ""}`}>
          <Activity className={`w-3.5 h-3.5 shrink-0 ${isOverThreshold ? "text-brand-danger animate-pulse" : "text-brand-accent"}`} />
          <div>
            <div className="text-[9px] text-slate-400 font-mono uppercase">Internal Temp</div>
            <div className={`text-xs font-bold font-mono ${isOverThreshold ? "text-brand-danger font-black" : "text-slate-800"}`}>
              {internal_temp.toFixed(2)}C
            </div>
          </div>
        </div>

        {/* External (Zone) Temp */}
        <div className="border-b border-brand-border p-2 flex items-center space-x-2">
          <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div>
            <div className="text-[9px] text-slate-400 font-mono uppercase">Ambient Temp</div>
            <div className="text-xs font-bold text-slate-800 leading-tight">
              <span className="font-mono">{external_temp.toFixed(1)}C</span>
              <div className="text-[8px] text-slate-450 truncate max-w-[110px]" title={current_zone_name}>{current_zone_name}</div>
            </div>
          </div>
        </div>

        {/* Speed */}
        <div className="border-r border-brand-border p-2 flex items-center space-x-2">
          <Wind className="w-3.5 h-3.5 text-slate-450 shrink-0" />
          <div>
            <div className="text-[9px] text-slate-400 font-mono uppercase">Transit Speed</div>
            <div className="text-xs font-mono font-bold text-slate-800">{currentSpeed.toFixed(0)} km/h</div>
          </div>
        </div>

        {/* ETA */}
        <div className="p-2 flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-slate-450 shrink-0" />
          <div>
            <div className="text-[9px] text-slate-400 font-mono uppercase">ETA</div>
            <div className="text-xs font-bold text-slate-800 font-mono">{formatETA(eta_seconds)}</div>
          </div>
        </div>
      </div>

      {/* 2. Anomaly Alert Alertbox */}
      {active_anomaly ? (
        <div className="border border-brand-danger bg-rose-50/50 text-rose-800 p-2 flex items-start space-x-2 animate-pulse">
          <ShieldAlert className="w-4 h-4 text-brand-danger shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-mono font-bold uppercase text-brand-danger tracking-wider">THERMAL ANOMALY: {active_anomaly.type.toUpperCase()}</div>
            <div className="text-[10px] leading-snug mt-0.5 font-mono text-rose-700">{active_anomaly.message}</div>
          </div>
        </div>
      ) : (
        <div className="border border-brand-success/30 bg-emerald-50/50 text-emerald-800 p-2 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-brand-success shrink-0" />
          <div className="text-[10px] font-mono">
            THERMAL STATE: NOMINAL (Limit: {temp_threshold.toFixed(1)}C)
          </div>
        </div>
      )}

      {/* 3. Risk Level Indicator */}
      <div className="py-2.5 border-b border-brand-border select-none">
        <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mb-2">Zone & Route Risk Assessment</div>
        <div className="grid grid-cols-2 gap-2 text-center">
          
          <div className={`p-1.5 border ${activeRiskInfo.border} ${activeRiskInfo.bg}`}>
            <div className="text-[8px] text-slate-500 uppercase font-mono">Ambient Risk</div>
            <div className={`text-xs font-mono font-bold ${activeRiskInfo.color}`}>
              {activeRiskInfo.text}
            </div>
            <div className="text-[8px] text-slate-400 font-mono mt-0.5">Factor: {current_risk_score.toFixed(1)}</div>
          </div>

          <div className={`p-1.5 border ${routeRiskInfo.border} ${routeRiskInfo.bg}`}>
            <div className="text-[8px] text-slate-500 uppercase font-mono">Mean Route Risk</div>
            <div className={`text-xs font-mono font-bold ${routeRiskInfo.color}`}>
              {routeRiskInfo.text}
            </div>
            <div className="text-[8px] text-slate-400 font-mono mt-0.5">Index: {avg_risk.toFixed(1)}</div>
          </div>

        </div>
      </div>

      {/* 4. Route Comparison Panel */}
      {route_comparison && (
        <div className="pt-2.5">
          <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mb-2">Path Analysis Matrix</div>
          <table className="w-full text-left text-[10px] border-collapse font-mono">
            <thead>
              <tr className="border-b border-brand-border text-slate-400 font-medium">
                <th className="pb-1 font-semibold uppercase text-[9px]">Metric</th>
                <th className="pb-1 font-semibold text-right uppercase text-[9px]">Original</th>
                <th className="pb-1 font-semibold text-right text-brand-accent uppercase text-[9px]">Computed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-1.5 text-slate-500 font-sans text-xs">Distance (km)</td>
                <td className="py-1.5 text-right text-slate-500 font-bold">{route_comparison.original.distance}</td>
                <td className="py-1.5 text-right font-bold text-slate-800">{route_comparison.current.distance}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-slate-500 font-sans text-xs">Avg Risk Rating</td>
                <td className="py-1.5 text-right text-slate-500 font-bold">{route_comparison.original.avg_risk}</td>
                <td className="py-1.5 text-right font-bold text-slate-800">{route_comparison.current.avg_risk}</td>
              </tr>
              <tr className="font-semibold text-xs border-t border-slate-200">
                <td className="py-1.5 text-slate-600 font-sans">Path Penalty</td>
                <td className="py-1.5 text-right text-slate-450">{route_comparison.original.cost}</td>
                <td className="py-1.5 text-right font-black text-brand-accent">{route_comparison.current.cost}</td>
              </tr>
            </tbody>
          </table>

          {route_type === "rerouted" && (
            <div className="mt-2 text-[9px] font-mono text-amber-600 leading-tight">
              Transit path dynamic update: Ambient risk parameters exceeded.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
