export function useActorReinitializer() {
  return {
    isReinitializing: false,
    attempt: 0,
    currentGateway: "https://ic0.app",
  };
}
