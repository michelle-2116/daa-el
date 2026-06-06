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
    if (risk <= 1.5) return { text: "Optimal", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" };
    if (risk <= 3.0) return { text: "Warning", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
    return { text: "Critical", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" };
  };

  const activeRiskInfo = getRiskLabel(current_risk_score);
  const routeRiskInfo = getRiskLabel(avg_risk);

  return (
    <div className="space-y-6 text-slate-700">

      {/* 1. Telemetry Dashboard Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Lat/Lon */}
        <div className="glass-card p-3 rounded-lg border border-brand-glassBorder flex items-center space-x-3">
          <MapPin className="w-5 h-5 text-brand-neonBlue shrink-0" />
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Coordinates</div>
            <div className="text-xs font-mono font-bold text-slate-800 leading-tight">
              {truck_position?.lat?.toFixed(4)}° N<br/>
              {truck_position?.lon?.toFixed(4)}° E
            </div>
          </div>
        </div>

        {/* Route Type */}
        <div className="glass-card p-3 rounded-lg border border-brand-glassBorder flex items-center space-x-3">
          <GitCommit className="w-5 h-5 text-purple-600 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Route Status</div>
            <div className={`text-xs font-bold leading-tight uppercase ${route_type === "rerouted" ? "text-purple-700" : "text-slate-600"}`}>
              {route_type === "rerouted" ? "Dynamic Rerouted" : "Standard Route"}
            </div>
          </div>
        </div>

        {/* Internal Temp */}
        <div className={`glass-card p-3 rounded-lg border flex items-center space-x-3 transition-all ${isOverThreshold ? "border-brand-danger bg-rose-50" : "border-brand-glassBorder"}`}>
          <Activity className={`w-5 h-5 shrink-0 ${isOverThreshold ? "text-brand-danger animate-pulse" : "text-brand-neonCyan"}`} />
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Internal Temp</div>
            <div className={`text-sm font-bold font-mono ${isOverThreshold ? "text-brand-danger font-black" : "text-slate-850"}`}>
              {internal_temp.toFixed(2)}°C
            </div>
          </div>
        </div>

        {/* External (Zone) Temp */}
        <div className="glass-card p-3 rounded-lg border border-brand-glassBorder flex items-center space-x-3">
          <Compass className="w-5 h-5 text-brand-warning shrink-0" />
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Outside (Zone)</div>
            <div className="text-xs font-bold truncate text-slate-800 leading-tight">
              {external_temp.toFixed(1)}°C<br/>
              <span className="text-[9px] text-slate-500">{current_zone_name}</span>
            </div>
          </div>
        </div>

        {/* Speed */}
        <div className="glass-card p-3 rounded-lg border border-brand-glassBorder flex items-center space-x-3">
          <Wind className="w-5 h-5 text-slate-500 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Transit Speed</div>
            <div className="text-sm font-bold text-slate-800">{currentSpeed.toFixed(0)} km/h</div>
          </div>
        </div>

        {/* ETA */}
        <div className="glass-card p-3 rounded-lg border border-brand-glassBorder flex items-center space-x-3">
          <Clock className="w-5 h-5 text-cyan-600 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase">ETA (Remaining)</div>
            <div className="text-sm font-bold text-slate-800 font-mono">{formatETA(eta_seconds)}</div>
          </div>
        </div>
      </div>

      {/* 2. Anomaly Alert Alertbox */}
      {active_anomaly ? (
        <div className="border border-brand-danger bg-rose-50 text-rose-800 p-3.5 rounded-lg flex items-start space-x-3 animate-pulse">
          <ShieldAlert className="w-6 h-6 text-brand-danger shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-black uppercase text-brand-danger tracking-wider">Vaccine Alert! ({active_anomaly.type})</div>
            <div className="text-[11px] leading-relaxed mt-0.5">{active_anomaly.message}</div>
          </div>
        </div>
      ) : (
        <div className="border border-brand-success/30 bg-emerald-50 text-emerald-800 p-3 rounded-lg flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-brand-success shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-brand-success">Cold-chain Safe.</span> Thermal values stable inside safety threshold ({temp_threshold}°C).
          </div>
        </div>
      )}

      {/* 3. Risk Level Indicator */}
      <div className="glass-card p-4 rounded-xl border border-brand-glassBorder shadow-md">
        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Zone & Route Risk Levels</div>
        <div className="grid grid-cols-2 gap-3 text-center">
          
          <div className={`p-2 rounded-lg border ${activeRiskInfo.border} ${activeRiskInfo.bg}`}>
            <div className="text-[10px] text-slate-500 font-medium">Zone Local Risk</div>
            <div className={`text-base font-black ${activeRiskInfo.color}`}>
              {activeRiskInfo.text}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Factor: {current_risk_score.toFixed(1)}</div>
          </div>

          <div className={`p-2 rounded-lg border ${routeRiskInfo.border} ${routeRiskInfo.bg}`}>
            <div className="text-[10px] text-slate-500 font-medium">Average Route Risk</div>
            <div className={`text-base font-black ${routeRiskInfo.color}`}>
              {routeRiskInfo.text}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Score: {avg_risk.toFixed(1)}</div>
          </div>

        </div>
      </div>

      {/* 4. Route Comparison Panel */}
      {route_comparison && (
        <div className="glass-card p-4 rounded-xl border border-brand-glassBorder shadow-md">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">Route Optimization Matrix</div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-brand-glassBorder text-slate-500 font-medium">
                <th className="pb-1.5 font-semibold">Parameter</th>
                <th className="pb-1.5 font-semibold text-right">Original Route</th>
                <th className="pb-1.5 font-semibold text-right text-brand-success">Dynamic Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-glassBorder/40">
              <tr>
                <td className="py-2 text-slate-600">Distance (km)</td>
                <td className="py-2 text-right text-slate-500 font-mono">{route_comparison.original.distance}</td>
                <td className="py-2 text-right font-bold font-mono text-slate-800">{route_comparison.current.distance}</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-600">Avg Risk Rating</td>
                <td className="py-2 text-right text-slate-500 font-mono">{route_comparison.original.avg_risk}</td>
                <td className="py-2 text-right font-bold font-mono text-slate-800">{route_comparison.current.avg_risk}</td>
              </tr>
              <tr className="font-semibold text-sm">
                <td className="py-2 text-slate-600">Route Cost</td>
                <td className="py-2 text-right text-slate-500 font-mono">{route_comparison.original.cost}</td>
                <td className="py-2 text-right font-black font-mono text-brand-neonBlue">{route_comparison.current.cost}</td>
              </tr>
            </tbody>
          </table>

          {route_type === "rerouted" && (
            <div className="mt-3 text-[10px] text-purple-600 leading-tight">
              * Route updated dynamically. Dijkstra bypassed high-risk heat zones to protect vaccine potency.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
