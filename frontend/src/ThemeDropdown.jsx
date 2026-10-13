import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, ChevronDown, Check } from "lucide-react";
import { useTheme } from "./ThemeContext";

export default function ThemeDropdown({ className = "" }) {
  const { theme, setTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (selectedTheme) => {
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  return (
    <div className={`theme-dropdown-wrapper ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`theme-navbar-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        id="navbar-theme-toggle-btn"
        title={`Current theme: ${isDark ? "Dark Theme" : "Light Theme"}. Click to change theme.`}
      >
        <span className="theme-btn-icon-wrap">
          {isDark ? (
            <Moon size={17} className="theme-btn-icon moon" />
          ) : (
            <Sun size={17} className="theme-btn-icon sun" />
          )}
        </span>
        <span className="theme-btn-text">Theme</span>
        <ChevronDown
          size={14}
          className={`theme-btn-chevron ${isOpen ? "open" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="theme-dropdown-menu"
          role="menu"
          aria-labelledby="navbar-theme-toggle-btn"
          id="navbar-theme-menu"
        >
          <div className="theme-dropdown-header">
            <span>Display Theme</span>
          </div>

          {/* Light Theme Option */}
          <button
            type="button"
            role="menuitem"
            className={`theme-menu-item ${theme === "light" ? "selected" : ""}`}
            onClick={() => handleSelect("light")}
            id="theme-option-light"
          >
            <div className="theme-item-left">
              <span className="theme-option-icon light-icon">
                <Sun size={16} />
              </span>
              <span className="theme-item-label">Light Theme</span>
            </div>
            {theme === "light" && (
              <span className="theme-active-check" aria-label="Selected">
                <Check size={14} />
              </span>
            )}
          </button>

          {/* Dark Theme Option */}
          <button
            type="button"
            role="menuitem"
            className={`theme-menu-item ${theme === "dark" ? "selected" : ""}`}
            onClick={() => handleSelect("dark")}
            id="theme-option-dark"
          >
            <div className="theme-item-left">
              <span className="theme-option-icon dark-icon">
                <Moon size={16} />
              </span>
              <span className="theme-item-label">Dark Theme</span>
            </div>
            {theme === "dark" && (
              <span className="theme-active-check" aria-label="Selected">
                <Check size={14} />
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
