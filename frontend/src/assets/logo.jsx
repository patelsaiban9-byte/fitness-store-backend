import React from "react";

export const Logo = ({ size = 40, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Health and Fitness Store logo"
    >
      <defs>
        <linearGradient id="fitHubRing" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id="fitHubCore" x1="28" y1="26" x2="92" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0f172a" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="fitHubMetal" x1="14" y1="58" x2="106" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f8fafc" />
          <stop offset="1" stopColor="#cbd5e1" />
        </linearGradient>
        <filter id="fitHubShadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter="url(#fitHubShadow)">
        <circle cx="60" cy="60" r="52" fill="url(#fitHubRing)" />
        <circle cx="60" cy="60" r="43" fill="url(#fitHubCore)" />

        <rect x="28" y="53" width="64" height="10" rx="5" fill="url(#fitHubMetal)" />

        <rect x="18" y="45" width="10" height="26" rx="3" fill="#f59e0b" />
        <rect x="14" y="41" width="4" height="34" rx="2" fill="#d97706" />
        <rect x="28" y="49" width="5" height="18" rx="2" fill="#f59e0b" />

        <rect x="92" y="45" width="10" height="26" rx="3" fill="#f59e0b" />
        <rect x="102" y="41" width="4" height="34" rx="2" fill="#d97706" />
        <rect x="87" y="49" width="5" height="18" rx="2" fill="#f59e0b" />

        <path
          d="M60 34 L48 57 H58 L52 82 L72 54 H61 L68 34 Z"
          fill="#22c55e"
          stroke="#ecfeff"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

export default Logo;
