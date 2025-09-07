// Client-safe API helpers for Locations (no 'use server')

export interface State {
  id: number;
  name: string;
}

export interface LGA {
  id: number;
  name: string;
  state_id: number;
}

export async function getStates(): Promise<State[]> {
  try {
    const res = await fetch('/api/states', { cache: 'no-store' });
    if (!res.ok) {
      console.error('Failed to fetch states:', res.status, res.statusText);
      return [];
    }
    const result = await res.json();
    // Handle both paginated and direct array responses
    return result.data || result;
  } catch (error) {
    console.error('Error fetching states:', error);
    return [];
  }
}

export async function getLGAs(stateId: number): Promise<LGA[]> {
  try {
    const res = await fetch(`/api/states/${stateId}/lgas`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function initializeLocations(): Promise<{ message: string }> {
  const res = await fetch('/api/initialize-locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to initialize locations');
  }
  return res.json();
}
