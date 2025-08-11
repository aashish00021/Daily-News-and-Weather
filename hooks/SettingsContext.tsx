import React, { createContext, useContext, useState } from "react";

export type TemperatureUnit = "metric" | "imperial";
export type NewsCategory = "business" | "entertainment" | "health" | "technology";

type SettingsContextValue = {
  unit: TemperatureUnit;
  setUnit: (u: TemperatureUnit) => void;
  categories: NewsCategory[];
  toggleCategory: (c: NewsCategory) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnit] = useState<TemperatureUnit>("imperial");
  const [categories, setCategories] = useState<NewsCategory[]>([]);

  const toggleCategory = (category: NewsCategory) => {
    setCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <SettingsContext.Provider value={{ unit, setUnit, categories, toggleCategory }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}