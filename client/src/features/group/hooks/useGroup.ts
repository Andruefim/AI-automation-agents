import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getGroup, updateGroupSettings } from '../../../shared/api/groups';
import type { ChatGroup } from '../../../shared/api/groups';

export function useGroup() {
  const { id } = useParams<{ id: string }>();
  const groupId = id ? parseInt(id, 10) : NaN;
  const [group, setGroup] = useState<ChatGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (Number.isNaN(groupId)) {
      setError('Invalid group id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getGroup(groupId);
      setGroup(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group');
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateSettings = useCallback(
    async (settings: Record<string, unknown>) => {
      if (Number.isNaN(groupId) || !group) return;
      const updated = await updateGroupSettings(groupId, settings);
      setGroup(updated);
    },
    [groupId, group],
  );

  return { group, loading, error, refetch, updateSettings };
}
