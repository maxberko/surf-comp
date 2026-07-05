import { useActiveTrip, useRealtime, useTodaySession } from '@/lib/queries';
import { useCrew } from '@/providers/CrewProvider';

/** Résout crew -> trip actif -> session du jour, et branche le realtime. */
export function useCrewRealtime() {
  const { crewId } = useCrew();
  const { data: trip } = useActiveTrip(crewId ?? undefined);
  const { data: session } = useTodaySession(trip?.id);
  useRealtime(trip?.id, session?.id);
}
