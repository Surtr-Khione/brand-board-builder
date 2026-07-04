import { useEffect, useState } from 'react';
import { subscribeAuth, getUser, getProfile } from '../lib/auth';

// Re-render on sign-in/out/credit changes
export function useAuth() {
  const [state, setState] = useState({ user: getUser(), profile: getProfile() });
  useEffect(() => subscribeAuth(setState), []);
  return state;
}
