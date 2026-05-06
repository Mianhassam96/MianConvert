import { useState, useEffect } from "react";
import { sessionStore, SessionState } from "@/lib/session-store";

export const useSession = (): SessionState => {
  const [state, setState] = useState<SessionState>(() => sessionStore.get());
  useEffect(() => {
    const unsub = sessionStore.subscribe(() => setState(sessionStore.get()));
    return unsub;
  }, []);
  return state;
};
