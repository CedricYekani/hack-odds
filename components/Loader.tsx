import React from 'react';

export const Loader: React.FC<{ text?: string }> = ({ text = "Scouting matches..." }) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-pitch-500 rounded-full border-t-transparent animate-spin"></div>
    </div>
    <p className="text-slate-400 text-sm animate-pulse">{text}</p>
  </div>
);