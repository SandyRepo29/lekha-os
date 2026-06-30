"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, CheckCircle2, Clock, Globe, Lock, ChevronDown, ChevronUp } from "lucide-react";
import type { TrustQuestionnaire } from "@/lib/db/schema";

type AnswerRow = {
  id: string;
  questionnaireId: string;
  completionPercent: number;
  visibility: string;
  updatedAt: Date;
  questionnaireTitle: string | null;
  questionnaireCategory: string | null;
};

function ProgressBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-green-500" : value >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function TrustQuestionnairesClient({
  questionnaires,
  answers,
}: {
  questionnaires: TrustQuestionnaire[];
  answers: AnswerRow[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const answeredIds = new Set(answers.map((a) => a.questionnaireId));

  const getAnswer = (qId: string) => answers.find((a) => a.questionnaireId === qId);

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-pink-400" />
          <div>
            <p className="text-xl font-bold">{questionnaires.length}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">Available questionnaires</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
          <div>
            <p className="text-xl font-bold">{answers.length}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">Completed</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-yellow-400" />
          <div>
            <p className="text-xl font-bold">{questionnaires.length - answers.length}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">Pending</p>
          </div>
        </Card>
      </div>

      {questionnaires.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-[var(--color-ink-faint)] mx-auto mb-3" />
          <p className="font-medium">No questionnaires available</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">Global questionnaire templates will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {questionnaires.map((q) => {
            const ans = getAnswer(q.id);
            const isExpanded = expanded === q.id;
            return (
              <Card key={q.id} className="overflow-hidden">
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white"
                  onClick={() => setExpanded(isExpanded ? null : q.id)}
                >
                  <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{q.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[var(--color-ink-dim)] capitalize">{q.category}</span>
                      {q.isGlobal && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Global</span>}
                    </div>
                    {ans ? (
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="flex-1 max-w-32">
                          <ProgressBar value={ans.completionPercent} />
                        </div>
                        <span className="text-xs text-[var(--color-ink-dim)]">{ans.completionPercent}% complete</span>
                        {ans.visibility === "public" ? (
                          <Globe className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{q.questionCount} questions · Not started</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {ans ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Answered
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Pending</span>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--color-ink-dim)]" /> : <ChevronDown className="h-4 w-4 text-[var(--color-ink-dim)]" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[var(--color-line)] pt-4">
                    {q.description && <p className="text-sm text-[var(--color-ink-dim)] mb-4">{q.description}</p>}
                    <div className="flex items-center gap-3">
                      <a href={`/trust-exchange/questionnaires/${q.id}`} className="inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--color-blue)] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                        {ans ? "Edit Answers" : "Start Questionnaire"}
                      </a>
                      {ans && (
                        <span className="text-xs text-[var(--color-ink-dim)]">
                          Last updated {new Date(ans.updatedAt).toLocaleDateString("en-GB")}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
