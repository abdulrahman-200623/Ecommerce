import React from "react";

/**
 * Authentic TechZone Retail Brand Logo
 * Clean, modern electronics retail identity:
 * - Crisp geometric circuit monogram with lavender (#7C5CFC) accent
 * - Deep black typography for "Tech" (#111827) and refined lavender for "Zone" (#7C5CFC)
 * - Optimized for white and light navbar backgrounds
 */
export default function TechZoneLogo({ onClick, className = "", size = "normal" }) {
  const isCompact = size === "compact";
  const iconSize = isCompact ? 30 : 34;

  return (
    <button
      type="button"
      className={`techzone-navbar-logo ${className}`}
      onClick={onClick}
      aria-label="TechZone Home"
      title="TechZone - Electronics Retail Store"
      id="techzone-brand-logo-btn"
    >
      {/* Refined Retail Monogram Symbol */}
      <span className="techzone-logo-symbol" aria-hidden="true">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle lavender container base */}
          <rect
            x="2"
            y="2"
            width="32"
            height="32"
            rx="9"
            fill="#F4F0FF"
            stroke="#DDD6FE"
            strokeWidth="1.5"
          />

          {/* Minimalist Microchip Node Grid */}
          <circle cx="8" cy="18" r="1.5" fill="#7C5CFC" />
          <circle cx="28" cy="18" r="1.5" fill="#7C5CFC" />
          <path
            d="M8 18H11M25 18H28"
            stroke="#C4B5FD"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Clean "T" Crossbar in deep black */}
          <path
            d="M10 11.5H26"
            stroke="#111827"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Dynamic "Z" Monogram Path in rich lavender */}
          <path
            d="M21 12.5L13.5 23.5H23.5"
            stroke="#7C5CFC"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Precision Accent Pulse Dot */}
          <circle cx="23.5" cy="23.5" r="1.4" fill="#5B21B6" />
        </svg>
      </span>

      {/* Brand Typography: Deep Black + Primary Lavender */}
      <span className="techzone-logo-text">
        <span className="logo-text-tech">Tech</span>
        <span className="logo-text-zone">Zone</span>
      </span>
    </button>
  );
}
