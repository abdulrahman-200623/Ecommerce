import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: false,
});

export const THEME_STORAGE_KEY = "techzone_theme";

/**
 * Checks if the current pathname belongs to admin or superadmin consoles.
 * Admin and superadmin areas MUST retain their independent dark cyber-tech styling.
 */
function isAdminRoute(pathname = window.location.pathname) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/superadmin")
  );
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      if (isAdminRoute()) return "light";
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === "dark" ? "dark" : "light";
    } catch (e) {
      return "light";
    }
  });

  // Apply theme to document root when on customer-facing routes
  const applyThemeToDOM = useCallback((currentTheme) => {
    const isCurrentAdmin = isAdminRoute();
    if (isCurrentAdmin) {
      // Do not leak customer theme into admin or superadmin
      document.documentElement.removeAttribute("data-theme");
      document.body.classList.remove("tz-dark-mode", "tz-light-mode");
      return;
    }

    document.documentElement.setAttribute("data-theme", currentTheme);
    if (currentTheme === "dark") {
      document.body.classList.add("tz-dark-mode");
      document.body.classList.remove("tz-light-mode");
    } else {
      document.body.classList.add("tz-light-mode");
      document.body.classList.remove("tz-dark-mode");
    }
  }, []);

  // Update theme state and persist to localStorage
  const setTheme = useCallback((newTheme) => {
    const validTheme = newTheme === "dark" ? "dark" : "light";
    setThemeState(validTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, validTheme);
    } catch (e) {
      console.warn("Unable to save theme to localStorage:", e);
    }
    applyThemeToDOM(validTheme);
  }, [applyThemeToDOM]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Sync with DOM on mount and route changes
  useEffect(() => {
    applyThemeToDOM(theme);

    // Watch for navigation changes (popstate or pushstate)
    const handleLocationChange = () => {
      applyThemeToDOM(theme);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [theme, applyThemeToDOM]);

  // Sync across tabs if user changes theme in another tab
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const next = e.newValue === "dark" ? "dark" : "light";
        setThemeState(next);
        applyThemeToDOM(next);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [applyThemeToDOM]);

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === "dark",
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;
