import type { Principal } from "@icp-sdk/core/principal";
import type { Time } from "./backend";

export interface GStakeEntry {
  amount: bigint;
  stakedAt: Time;
  rewardCheckpoint: bigint;
}

export interface GProposal {
  id: bigint;
  title: string;
  description: string;
  category: string;
  proposer: Principal;
  createdAt: Time;
  votesYes: bigint;
  votesNo: bigint;
  isActive: boolean;
}

export interface GVoteRecord {
  proposalId: bigint;
  choice: boolean;
  weight: bigint;
}

export interface GVestingEntry {
  amount: bigint;
  startTime: Time;
  claimed: bigint;
}

export interface GStakerLeaderboardEntry {
  principal: Principal;
  stake: bigint;
  weight: bigint;
  topBiome: string;
  maxMods: bigint;
  unclaimedRewards: bigint;
}

export interface GStakeInfo {
  stake: bigint;
  lockEndsAt: Time;
  weight: bigint;
  unclaimedRewards: bigint;
  claimableVest: bigint;
  pendingVest: bigint;
}

export type GStakeResult =
  | { __kind__: "success"; success: { newStake: bigint } }
  | {
      __kind__: "insufficientTokens";
      insufficientTokens: { required: bigint; available: bigint };
    }
  | { __kind__: "transferFailed"; transferFailed: string };

export type GVoteResult =
  | { __kind__: "success"; success: { weight: bigint } }
  | { __kind__: "proposalNotFound"; proposalNotFound: null }
  | { __kind__: "proposalNotActive"; proposalNotActive: null }
  | { __kind__: "alreadyVoted"; alreadyVoted: null }
  | { __kind__: "notStaker"; notStaker: null };

export interface governanceBackendInterface {
  // Staking
  gStakeTokens(amount: bigint): Promise<GStakeResult>;
  gUnstakeTokens(amount: bigint): Promise<void>;
  gClaimVestedRewards(): Promise<bigint>;
  gGetMyStakeInfo(): Promise<GStakeInfo>;
  gGetStakedBalance(p: Principal): Promise<bigint>;
  gGetTotalWeightedStake(): Promise<bigint>;
  // Income
  gReceiveIncome(amount: bigint): Promise<void>;
  gGetTreasuryBalance(): Promise<bigint>;
  gGetDeveloperFund(): Promise<bigint>;
  // Proposals
  gCreateProposal(
    title: string,
    description: string,
    category: string,
  ): Promise<bigint>;
  gVote(proposalId: bigint, choice: boolean): Promise<GVoteResult>;
  gGetAllProposals(): Promise<Array<GProposal>>;
  gGetActiveProposals(): Promise<Array<GProposal>>;
  gGetMyVotes(): Promise<Array<GVoteRecord>>;
  // Leaderboard
  gGetLeaderboard(limit: bigint): Promise<Array<GStakerLeaderboardEntry>>;
  gCalcWeight(p: Principal): Promise<bigint>;
  // Admin
  gAdminCloseProposal(proposalId: bigint): Promise<void>;
  gAdminWithdrawTreasury(amount: bigint): Promise<void>;
}

// Re-export old names for backward compatibility
export type {
  GProposal as Proposal,
  GVoteRecord as Vote,
  GStakeResult as StakeResult,
  GVoteResult as VoteResult,
};
