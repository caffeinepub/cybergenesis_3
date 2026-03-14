import { useEffect, useState } from "react";
import { useActor } from "./useActor";

export function useActorWithInit() {
  const { actor, isFetching } = useActor();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isFetching && !actor) {
      setError(null);
    }
  }, [actor, isFetching]);

  return {
    isInitialized: !!actor,
    isInitializing: isFetching,
    error,
  };
}
