import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useMyCrews } from '@/lib/queries';
import type { Crew } from '@/lib/types';

const STORAGE_KEY = 'poypoyo.activeCrewId';

type CrewState = {
  crews: Crew[];
  crew: Crew | null;
  crewId: string | null;
  loading: boolean;
  setCrewId: (id: string) => void;
};

const CrewContext = createContext<CrewState | undefined>(undefined);

export function CrewProvider({ children }: { children: ReactNode }) {
  const { data: crews = [], isLoading } = useMyCrews();
  const [crewId, setCrewIdState] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((id) => {
      setCrewIdState(id);
      setRestored(true);
    });
  }, []);

  // Sélectionne automatiquement le premier crew si aucun choix mémorisé/valide.
  useEffect(() => {
    if (!restored || crews.length === 0) return;
    const stillValid = crewId && crews.some((c: Crew) => c.id === crewId);
    if (!stillValid) {
      setCrewIdState(crews[0].id);
    }
  }, [restored, crews, crewId]);

  const setCrewId = (id: string) => {
    setCrewIdState(id);
    AsyncStorage.setItem(STORAGE_KEY, id);
  };

  const crew = useMemo(() => crews.find((c: Crew) => c.id === crewId) ?? null, [crews, crewId]);

  const value = useMemo<CrewState>(
    () => ({ crews, crew, crewId: crew?.id ?? null, loading: isLoading || !restored, setCrewId }),
    [crews, crew, isLoading, restored]
  );

  return <CrewContext.Provider value={value}>{children}</CrewContext.Provider>;
}

export function useCrew(): CrewState {
  const ctx = useContext(CrewContext);
  if (!ctx) throw new Error('useCrew doit être utilisé dans <CrewProvider>');
  return ctx;
}
