import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import type { AnalysisResult } from "@/lib/embrapa";

const STORAGE_KEY = "@solo_cerrado_analyses";

interface AnalysisContextValue {
  analyses: AnalysisResult[];
  saveAnalysis: (result: Omit<AnalysisResult, "id" | "date">) => Promise<AnalysisResult>;
  deleteAnalysis: (id: string) => Promise<void>;
  loading: boolean;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) setAnalyses(JSON.parse(json));
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback(async (next: AnalysisResult[]) => {
    setAnalyses(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const saveAnalysis = useCallback(
    async (result: Omit<AnalysisResult, "id" | "date">) => {
      const full: AnalysisResult = {
        ...result,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
      };
      await persist([full, ...analyses]);
      return full;
    },
    [analyses, persist]
  );

  const deleteAnalysis = useCallback(
    async (id: string) => {
      await persist(analyses.filter((a) => a.id !== id));
    },
    [analyses, persist]
  );

  return (
    <AnalysisContext.Provider value={{ analyses, saveAnalysis, deleteAnalysis, loading }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be inside AnalysisProvider");
  return ctx;
}
