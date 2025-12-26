import React from "react";

export function SpinnerLoader({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin-slow mb-6 ${className}`}
      width="80"
      height="80"
      viewBox="0 0 80 80"
    >
      {/* Fondo */}
      <circle
        cx="40"
        cy="40"
        r="32"
        stroke="#222c38"
        strokeWidth="8"
        fill="none"
        opacity="0.25"
      />
      {/* Azul */}
      <circle
        cx="40"
        cy="40"
        r="32"
        stroke="#2563eb"
        strokeWidth="5"
        fill="none"
        strokeDasharray="32 100"
        strokeDashoffset="0"
        strokeLinecap="round"
      />
      {/* Verde */}
      <circle
        cx="40"
        cy="40"
        r="32"
        stroke="#22d3ee"
        strokeWidth="5"
        fill="none"
        strokeDasharray="32 100"
        strokeDashoffset="40"
        strokeLinecap="round"
      />
      {/* Amarillo */}
      <circle
        cx="40"
        cy="40"
        r="32"
        stroke="#fde047"
        strokeWidth="5"
        fill="none"
        strokeDasharray="32 100"
        strokeDashoffset="80"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Animación CSS global (puedes poner esto en globals.css si lo prefieres)
export const spinnerAnimationStyle = `
@keyframes spin-slow {
  to {
    transform: rotate(360deg);
  }
}
.animate-spin-slow {
  animation: spin-slow 1.2s linear infinite;
}
`;
