import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FeatureFlags {
  enableCharts: boolean;
}

interface FeatureFlagContextType {
  _flags: FeatureFlags;
  toggleFlag: (_flag: keyof FeatureFlags) => void;
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
  const [_flags, setFlags] = useState<FeatureFlags>(() => {
    // Try to load _flags from localStorage
    const savedFlags = localStorage.getItem('featureFlags');
    return savedFlags ? JSON.parse(savedFlags) : defaultFlags;
  });

  // Save _flags to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('featureFlags', JSON.stringify(_flags));
  }, [_flags]);

  const toggleFlag = (_flag: keyof FeatureFlags) => {
    setFlags(prev => ({
      ...prev,
      [_flag]: !prev[_flag]
    }));
  };

  return (
    <FeatureFlagContext.Provider value={{ _flags, toggleFlag }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}
