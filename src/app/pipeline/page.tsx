"use client";

import { useCandidates } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreBadge } from "@/components/ui/score-badge";
import { cn, stageLabel } from "@/lib/utils";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import Link from "next/link";
import type { Candidate } from "@/lib/db/schema";
import { KanbanSquare } from "lucide-react";

const STAGES = [
  { id: "discovered", color: "border-t-slate-500" },
  { id: "researching", color: "border-t-blue-500" },
  { id: "outreach_ready", color: "border-t-violet-500" },
  { id: "contacted", color: "border-t-amber-500" },
  { id: "in_conversation", color: "border-t-emerald-500" },
];

export default function PipelinePage() {
  const { data: candidates, isLoading, mutate } = useCandidates();

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;

    const candidateId = Number(result.draggableId);
    const newStage = result.destination.droppableId;

    // Optimistic update
    if (candidates) {
      const updated = candidates.map((c) =>
        c.id === candidateId ? { ...c, pipelineStage: newStage } : c
      );
      mutate(updated, false);
    }

    await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId, stage: newStage }),
    });

    mutate();
  }

  function getCandidatesForStage(stage: string): Candidate[] {
    return (candidates || []).filter((c) => c.pipelineStage === stage);
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 h-96" />
          ))}
        </div>
      </div>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Pipeline</h1>
        <p className="text-slate-400 mb-8">
          Manage candidates through your hiring pipeline
        </p>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <KanbanSquare className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No candidates in pipeline
          </h3>
          <p className="text-slate-400 max-w-md">
            Seed the database or run a search to discover candidates first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Pipeline</h1>
        <p className="text-slate-400">
          Drag candidates between stages to manage your outreach pipeline
        </p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageCandidates = getCandidatesForStage(stage.id);
            return (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 min-w-[220px] max-w-[280px] bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col border-t-2",
                      stage.color,
                      snapshot.isDraggingOver && "bg-slate-800/50 border-slate-700"
                    )}
                  >
                    {/* Column header */}
                    <div className="p-3 border-b border-slate-800">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">
                          {stageLabel(stage.id)}
                        </h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                          {stageCandidates.length}
                        </span>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="p-2 flex-1 overflow-y-auto space-y-2">
                      {stageCandidates.map((candidate, index) => (
                        <Draggable
                          key={candidate.id}
                          draggableId={String(candidate.id)}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "kanban-card bg-slate-800 border border-slate-700 rounded-lg p-3",
                                snapshot.isDragging && "shadow-xl shadow-black/40 border-indigo-500/50"
                              )}
                            >
                              <Link href={`/candidates/${candidate.id}`}>
                                <div className="flex items-center gap-2.5 mb-2">
                                  <img
                                    src={
                                      candidate.avatarUrl ||
                                      `https://api.dicebear.com/7.x/notionists/svg?seed=${candidate.username}`
                                    }
                                    alt=""
                                    className="w-8 h-8 rounded-full bg-slate-700"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                      {candidate.displayName}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                      @{candidate.username}
                                    </p>
                                  </div>
                                  <ScoreBadge
                                    score={candidate.overallScore || 0}
                                    size="sm"
                                  />
                                </div>
                              </Link>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
