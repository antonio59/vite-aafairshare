import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FeatureFlags {
  enableCharts: boolean;
}

interface FeatureFlagContextType {
  flags: FeatureFlags;
  toggleFlag: (flag: keyof FeatureFlags) => void;
}

const defaultFlags: FeatureFlags = {
  enableCharts: true,
};

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}

interface FeatureFlagProviderProps {
  children: ReactNode;
}

export function FeatureFlagProvider({ children }: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    // Try to load flags from localStorage
    const savedFlags = localStorage.getItem('featureFlags');
    return savedFlags ? JSON.parse(savedFlags) : defaultFlags;
  });

  // Save flags to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('featureFlags', JSON.stringify(flags));
  }, [flags]);

  const toggleFlag = (flag: keyof FeatureFlags) => {
    setFlags(prev => ({
      ...prev,
      [flag]: !prev[flag]
    }));
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, toggleFlag }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}
