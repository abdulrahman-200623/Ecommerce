import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function CategoryDropdown({
  value = "All",
  onChange,
  categories = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync highlightedIndex when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const idx = categories.findIndex(
        (c) => c.toLowerCase() === (value || "All").toLowerCase()
      );
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, categories]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll(".category-dropdown-option");
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (category) => {
    if (onChange) {
      onChange(category);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % categories.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + categories.length) % categories.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < categories.length) {
        handleSelect(categories[highlightedIndex]);
      }
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  return (
    <div className="select category-dropdown-container" ref={dropdownRef}>
      {/* Hidden native select for form accessibility fallback */}
      <select
        aria-hidden="true"
        tabIndex={-1}
        className="category-dropdown-native-hidden"
        value={value}
        onChange={(e) => handleSelect(e.target.value)}
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Accessible trigger button */}
      <button
        type="button"
        id="category-dropdown-trigger"
        className={`category-dropdown-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Filter products by category"
      >
        <span className="category-dropdown-selected-text">
          {value || "All"}
        </span>
        <ChevronDown
          size={16}
          className={`category-dropdown-arrow ${isOpen ? "open" : ""}`}
        />
      </button>

      {/* Dark Theme Dropdown Menu */}
      {isOpen && (
        <ul
          id="category-dropdown-list"
          className="category-dropdown-menu"
          role="listbox"
          aria-labelledby="category-dropdown-trigger"
          ref={listRef}
        >
          {categories.map((c, index) => {
            const isSelected =
              c.toLowerCase() === (value || "All").toLowerCase();
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={c}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                className={`category-dropdown-option ${
                  isSelected ? "selected" : ""
                } ${isHighlighted ? "highlighted" : ""}`}
                onClick={() => handleSelect(c)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="category-option-label">{c}</span>
                {isSelected && (
                  <span className="category-option-check" aria-hidden="true">
                    <Check size={14} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
