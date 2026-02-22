import { useState, useCallback, useEffect } from 'react';
import { listGroups } from '../../../shared/api/groups';
import type { ChatGroup } from '../../../shared/api/groups';

export function useGroupsList() {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGroups();
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { groups, loading, error, refetch };
}
