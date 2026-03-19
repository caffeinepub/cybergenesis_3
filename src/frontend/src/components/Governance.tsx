import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Coins,
  FileText,
  Info,
  Loader2,
  ThumbsDown,
  ThumbsUp,
  Vote,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateProposal,
  useGetAllActiveProposals,
  useGetStakedBalance,
  useGetTokenBalance,
  useStakeTokens,
  useVote,
} from "../hooks/useQueries";

export default function Governance() {
  const { data: stakedBalance, isLoading: stakingLoading } =
    useGetStakedBalance();
  const { data: tokenBalance } = useGetTokenBalance();
  const { data: proposals, isLoading: proposalsLoading } =
    useGetAllActiveProposals();
  const stakeTokensMutation = useStakeTokens();
  const createProposalMutation = useCreateProposal();
  const voteMutation = useVote();

  const [stakeAmount, setStakeAmount] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [votingProposalId, setVotingProposalId] = useState<bigint | null>(null);

  const handleStake = async () => {
    const amount = Number.parseFloat(stakeAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }
    try {
      const amountInSmallestUnit = BigInt(Math.floor(amount * 100000000));
      const result =
        await stakeTokensMutation.mutateAsync(amountInSmallestUnit);
      if (result.__kind__ === "success") {
        toast.success("Tokens staked successfully!", {
          description: `New stake: ${Number(result.success.newStake) / 100000000} CBR`,
        });
        setStakeAmount("");
      } else if (result.__kind__ === "insufficientTokens") {
        toast.error("Insufficient tokens", {
          description: `Required: ${Number(result.insufficientTokens.required) / 100000000} CBR`,
        });
      } else if (result.__kind__ === "transferFailed") {
        toast.error("Transfer failed", {
          description: result.transferFailed,
        });
      }
    } catch (error) {
      toast.error("Failed to stake tokens", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleCreateProposal = async () => {
    if (!proposalTitle.trim() || !proposalDescription.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (proposalTitle.length > 100) {
      toast.error("Title must be 100 characters or less");
      return;
    }
    if (proposalDescription.length > 1000) {
      toast.error("Description must be 1000 characters or less");
      return;
    }
    try {
      const proposalId = await createProposalMutation.mutateAsync({
        title: proposalTitle,
        description: proposalDescription,
      });
      toast.success("Proposal created successfully!", {
        description: `Proposal ID: ${proposalId}`,
      });
      setProposalTitle("");
      setProposalDescription("");
    } catch (error) {
      toast.error("Failed to create proposal", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleVote = async (proposalId: bigint, choice: boolean) => {
    setVotingProposalId(proposalId);
    try {
      const result = await voteMutation.mutateAsync({ proposalId, choice });
      if (result.__kind__ === "success") {
        toast.success("Vote recorded!", {
          description: `Vote weight: ${Number(result.success.weight) / 100000000} CBR`,
        });
      } else if (result.__kind__ === "proposalNotFound") {
        toast.error("Proposal not found");
      } else if (result.__kind__ === "proposalNotActive") {
        toast.error("Proposal is no longer active");
      } else if (result.__kind__ === "alreadyVoted") {
        toast.error("You have already voted on this proposal");
      } else if (result.__kind__ === "notStaker") {
        toast.error("You must stake tokens to vote");
      }
    } catch (error) {
      toast.error("Failed to vote", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setVotingProposalId(null);
    }
  };

  const calculateVotePercentage = (
    yesVotes: bigint,
    noVotes: bigint,
  ): { yes: number; no: number } => {
    const total = Number(yesVotes) + Number(noVotes);
    if (total === 0) return { yes: 0, no: 0 };
    return {
      yes: (Number(yesVotes) / total) * 100,
      no: (Number(noVotes) / total) * 100,
    };
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-orbitron text-3xl font-bold text-glow-teal">
          GOVERNANCE
        </h2>
        <p className="font-jetbrains text-muted-foreground">
          Stake tokens and participate in project governance decisions
        </p>
      </div>

      <Tabs defaultValue="stake" className="w-full">
        <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 glassmorphism">
          <TabsTrigger value="stake" className="font-orbitron">
            <Coins className="mr-2 h-4 w-4" />
            Staking
          </TabsTrigger>
          <TabsTrigger value="proposals" className="font-orbitron">
            <Vote className="mr-2 h-4 w-4" />
            Proposals
          </TabsTrigger>
          <TabsTrigger value="create" className="font-orbitron">
            <FileText className="mr-2 h-4 w-4" />
            Create
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stake" className="mt-6">
          <Card className="glassmorphism border-primary/20 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="font-orbitron text-xl text-glow-teal">
                CBR Token Staking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="glassmorphism p-4 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p className="font-jetbrains text-sm text-muted-foreground">
                    Stake your CBR tokens to gain voting rights on governance
                    proposals. Your vote weight is proportional to your staked
                    amount.
                  </p>
                </div>
              </div>
              <div className="space-y-4 font-jetbrains">
                <div className="flex justify-between p-4 glassmorphism rounded-lg">
                  <span className="text-muted-foreground">Current stake:</span>
                  <span className="text-xl font-bold text-glow-yellow">
                    {stakingLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    ) : (
                      `${Number(stakedBalance || 0n) / 100000000} CBR`
                    )}
                  </span>
                </div>
                <div className="flex justify-between p-4 glassmorphism rounded-lg">
                  <span className="text-muted-foreground">
                    Available balance:
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {Number(tokenBalance || 0n) / 100000000} CBR
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="staking-amount"
                    className="font-jetbrains text-sm text-muted-foreground mb-2 block"
                  >
                    Amount to stake (CBR)
                  </label>
                  <Input
                    id="staking-amount"
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.00"
                    className="font-jetbrains"
                    min="0"
                    step="0.01"
                  />
                </div>
                <Button
                  onClick={handleStake}
                  disabled={stakeTokensMutation.isPending || !stakeAmount}
                  className="w-full font-orbitron bg-primary hover:bg-primary/80 box-glow-teal"
                >
                  {stakeTokensMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Staking...
                    </>
                  ) : (
                    <>
                      <Coins className="mr-2 h-4 w-4" />
                      STAKE TOKENS
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals" className="mt-6">
          {proposalsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !proposals || proposals.length === 0 ? (
            <Card className="glassmorphism border-primary/20">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Vote className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-orbitron text-xl text-glow-teal mb-2">
                      No active proposals
                    </h3>
                    <p className="font-jetbrains text-muted-foreground">
                      Be the first to create a proposal
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => {
                const percentages = calculateVotePercentage(
                  proposal.votesYes,
                  proposal.votesNo,
                );
                const totalVotes =
                  Number(proposal.votesYes) + Number(proposal.votesNo);
                return (
                  <Card
                    key={Number(proposal.id)}
                    className="glassmorphism border-primary/20 hover:border-primary/40 transition-all"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="font-orbitron text-lg text-glow-teal">
                          {proposal.title}
                        </CardTitle>
                        <span className="text-xs font-jetbrains text-muted-foreground whitespace-nowrap">
                          ID: {Number(proposal.id)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="font-jetbrains text-sm text-muted-foreground">
                        {proposal.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-jetbrains text-muted-foreground">
                          <span>
                            Total votes: {(totalVotes / 100000000).toFixed(2)}{" "}
                            CBR
                          </span>
                          <span>
                            {percentages.yes.toFixed(1)}% FOR /{" "}
                            {percentages.no.toFixed(1)}% AGAINST
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 font-jetbrains text-sm">
                          <div className="p-3 glassmorphism rounded-lg border border-green-500/20 box-glow-green">
                            <div className="text-green-400 font-bold">
                              FOR:{" "}
                              {(Number(proposal.votesYes) / 100000000).toFixed(
                                2,
                              )}
                            </div>
                          </div>
                          <div className="p-3 glassmorphism rounded-lg border border-red-500/20">
                            <div className="text-red-400 font-bold">
                              AGAINST:{" "}
                              {(Number(proposal.votesNo) / 100000000).toFixed(
                                2,
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleVote(proposal.id, true)}
                          disabled={votingProposalId === proposal.id}
                          className="flex-1 font-orbitron bg-green-600 hover:bg-green-700 box-glow-green"
                        >
                          {votingProposalId === proposal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ThumbsUp className="mr-2 h-4 w-4" />
                              FOR
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleVote(proposal.id, false)}
                          disabled={votingProposalId === proposal.id}
                          className="flex-1 font-orbitron bg-red-600 hover:bg-red-700"
                        >
                          {votingProposalId === proposal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ThumbsDown className="mr-2 h-4 w-4" />
                              AGAINST
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <Card className="glassmorphism border-primary/20 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="font-orbitron text-xl text-glow-teal">
                Create Proposal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="glassmorphism p-4 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p className="font-jetbrains text-sm text-muted-foreground">
                    You must have staked tokens to create proposals. Proposals
                    allow the community to vote on important project decisions.
                  </p>
                </div>
              </div>
              <div>
                <label
                  htmlFor="proposal-title"
                  className="font-jetbrains text-sm text-muted-foreground mb-2 block"
                >
                  Title (max 100 characters)
                </label>
                <Input
                  id="proposal-title"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  placeholder="Enter proposal title"
                  className="font-jetbrains"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1 font-jetbrains">
                  {proposalTitle.length}/100
                </p>
              </div>
              <div>
                <label
                  htmlFor="proposal-description"
                  className="font-jetbrains text-sm text-muted-foreground mb-2 block"
                >
                  Description (max 1000 characters)
                </label>
                <Textarea
                  id="proposal-description"
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                  placeholder="Describe your proposal in detail"
                  className="font-jetbrains min-h-[150px]"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1 font-jetbrains">
                  {proposalDescription.length}/1000
                </p>
              </div>
              <Button
                onClick={handleCreateProposal}
                disabled={
                  createProposalMutation.isPending ||
                  !proposalTitle.trim() ||
                  !proposalDescription.trim()
                }
                className="w-full font-orbitron bg-primary hover:bg-primary/80 box-glow-teal"
              >
                {createProposalMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    CREATE PROPOSAL
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
