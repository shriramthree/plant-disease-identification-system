import React from 'react';

const TableIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M12 3H20.5C20.7761 3 21 3.22386 21 3.5V20.5C21 20.7761 20.7761 21 20.5 21H3.5C3.22386 21 3 20.7761 3 20.5V3.5C3 3.22386 3.22386 3 3.5 3H12Z" />
    <path d="M3 9H21" />
    <path d="M9 21V9" />
  </svg>
);

export default TableIcon;
