export const idlFactory = ({ IDL }: any) => {
  const Time = IDL.Int;

  const GProposal = IDL.Record({
    id: IDL.Nat,
    title: IDL.Text,
    description: IDL.Text,
    category: IDL.Text,
    proposer: IDL.Principal,
    createdAt: Time,
    votesYes: IDL.Nat,
    votesNo: IDL.Nat,
    isActive: IDL.Bool,
  });

  const GVoteRecord = IDL.Record({
    proposalId: IDL.Nat,
    choice: IDL.Bool,
    weight: IDL.Nat,
  });

  const GStakerLeaderboardEntry = IDL.Record({
    principal: IDL.Principal,
    stake: IDL.Nat,
    weight: IDL.Nat,
    topBiome: IDL.Text,
    maxMods: IDL.Nat,
    unclaimedRewards: IDL.Nat,
  });

  const GStakeInfo = IDL.Record({
    stake: IDL.Nat,
    lockEndsAt: Time,
    weight: IDL.Nat,
    unclaimedRewards: IDL.Nat,
    claimableVest: IDL.Nat,
    pendingVest: IDL.Nat,
  });

  const GStakeResult = IDL.Variant({
    success: IDL.Record({ newStake: IDL.Nat }),
    insufficientTokens: IDL.Record({ required: IDL.Nat, available: IDL.Nat }),
    transferFailed: IDL.Text,
  });

  const GVoteResult = IDL.Variant({
    success: IDL.Record({ weight: IDL.Nat }),
    proposalNotFound: IDL.Null,
    proposalNotActive: IDL.Null,
    alreadyVoted: IDL.Null,
    notStaker: IDL.Null,
  });

  return IDL.Service({
    // Staking
    gStakeTokens: IDL.Func([IDL.Nat], [GStakeResult], []),
    gUnstakeTokens: IDL.Func([IDL.Nat], [], []),
    gClaimVestedRewards: IDL.Func([], [IDL.Nat], []),
    gGetMyStakeInfo: IDL.Func([], [GStakeInfo], ["query"]),
    gGetStakedBalance: IDL.Func([IDL.Principal], [IDL.Nat], ["query"]),
    gGetTotalWeightedStake: IDL.Func([], [IDL.Nat], ["query"]),
    // Income
    gReceiveIncome: IDL.Func([IDL.Nat], [], []),
    gGetTreasuryBalance: IDL.Func([], [IDL.Nat], ["query"]),
    gGetDeveloperFund: IDL.Func([], [IDL.Nat], ["query"]),
    // Proposals
    gCreateProposal: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
    gVote: IDL.Func([IDL.Nat, IDL.Bool], [GVoteResult], []),
    gGetAllProposals: IDL.Func([], [IDL.Vec(GProposal)], ["query"]),
    gGetActiveProposals: IDL.Func([], [IDL.Vec(GProposal)], ["query"]),
    gGetMyVotes: IDL.Func([], [IDL.Vec(GVoteRecord)], ["query"]),
    // Leaderboard
    gGetLeaderboard: IDL.Func(
      [IDL.Nat],
      [IDL.Vec(GStakerLeaderboardEntry)],
      ["query"],
    ),
    gCalcWeight: IDL.Func([IDL.Principal], [IDL.Nat], ["query"]),
    // Admin
    gAdminCloseProposal: IDL.Func([IDL.Nat], [], []),
    gAdminWithdrawTreasury: IDL.Func([IDL.Nat], [], []),
  });
};
