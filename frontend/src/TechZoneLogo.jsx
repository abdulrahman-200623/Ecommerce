import React from "react";

/**
 * Modern TechZone Brand Logo
 * Combines a custom technology-inspired blue-and-white circuit monogram symbol
 * with professional "TechZone" typography ("Tech" in white, "Zone" in electric blue).
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
      title="TechZone - Electronics E-Commerce"
      id="techzone-brand-logo-btn"
    >
      {/* Modern Blue & White Technology-Inspired Symbol */}
      <span className="techzone-logo-symbol" aria-hidden="true">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="tzBlueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#2563eb" />
            </linearGradient>
            <linearGradient id="tzInnerGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1e293b" />
              <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>
          </defs>

          {/* Microchip / Hex-shield Base Container */}
          <rect
            x="2"
            y="2"
            width="32"
            height="32"
            rx="8.5"
            fill="url(#tzInnerGlow)"
            stroke="url(#tzBlueGradient)"
            strokeWidth="1.8"
          />

          {/* Technology Circuit Node Lines */}
          <path
            d="M6 18H9M27 18H30"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M18 6V9M18 27V30"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Stylized "T" Crossbar in Crisp White */}
          <path
            d="M9.5 11.5H26.5"
            stroke="#ffffff"
            strokeWidth="2.75"
            strokeLinecap="round"
          />

          {/* Dynamic "Z" / Lightning Energy Stem in Vibrant Blue */}
          <path
            d="M20.5 12L12.5 22.5H24"
            stroke="url(#tzBlueGradient)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Accent Circuit Node Dots */}
          <circle cx="24" cy="22.5" r="1.5" fill="#38bdf8" />
          <circle cx="12" cy="11.5" r="1.3" fill="#ffffff" />
        </svg>
      </span>

      {/* Brand Typography: "Tech" in White, "Zone" in Bright Blue */}
      <span className="techzone-logo-text">
        <span className="logo-text-tech">Tech</span>
        <span className="logo-text-zone">Zone</span>
      </span>
    </button>
  );
}
