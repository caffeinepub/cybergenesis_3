import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["callerUserProfile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getCallerUserProfile();
        if (result && "__kind__" in result && result.__kind__ === "Some")
          return result.value;
        return null;
      } catch {
        return null;
      }
    },
    enabled: !!actor,
  });
}

export function useGetLandData() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["landData"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (actor as any).getLandData();
      } catch {
        return [];
      }
    },
    enabled: !!actor,
  });
}
