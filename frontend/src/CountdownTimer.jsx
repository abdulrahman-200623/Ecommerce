import React, { useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";

/**
 * Reusable dynamic countdown timer.
 * Compares target timestamp against current time every second.
 * Does not reset on page refresh.
 */
export default function CountdownTimer({
  startTime,
  endTime,
  serverTime,
  onExpire,
  size = "large", // "large" | "compact" | "card"
  showLabels = true
}) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date().getTime();
    const start = startTime ? new Date(startTime).getTime() : now;
    const end = endTime ? new Date(endTime).getTime() : now;

    let target = end;
    let mode = "active"; // "upcoming" | "active" | "expired"

    if (now < start) {
      mode = "upcoming";
      target = start;
    } else if (now > end) {
      mode = "expired";
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, mode: "expired" };
    }

    const diff = Math.max(0, target - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return {
      days,
      hours,
      minutes,
      seconds,
      total: diff,
      mode
    };
  }

  useEffect(() => {
    // Initial sync
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);

      if (updated.total <= 0 && updated.mode === "expired") {
        if (onExpire) onExpire();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const pad = (n) => String(n).padStart(2, "0");

  if (timeLeft.mode === "expired") {
    return (
      <div className={`countdown-container countdown-${size} countdown-expired`}>
        <span className="countdown-expired-badge">Deal Ended</span>
      </div>
    );
  }

  const labelText = timeLeft.mode === "upcoming" ? "Starts in" : "Ends in";

  if (size === "card") {
    return (
      <div className="countdown-card-pill" title={`${labelText}: ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`}>
        <Zap size={12} className="pulsing-zap" />
        <span className="countdown-card-label">{labelText}:</span>
        <span className="countdown-card-digits">
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  if (size === "compact") {
    return (
      <div className="countdown-compact-wrap">
        <Clock size={14} className="countdown-icon" />
        <span className="countdown-compact-label">{labelText}:</span>
        <div className="countdown-compact-boxes">
          {timeLeft.days > 0 && <span className="compact-box">{pad(timeLeft.days)}d</span>}
          <span className="compact-box">{pad(timeLeft.hours)}h</span>
          <span className="compact-sep">:</span>
          <span className="compact-box">{pad(timeLeft.minutes)}m</span>
          <span className="compact-sep">:</span>
          <span className="compact-box">{pad(timeLeft.seconds)}s</span>
        </div>
      </div>
    );
  }

  return (
    <div className="countdown-large-wrap">
      <div className="countdown-heading-label">
        <Clock size={16} className="countdown-clock-icon" />
        <span>{labelText}</span>
      </div>
      <div className="countdown-grid">
        <div className="countdown-box">
          <div className="countdown-num">{pad(timeLeft.days)}</div>
          {showLabels && <div className="countdown-unit">DAYS</div>}
        </div>
        <div className="countdown-divider">:</div>
        <div className="countdown-box">
          <div className="countdown-num">{pad(timeLeft.hours)}</div>
          {showLabels && <div className="countdown-unit">HOURS</div>}
        </div>
        <div className="countdown-divider">:</div>
        <div className="countdown-box">
          <div className="countdown-num">{pad(timeLeft.minutes)}</div>
          {showLabels && <div className="countdown-unit">MINS</div>}
        </div>
        <div className="countdown-divider">:</div>
        <div className="countdown-box countdown-box-sec">
          <div className="countdown-num">{pad(timeLeft.seconds)}</div>
          {showLabels && <div className="countdown-unit">SECS</div>}
        </div>
      </div>
    </div>
  );
}
