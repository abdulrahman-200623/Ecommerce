import React, { useState, memo } from "react";
import { Star } from "lucide-react";

const STAR_DESCRIPTIONS = {
  1: "1 Star — Poor experience",
  2: "2 Stars — Below expectations",
  3: "3 Stars — Average, meets expectations",
  4: "4 Stars — Good quality, satisfied",
  5: "5 Stars — Excellent, highly recommended!"
};

/**
 * Optimized, reusable StarRatingSelector component.
 * Maintains isolated local state for hoveredRating so that hover interactions
 * only re-render this compact component without triggering parent re-renders
 * or making unnecessary network requests.
 */
const StarRatingSelector = memo(function StarRatingSelector({
  value = 5,
  onChange,
  size = 32,
  disabled = false
}) {
  // Local state strictly for hover visual state
  const [hoverRating, setHoverRating] = useState(0);

  // Active display rating is hovered rating if currently hovering, else selected value
  const displayRating = hoverRating > 0 ? hoverRating : (value || 0);

  const handleMouseEnter = (starVal) => {
    if (disabled) return;
    setHoverRating(starVal);
  };

  const handleContainerMouseLeave = () => {
    if (disabled) return;
    setHoverRating(0);
  };

  const handleClick = (starVal) => {
    if (disabled) return;
    if (onChange) {
      onChange(starVal);
    }
  };

  return (
    <div className="star-rating-selector-container">
      <div
        className="interactive-stars-row"
        onMouseLeave={handleContainerMouseLeave}
        role="radiogroup"
        aria-label="Star rating selector"
      >
        {[1, 2, 3, 4, 5].map((starVal) => {
          const isFilled = starVal <= displayRating;
          return (
            <button
              type="button"
              key={starVal}
              className={`star-interactive-btn ${isFilled ? "filled" : "empty"}`}
              onMouseEnter={() => handleMouseEnter(starVal)}
              onClick={() => handleClick(starVal)}
              disabled={disabled}
              role="radio"
              aria-checked={value === starVal}
              aria-label={`Rate ${starVal} star${starVal > 1 ? "s" : ""}`}
              id={`star-selector-btn-${starVal}`}
            >
              <Star
                size={size}
                fill={isFilled ? "#f59e0b" : "none"}
                color={isFilled ? "#f59e0b" : "#64748b"}
              />
            </button>
          );
        })}
        <span className="rating-descriptor-text" id="star-rating-descriptor">
          {STAR_DESCRIPTIONS[displayRating] || `${displayRating} Stars`}
        </span>
      </div>
    </div>
  );
});

export default StarRatingSelector;
