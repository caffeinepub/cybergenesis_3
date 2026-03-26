import { X } from "lucide-react";
import { useState } from "react";
import { useCreateProposal } from "../../hooks/useQueries";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "./GovernanceTypes";

interface CreateProposalModalProps {
  onClose: () => void;
}

const CATEGORIES = ["treasury", "partnership", "roadmap"] as const;

export function CreateProposalModal({ onClose }: CreateProposalModalProps) {
  const [category, setCategory] = useState<string>("roadmap");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const createProposal = useCreateProposal();

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    await createProposal.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      category,
    });
    onClose();
  };

  return (
    <dialog
      open
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-transparent border-0 w-full h-full max-w-none max-h-none"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      data-ocid="proposals.modal"
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,3,30,0.97) 0%, rgba(5,0,20,0.99) 100%)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(204,68,255,0.25)",
          boxShadow:
            "0 0 40px rgba(204,68,255,0.15), 0 8px 48px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p
            className="font-orbitron font-bold text-sm tracking-widest"
            style={{
              color: "#cc44ff",
              textShadow: "0 0 8px rgba(204,68,255,0.6)",
            }}
          >
            CREATE PROPOSAL
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.3)" }}
            data-ocid="proposals.close_button"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Category */}
          <div>
            <p className="font-orbitron text-[10px] tracking-widest text-white/35 mb-2">
              CATEGORY
            </p>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => {
                const col = CATEGORY_COLORS[cat];
                const isActive = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className="flex-1 py-2 rounded-xl font-orbitron text-[10px] font-bold tracking-wider transition-all"
                    style={{
                      background: isActive
                        ? `${col}20`
                        : "rgba(255,255,255,0.04)",
                      border: isActive
                        ? `1px solid ${col}60`
                        : "1px solid rgba(255,255,255,0.08)",
                      color: isActive ? col : "rgba(255,255,255,0.3)",
                      boxShadow: isActive ? `0 0 10px ${col}25` : "none",
                    }}
                    data-ocid="proposals.tab"
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <p className="font-orbitron text-[10px] tracking-widest text-white/35 mb-2">
              TITLE
              <span className="text-white/20 ml-2">({title.length}/100)</span>
            </p>
            <input
              type="text"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Proposal title..."
              className="w-full px-4 py-2.5 rounded-xl font-jetbrains text-sm text-white bg-transparent outline-none placeholder-white/20"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              data-ocid="proposals.input"
            />
          </div>

          {/* Description */}
          <div>
            <p className="font-orbitron text-[10px] tracking-widest text-white/35 mb-2">
              DESCRIPTION
              <span className="text-white/20 ml-2">
                ({description.length}/1000)
              </span>
            </p>
            <textarea
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your proposal in detail..."
              rows={5}
              className="w-full px-4 py-2.5 rounded-xl font-jetbrains text-sm text-white bg-transparent outline-none resize-none placeholder-white/20"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              data-ocid="proposals.textarea"
            />
          </div>

          {/* Warning */}
          <div
            className="flex items-start gap-2 px-4 py-3 rounded-xl"
            style={{
              background: "rgba(255,160,0,0.06)",
              border: "1px solid rgba(255,160,0,0.2)",
            }}
          >
            <span className="text-amber-400 text-sm mt-0.5">⚠</span>
            <p className="font-jetbrains text-xs text-amber-400/70">
              Only stakers can create proposals. You must have active CBR
              staked.
            </p>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              createProposal.isPending || !title.trim() || !description.trim()
            }
            className="w-full py-3 rounded-xl font-orbitron text-sm font-bold tracking-widest transition-all disabled:opacity-40"
            style={{
              background: createProposal.isPending
                ? "rgba(204,68,255,0.1)"
                : "rgba(204,68,255,0.2)",
              border: "1px solid rgba(204,68,255,0.5)",
              color: "#cc44ff",
              boxShadow: createProposal.isPending
                ? "none"
                : "0 0 20px rgba(204,68,255,0.3)",
            }}
            data-ocid="proposals.submit_button"
          >
            {createProposal.isPending ? "CREATING..." : "CREATE PROPOSAL"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
