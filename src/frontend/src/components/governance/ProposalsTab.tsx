import { useState } from "react";
import type { GProposal } from "../../governance-backend.d";
import {
  useGetAllActiveProposals,
  useGetMyVotes,
  useVote,
} from "../../hooks/useQueries";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  formatCBR,
  shortenPrincipal,
} from "./GovernanceTypes";

const PAGE_SIZE = 4;

interface ProposalsTabProps {
  onCreateClick: () => void;
}

function ProposalCard({ proposal }: { proposal: GProposal }) {
  const vote = useVote();
  const { data: myVotes = [] } = useGetMyVotes();
  const myVote = myVotes.find((v) => v.proposalId === proposal.id);
  const [localVoting, setLocalVoting] = useState(false);

  const total = proposal.votesYes + proposal.votesNo;
  const yesNum = Number(proposal.votesYes);
  const noNum = Number(proposal.votesNo);
  const totalNum = yesNum + noNum;
  const yesPct = totalNum > 0 ? Math.round((yesNum / totalNum) * 100) : 0;
  const noPct = totalNum > 0 ? 100 - yesPct : 0;

  const catColor = CATEGORY_COLORS[proposal.category] ?? "#00e5ff";
  const catLabel =
    CATEGORY_LABELS[proposal.category] ?? proposal.category.toUpperCase();

  const handleVote = async (choice: boolean) => {
    if (localVoting || myVote) return;
    setLocalVoting(true);
    await vote.mutateAsync({ proposalId: proposal.id, choice });
    setLocalVoting(false);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,3,30,0.85) 0%, rgba(5,0,20,0.92) 100%)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
        animation: "govCardIn 0.2s ease-out forwards",
      }}
      data-ocid="proposals.card"
    >
      <div className="p-5">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="font-orbitron text-[9px] font-bold tracking-[1.5px] px-2 py-0.5 rounded"
            style={{
              background: "rgba(255,160,0,0.15)",
              border: "1px solid rgba(255,160,0,0.5)",
              color: "#ffa000",
            }}
          >
            ADVISORY
          </span>
          <span
            className="font-orbitron text-[9px] font-bold tracking-[1.5px] px-2 py-0.5 rounded"
            style={{
              background: `${catColor}15`,
              border: `1px solid ${catColor}50`,
              color: catColor,
            }}
          >
            {catLabel}
          </span>
        </div>

        <h3 className="font-orbitron font-bold text-base text-white mb-1 leading-snug">
          {proposal.title}
        </h3>
        <p className="font-jetbrains text-[10px] text-white/30 mb-3">
          by {shortenPrincipal(proposal.proposer.toString())}
        </p>
        <p className="font-jetbrains text-xs text-white/50 leading-relaxed mb-4 line-clamp-3">
          {proposal.description}
        </p>

        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.06)",
            marginBottom: "12px",
          }}
        />

        {/* Vote bars */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-3">
            <span className="font-orbitron text-[10px] text-green-400 w-16">
              FOR
            </span>
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${yesPct}%`,
                  background: "linear-gradient(to right, #00ff60, transparent)",
                }}
              />
            </div>
            <span className="font-jetbrains text-[10px] text-white/40 w-10 text-right">
              {yesPct}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-orbitron text-[10px] text-red-400 w-16">
              AGAINST
            </span>
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${noPct}%`,
                  background: "linear-gradient(to right, #ff4040, transparent)",
                }}
              />
            </div>
            <span className="font-jetbrains text-[10px] text-white/40 w-10 text-right">
              {noPct}%
            </span>
          </div>
        </div>

        <p className="font-jetbrains text-[10px] text-white/25 mb-4">
          Total: {formatCBR(total)} CBR weighted votes
        </p>

        {/* Vote buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleVote(true)}
            disabled={localVoting || !!myVote}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-orbitron text-xs font-bold tracking-wider transition-all disabled:opacity-40"
            style={{
              background:
                myVote?.choice === true
                  ? "rgba(0,255,96,0.2)"
                  : "rgba(0,255,96,0.08)",
              border:
                myVote?.choice === true
                  ? "1px solid rgba(0,255,96,0.6)"
                  : "1px solid rgba(0,255,96,0.3)",
              color: "#00ff60",
            }}
            data-ocid="proposals.primary_button"
          >
            👍 FOR
          </button>
          <button
            type="button"
            onClick={() => handleVote(false)}
            disabled={localVoting || !!myVote}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-orbitron text-xs font-bold tracking-wider transition-all disabled:opacity-40"
            style={{
              background:
                myVote?.choice === false
                  ? "rgba(255,64,64,0.2)"
                  : "rgba(255,64,64,0.08)",
              border:
                myVote?.choice === false
                  ? "1px solid rgba(255,64,64,0.6)"
                  : "1px solid rgba(255,64,64,0.3)",
              color: "#ff4040",
            }}
            data-ocid="proposals.secondary_button"
          >
            👎 AGAINST
          </button>
        </div>
      </div>
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const accent = "#cc44ff";
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className="w-8 h-8 rounded-lg font-orbitron text-xs font-bold transition-all disabled:opacity-30"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${accent}30`,
          color: accent,
        }}
      >
        ‹
      </button>

      {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => (
        <button
          key={pageNum}
          type="button"
          onClick={() => onChange(pageNum)}
          className="w-8 h-8 rounded-lg font-orbitron text-xs font-bold transition-all"
          style={{
            background:
              pageNum === page ? `${accent}25` : "rgba(255,255,255,0.04)",
            border: `1px solid ${
              pageNum === page ? `${accent}70` : "rgba(255,255,255,0.08)"
            }`,
            color: pageNum === page ? accent : "rgba(255,255,255,0.35)",
            boxShadow: pageNum === page ? `0 0 10px ${accent}40` : "none",
          }}
        >
          {pageNum + 1}
        </button>
      ))}

      <button
        type="button"
        disabled={page === totalPages - 1}
        onClick={() => onChange(page + 1)}
        className="w-8 h-8 rounded-lg font-orbitron text-xs font-bold transition-all disabled:opacity-30"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${accent}30`,
          color: accent,
        }}
      >
        ›
      </button>
    </div>
  );
}

export function ProposalsTab({ onCreateClick }: ProposalsTabProps) {
  const { data: proposals = [], isLoading } = useGetAllActiveProposals();
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(proposals.length / PAGE_SIZE));
  const pagedProposals = proposals.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p
          className="font-orbitron font-bold text-sm tracking-widest"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          ACTIVE PROPOSALS
        </p>
        <button
          type="button"
          onClick={onCreateClick}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-orbitron text-xs font-bold tracking-wider transition-all hover:scale-[1.03]"
          style={{
            background: "rgba(204,68,255,0.15)",
            border: "1px solid rgba(204,68,255,0.5)",
            color: "#cc44ff",
            boxShadow: "0 0 12px rgba(204,68,255,0.3)",
          }}
          data-ocid="proposals.open_modal_button"
        >
          <span style={{ fontSize: "14px", lineHeight: 1 }}>+</span>
          CREATE
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          className="flex justify-center py-10"
          data-ocid="proposals.loading_state"
        >
          <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-purple-400 animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && proposals.length === 0 && (
        <div
          className="flex flex-col items-center gap-4 py-12 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
          data-ocid="proposals.empty_state"
        >
          <p className="font-orbitron text-sm text-white/30 tracking-wider">
            NO ACTIVE PROPOSALS
          </p>
          <p className="font-jetbrains text-xs text-white/20">
            Be the first to create a proposal
          </p>
        </div>
      )}

      {/* Proposal cards — current page only */}
      {pagedProposals.map((p, i) => (
        <div
          key={p.id.toString()}
          data-ocid={`proposals.item.${page * PAGE_SIZE + i + 1}`}
        >
          <ProposalCard proposal={p} />
        </div>
      ))}

      {/* Pagination */}
      <PaginationBar
        page={page}
        totalPages={totalPages}
        onChange={(p) => setPage(p)}
      />
    </div>
  );
}
