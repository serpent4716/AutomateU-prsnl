// ThemeContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Function to check the user's system preference
const getSystemTheme = () => 
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const ThemeProvider = ({ children }) => {
  // 1. STATE INITIALIZATION: Read the user's saved preference first.
  const [preference, setPreference] = useState(
    localStorage.getItem('theme-preference') || 'light' // Save the preference (light/dark/system)
  );

  // 2. ACTUAL THEME: Calculate the effective theme based on preference.
  const [effectiveTheme, setEffectiveTheme] = useState(
    preference === 'system' ? getSystemTheme() : preference
  );

  // --- Core Logic: Function to update the preference and save to local storage ---
  const updateTheme = (newPreference) => {
    // 3. Update the preference state
    setPreference(newPreference);
    
    // 4. Save the new preference to local storage for persistence
    localStorage.setItem('theme-preference', newPreference);
  };


  // --- EFFECT 1: Recalculate effectiveTheme whenever preference or system changes ---
  useEffect(() => {
    // If the preference is 'system', listen for system changes
    if (preference === 'system') {
      const systemTheme = getSystemTheme();
      setEffectiveTheme(systemTheme);

      // Listener for real-time system change (e.g., user changes OS theme while app is open)
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e) => setEffectiveTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', listener);
      
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      // If preference is 'light' or 'dark', set the effective theme directly
      setEffectiveTheme(preference);
    }
  }, [preference]); // Dependency on preference

  
  // --- EFFECT 2: Apply the 'dark' class to the <html> element whenever effectiveTheme changes ---
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove existing classes
    root.classList.remove('light', 'dark');
    
    // Apply the current effective theme class
    root.classList.add(effectiveTheme);
    
  }, [effectiveTheme]); // Dependency on effectiveTheme

  
  // --- The Provider Value (What you consume in Settings.jsx) ---
  return (
    <ThemeContext.Provider value={{ preference, updateTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};