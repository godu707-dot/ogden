import { createContext } from 'react';
import * as THREE from 'three';

export const ThreeContext = createContext<{ 
  THREE: typeof THREE | null;
}>({ THREE: null });

export const ThreeProvider = ({ children }: { children: React.ReactNode }) => {
  // Only initialize THREE on client-side
  const value = typeof window !== 'undefined' ? { THREE } : { THREE: null };
  
  return (
    <ThreeContext.Provider value={value}>
      {children}
    </ThreeContext.Provider>
  );
};