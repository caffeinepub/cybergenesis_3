import type { LandData, ModifierInstance, Time, TopLandEntry } from "@/backend";
import { formatTokenBalance } from "@/lib/tokenUtils";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";
import { useMarketplaceActor } from "./useMarketplaceActor";
import { useTokenActor } from "./useTokenActor";

// Placeholder types for governance and marketplace (not yet in backend)
interface Proposal {
  id: bigint;
  title: string;
  description: string;
  proposer: Principal;
  createdAt: Time;
  votesYes: bigint;
  votesNo: bigint;
  isActive: boolean;
}

enum ItemType {
  Land = "Land",
  Modifier = "Modifier",
}

interface Listing {
  listingId: bigint;
  itemId: bigint;
  itemType: ItemType;
  seller: Principal;
  price: bigint;
  isActive: boolean;
}

type StakeResult =
  | {
      __kind__: "success";
      success: {
        newStake: bigint;
      };
    }
  | {
      __kind__: "insufficientTokens";
      insufficientTokens: {
        required: bigint;
        available: bigint;
      };
    }
  | {
      __kind__: "transferFailed";
      transferFailed: string;
    };

type VoteResult =
  | {
      __kind__: "success";
      success: {
        weight: bigint;
      };
    }
  | {
      __kind__: "proposalNotFound";
      proposalNotFound: null;
    }
  | {
      __kind__: "proposalNotActive";
      proposalNotActive: null;
    }
  | {
      __kind__: "alreadyVoted";
      alreadyVoted: null;
    }
  | {
      __kind__: "notStaker";
      notStaker: null;
    };

type BuyResult =
  | {
      __kind__: "success";
      success: {
        buyer: Principal;
        seller: Principal;
        price: bigint;
      };
    }
  | {
      __kind__: "listingNotFound";
      listingNotFound: null;
    }
  | {
      __kind__: "listingNotActive";
      listingNotActive: null;
    }
  | {
      __kind__: "insufficientFunds";
      insufficientFunds: {
        required: bigint;
        available: bigint;
      };
    }
  | {
      __kind__: "transferFailed";
      transferFailed: string;
    }
  | {
      __kind__: "cannotBuyOwnListing";
      cannotBuyOwnListing: null;
    };

// Land Data Query
export function useGetLandData() {
  const { actor, isFetching } = useActor();

  return useQuery<LandData[]>({
    queryKey: ["landData"],
    queryFn: async () => {
      if (!actor) return [];
      console.log("Fetching land data...");
      const result = await actor.getLandData();
      console.log("Land data fetched:", result);
      return result;
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Token Balance Query with Enhanced Retry
export function useGetTokenBalance() {
  const { actor: tokenActor, isFetching } = useTokenActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["tokenBalance", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!tokenActor || !identity) {
        console.log(
          "Token balance query skipped - actor or identity not available",
        );
        return BigInt(0);
      }

      const principal = identity.getPrincipal();
      console.log("Getting CBR balance for Principal:", principal.toString());

      try {
        const balance = await tokenActor.icrc1_balance_of({
          owner: principal,
          subaccount: [],
        });
        console.log(
          "CBR balance response:",
          balance,
          "Formatted:",
          formatTokenBalance(balance),
        );
        return balance;
      } catch (error: any) {
        console.error("CBR balance fetch error:", error);
        throw error;
      }
    },
    enabled: !!tokenActor && !!identity && !isFetching,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 10000,
  });
}

// Debug Token Balance Hook
export function useDebugTokenBalance() {
  const { actor: tokenActor } = useTokenActor();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async () => {
      if (!tokenActor || !identity) {
        throw new Error("Token actor or identity not available");
      }

      const principal = identity.getPrincipal();
      console.log(
        "\uD83D\uDD0D Debug: Fetching CBR balance for Principal:",
        principal.toString(),
      );

      const balance = await tokenActor.icrc1_balance_of({
        owner: principal,
        subaccount: [],
      });

      console.log("\uD83D\uDD0D Debug: Raw balance response:", balance);
      console.log(
        "\uD83D\uDD0D Debug: Formatted balance:",
        formatTokenBalance(balance),
      );

      return balance;
    },
    onSuccess: (balance) => {
      toast.success(`Balance updated: ${formatTokenBalance(balance)} CBR`);
    },
    onError: (error: any) => {
      console.error("\uD83D\uDD0D Debug: Balance fetch failed:", error);
      toast.error(`Balance fetch error: ${error.message || "Unknown error"}`);
    },
  });
}

// Canister Token Balance Query (Admin Only)
export function useGetCanisterTokenBalance() {
  const { actor: tokenActor } = useTokenActor();

  return useQuery({
    queryKey: ["canisterTokenBalance"],
    queryFn: async () => {
      if (!tokenActor) {
        console.log(
          "Canister balance query skipped - token actor not available",
        );
        return BigInt(0);
      }

      console.log("Getting canister token balance...");

      try {
        const balance = await tokenActor.getCanisterTokenBalance();
        console.log(
          "Canister token balance response:",
          balance,
          "Formatted:",
          formatTokenBalance(balance),
        );
        return balance;
      } catch (error: any) {
        console.error("Canister balance fetch error:", error);
        throw error;
      }
    },
    enabled: !!tokenActor,
    retry: 2,
    retryDelay: 2000,
  });
}

// Debug Canister Balance Hook (Admin Only)
export function useDebugCanisterBalance() {
  const { actor: tokenActor } = useTokenActor();

  return useMutation({
    mutationFn: async () => {
      if (!tokenActor) {
        throw new Error("Token actor not available");
      }

      console.log("\uD83D\uDD0D Debug: Fetching canister token balance...");

      const balance = await tokenActor.getCanisterTokenBalance();

      console.log(
        "\uD83D\uDD0D Debug: Raw canister balance response:",
        balance,
      );
      console.log(
        "\uD83D\uDD0D Debug: Formatted canister balance:",
        formatTokenBalance(balance),
      );

      return balance;
    },
    onSuccess: (balance) => {
      toast.success(`Contract balance: ${formatTokenBalance(balance)} CBR`);
    },
    onError: (error: any) => {
      console.error(
        "\uD83D\uDD0D Debug: Canister balance fetch failed:",
        error,
      );
      toast.error(
        `Contract balance error: ${error.message || "Unknown error"}`,
      );
    },
  });
}

// Claim Rewards Mutation
export function useClaimRewards() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (landId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      console.log("Claiming rewards for land:", landId);
      const result = await actor.claimRewards(landId);
      console.log("Claim result:", result);
      return result;
    },
    onSuccess: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      queryClient.invalidateQueries({ queryKey: ["landData"] });
      queryClient.invalidateQueries({ queryKey: ["tokenBalance"] });
      toast.success("Rewards claimed!");
    },
    onError: (error: any) => {
      console.error("Claim rewards error:", error);
      toast.error(`Claim error: ${error.message || "Unknown error"}`);
    },
  });
}

// Upgrade Plot Mutation
export function useUpgradePlot() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ landId, cost }: { landId: bigint; cost: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      console.log("Upgrading plot:", landId, "Cost:", cost);
      const result = await actor.upgradePlot(landId, cost);
      console.log("Upgrade result:", result);
      return result;
    },
    onSuccess: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      queryClient.invalidateQueries({ queryKey: ["landData"] });
      queryClient.invalidateQueries({ queryKey: ["tokenBalance"] });
      toast.success("Plot upgraded!");
    },
    onError: (error: any) => {
      console.error("Upgrade plot error:", error);
      toast.error(`Upgrade error: ${error.message || "Unknown error"}`);
    },
  });
}

// Get Modifier Inventory Query
export function useGetModifierInventory() {
  const { actor, isFetching } = useActor();

  return useQuery<ModifierInstance[]>({
    queryKey: ["modifierInventory"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await (actor as any).getMyModifierInventory();
      return result ?? [];
    },
    enabled: !!actor && !isFetching,
    retry: 2,
  });
}

// Apply Modifier Mutation
export function useApplyModifier() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      modifierInstanceId,
      landId,
    }: { modifierInstanceId: bigint; landId: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      console.log("Applying modifier:", modifierInstanceId, "to land:", landId);
      await actor.applyModifier(modifierInstanceId, landId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landData"] });
      queryClient.invalidateQueries({ queryKey: ["modifierInventory"] });
      // PATH B: reactive update — installed mods change land state visible in marketplace
      queryClient.invalidateQueries({ queryKey: ["activeListings"] });
      queryClient.invalidateQueries({ queryKey: ["publicLandDataBatch"] });
      toast.success("Modifier applied!");
    },
    onError: (error: any) => {
      console.error("Apply modifier error:", error);
      toast.error(`Modifier apply error: ${error.message || "Unknown error"}`);
    },
  });
}

// Remove Modifier Mutation
export function useRemoveModifier() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      landId,
      modifierInstanceId,
    }: { landId: bigint; modifierInstanceId: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      console.log(
        "Removing modifier:",
        modifierInstanceId,
        "from land:",
        landId,
      );
      await actor.removeModifier(landId, modifierInstanceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landData"] });
      queryClient.invalidateQueries({ queryKey: ["modifierInventory"] });
      // PATH B: reactive update — removing a mod instantly updates marketplace listings
      queryClient.invalidateQueries({ queryKey: ["activeListings"] });
      queryClient.invalidateQueries({ queryKey: ["publicLandDataBatch"] });
      toast.success("Modifier removed from land!");
    },
    onError: (error: any) => {
      console.error("Remove modifier error:", error);
      toast.error(`Modifier remove error: ${error.message || "Unknown error"}`);
    },
  });
}

// Mint Land Mutation
export function useMintLand() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      console.log("Minting new land...");
      const result = await actor.mintLand();
      console.log("Mint result:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landData"] });
      toast.success("New land created!");
    },
    onError: (error: any) => {
      console.error("Mint land error:", error);
      toast.error(`Land creation error: ${error.message || "Unknown error"}`);
    },
  });
}

// Get Top Lands Query
export function useGetTopLands() {
  const { actor, isFetching } = useActor();

  return useQuery<TopLandEntry[]>({
    queryKey: ["topLands"],
    queryFn: async () => {
      if (!actor) return [];
      console.log("Fetching top lands...");
      const result = await actor.getTopLands(BigInt(25));
      console.log("Top lands fetched:", result);
      return result;
    },
    enabled: !!actor && !isFetching,
    retry: 2,
  });
}

// Governance Hooks (placeholder implementations - need backend integration)
export function useGetStakedBalance() {
  return useQuery({
    queryKey: ["stakedBalance"],
    queryFn: async () => BigInt(0),
    enabled: false,
  });
}

export function useStakeTokens() {
  const queryClient = useQueryClient();

  return useMutation<StakeResult, Error, bigint>({
    mutationFn: async (amount: bigint) => {
      console.log("Staking tokens:", amount);
      throw new Error("Governance staking not yet implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakedBalance"] });
      toast.success("Tokens staked!");
    },
    onError: (error: any) => {
      console.error("Stake tokens error:", error);
      toast.error(`Staking error: ${error.message || "Unknown error"}`);
    },
  });
}

export function useGetAllActiveProposals() {
  return useQuery<Proposal[]>({
    queryKey: ["activeProposals"],
    queryFn: async () => {
      console.log("Fetching active proposals...");
      return [];
    },
    enabled: false,
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
    }: { title: string; description: string }) => {
      console.log("Creating proposal:", title, description);
      throw new Error("Governance proposal creation not yet implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeProposals"] });
      toast.success("Proposal created!");
    },
    onError: (error: any) => {
      console.error("Create proposal error:", error);
      toast.error(
        `Proposal creation error: ${error.message || "Unknown error"}`,
      );
    },
  });
}

export function useVote() {
  const queryClient = useQueryClient();

  return useMutation<
    VoteResult,
    Error,
    { proposalId: bigint; choice: boolean }
  >({
    mutationFn: async ({
      proposalId,
      choice,
    }: { proposalId: bigint; choice: boolean }) => {
      console.log("Voting on proposal:", proposalId, choice);
      throw new Error("Governance voting not yet implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeProposals"] });
      toast.success("Vote recorded!");
    },
    onError: (error: any) => {
      console.error("Vote error:", error);
      toast.error(`Vote error: ${error.message || "Unknown error"}`);
    },
  });
}

// ─── Marketplace Hooks — wired to live marketplaceActor ───────────────────────

export function useGetAllActiveListings() {
  const { actor: marketplaceActor, isFetching: mpFetching } =
    useMarketplaceActor();

  return useQuery<Listing[]>({
    queryKey: ["activeListings"],
    queryFn: async () => {
      if (!marketplaceActor) {
        console.log("[Marketplace] Actor not ready, returning empty listings");
        return [];
      }
      console.log("[Marketplace] Fetching active listings...");
      const result = await marketplaceActor.getAllActiveListings();
      console.log("[Marketplace] Listings fetched:", result.length);
      return result as Listing[];
    },
    enabled: !!marketplaceActor && !mpFetching,
    // PATH B: poll every 30s + refetch on focus for near-instant reactive updates
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 2000,
  });
}

export function useListItem() {
  const { actor: marketplaceActor } = useMarketplaceActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      itemType,
      price,
    }: { itemId: bigint; itemType: ItemType; price: bigint }) => {
      if (!marketplaceActor) throw new Error("Marketplace actor not available");
      console.log("[Marketplace] Listing item:", itemId, itemType, price);
      const listingId = await marketplaceActor.list_item(
        itemId,
        itemType as any,
        price,
      );
      return listingId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeListings"] });
      queryClient.invalidateQueries({ queryKey: ["publicLandDataBatch"] });
      toast.success("Item listed for sale!");
    },
    onError: (error: any) => {
      console.error("List item error:", error);
      toast.error(`Listing failed: ${error.message || "Unknown error"}`);
    },
  });
}

export function useBuyItem() {
  const { actor: marketplaceActor } = useMarketplaceActor();
  const queryClient = useQueryClient();

  return useMutation<BuyResult, Error, bigint>({
    mutationFn: async (listingId: bigint) => {
      if (!marketplaceActor) throw new Error("Marketplace actor not available");
      console.log("[Marketplace] Buying listing:", listingId);
      const result = await marketplaceActor.buy_item(listingId);
      return result as BuyResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeListings"] });
      queryClient.invalidateQueries({ queryKey: ["landData"] });
      queryClient.invalidateQueries({ queryKey: ["modifierInventory"] });
      queryClient.invalidateQueries({ queryKey: ["tokenBalance"] });
      queryClient.invalidateQueries({ queryKey: ["publicLandDataBatch"] });
      toast.success("Purchase successful!");
    },
    onError: (error: any) => {
      console.error("Buy item error:", error);
      toast.error(`Purchase failed: ${error.message || "Unknown error"}`);
    },
  });
}

export function useCancelListing() {
  const { actor: marketplaceActor } = useMarketplaceActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: bigint) => {
      if (!marketplaceActor) throw new Error("Marketplace actor not available");
      console.log("[Marketplace] Cancelling listing:", listingId);
      await marketplaceActor.cancelListing(listingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeListings"] });
      queryClient.invalidateQueries({ queryKey: ["publicLandDataBatch"] });
      toast.success("Listing cancelled.");
    },
    onError: (error: any) => {
      console.error("Cancel listing error:", error);
      toast.error(`Cancel failed: ${error.message || "Unknown error"}`);
    },
  });
}

// PATH B: Batch-fetch live land data by IDs — used by Marketplace for reactive
// card/inspector updates. When useRemoveModifier fires, it invalidates
// ["publicLandDataBatch"] and this query re-fetches, giving instant UI update.
export function useGetPublicLandDataBatch(landIds: bigint[]) {
  const { actor } = useActor();
  // Stable key based on sorted land IDs
  const key = [...landIds]
    .sort()
    .map((id) => id.toString())
    .join(",");

  return useQuery<Map<string, LandData>>({
    queryKey: ["publicLandDataBatch", key],
    queryFn: async () => {
      if (!actor || landIds.length === 0) return new Map();
      console.log("[PublicLandBatch] Fetching", landIds.length, "lands by ID");
      const results = await Promise.all(
        landIds.map((id) => (actor as any).getLandDataById(id)),
      );
      const map = new Map<string, LandData>();
      landIds.forEach((id, idx) => {
        const res = results[idx];
        // Motoko ?LandData returned as Option<LandData> with __kind__
        if (res && res.__kind__ === "Some") {
          map.set(id.toString(), res.value as LandData);
        }
      });
      console.log("[PublicLandBatch] Loaded", map.size, "land records");
      return map;
    },
    enabled: !!actor && landIds.length > 0,
    staleTime: 15000, // 15s cache — fresh enough for marketplace
    retry: 1,
  });
}

// Export ItemType for use in components
export { ItemType };
