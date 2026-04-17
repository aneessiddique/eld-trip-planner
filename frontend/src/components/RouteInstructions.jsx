import React from "react";
import { ChevronRight } from "lucide-react";

function RouteInstructions({ instructions }) {
  if (!instructions || instructions.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        <div className="text-3xl mb-2">📋</div>
        <p className="font-medium">Route Instructions</p>
        <p className="text-sm">Instructions will appear after trip calculation</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600 mb-4">Route Instructions</h3>
      <div className="space-y-3">
        {instructions.map((step, index) => {
          const instruction = step.instruction?.trim() || step.road?.trim() || "Unnamed Road";
          const distance = typeof step.distance_miles === 'number' ? step.distance_miles.toFixed(1) : "0.0";
          const duration = typeof step.duration_hours === 'number' ? step.duration_hours.toFixed(1) : "0.0";
          return (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50/50 hover:bg-blue-50 transition-colors">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 leading-relaxed">
                  {instruction}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  {distance} miles • {duration} hours
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RouteInstructions;
