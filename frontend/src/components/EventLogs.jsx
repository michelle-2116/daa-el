import React, { useEffect, useRef } from "react";
import { Terminal } from "lucide-react";

export default function EventLogs({ logs }) {
  const containerRef = useRef(null);

  // Auto-scroll to bottom on log updates
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-card p-4 rounded-xl border border-brand-glassBorder shadow-md flex flex-col h-[200px]">
      <div className="flex items-center justify-between border-b border-brand-glassBorder pb-2 mb-2">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-brand-neonBlue" />
          <h2 className="font-bold text-xs uppercase tracking-wider text-brand-neonBlue font-sans">Operational Audit Log</h2>
        </div>
        <span className="w-2 h-2 rounded-full bg-brand-success"></span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto font-mono text-[10.5px] leading-relaxed space-y-1.5 pr-1 scroll-smooth"
      >
        {logs && logs.length > 0 ? (
          logs.map((log, index) => {
            // Apply contextual coloring to logs to enhance readability
            let textColor = "text-slate-600";
            
            if (log.toLowerCase().includes("anomaly") || log.toLowerCase().includes("failed")) {
              textColor = "text-brand-danger font-semibold";
            } else if (log.toLowerCase().includes("rerouting") || log.toLowerCase().includes("new safer route")) {
              textColor = "text-purple-700 font-semibold";
            } else if (log.toLowerCase().includes("started") || log.toLowerCase().includes("delivered") || log.toLowerCase().includes("stabilized")) {
              textColor = "text-brand-success font-semibold";
            } else if (log.toLowerCase().includes("arrived") || log.toLowerCase().includes("entered")) {
              textColor = "text-brand-warning font-semibold";
            } else if (log.toLowerCase().includes("initialized") || log.toLowerCase().includes("configuration")) {
              textColor = "text-brand-neonBlue font-semibold";
            }

            return (
              <div key={index} className={`${textColor} break-words transition-all duration-200 hover:bg-slate-50 px-1 rounded`}>
                {log}
              </div>
            );
          })
        ) : (
          <div className="text-slate-400 italic h-full flex items-center justify-center font-sans">
            Terminal idle. Generate route to initialize system log.
          </div>
        )}
      </div>
    </div>
  );
}
