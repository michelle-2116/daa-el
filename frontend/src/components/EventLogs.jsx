import React, { useEffect, useRef } from "react";

export default function EventLogs({ logs }) {
  const containerRef = useRef(null);

  // Auto-scroll to bottom on log updates
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col flex-1 h-full min-h-[150px]">
      <div className="flex items-center justify-between border-b border-brand-border pb-1 mb-1.5 select-none">
        <h2 className="font-mono font-bold text-[10px] uppercase tracking-wider text-slate-800">Operational Audit Feed</h2>
        <span className="font-mono text-[9px] text-brand-success uppercase font-semibold">FEED: NOMINAL</span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto font-mono text-[10px] leading-normal space-y-1 pr-1 scroll-smooth"
      >
        {logs && logs.length > 0 ? (
          logs.map((log, index) => {
            let textColor = "text-slate-500";
            
            if (log.toLowerCase().includes("anomaly") || log.toLowerCase().includes("failed")) {
              textColor = "text-brand-danger font-semibold";
            } else if (log.toLowerCase().includes("rerouting") || log.toLowerCase().includes("new safer route")) {
              textColor = "text-brand-warning font-semibold";
            } else if (log.toLowerCase().includes("started") || log.toLowerCase().includes("delivered") || log.toLowerCase().includes("stabilized")) {
              textColor = "text-brand-success font-semibold";
            } else if (log.toLowerCase().includes("arrived") || log.toLowerCase().includes("entered")) {
              textColor = "text-brand-accent font-semibold";
            } else if (log.toLowerCase().includes("initialized") || log.toLowerCase().includes("configuration")) {
              textColor = "text-slate-800 font-semibold";
            }

            return (
              <div key={index} className={`${textColor} break-words py-0.5 px-1 rounded-sm hover:bg-slate-50`}>
                {log}
              </div>
            );
          })
        ) : (
          <div className="text-slate-400 italic h-full flex items-center justify-center text-[9px]">
            System log standby.
          </div>
        )}
      </div>
    </div>
  );
}
