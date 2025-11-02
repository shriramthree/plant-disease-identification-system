
import React from 'react';

const LeafIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 20A7 7 0 0 1 4 13V4a2 2 0 0 1 2-2h1" />
    <path d="M15 10a3 3 0 0 1-6 0" />
    <path d="M12 21a7 7 0 0 0 7-7h-1" />
    <path d="M18 8a3 3 0 0 0-6 0" />
  </svg>
);

export default LeafIcon;
