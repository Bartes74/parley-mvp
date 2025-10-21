"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RawFeedback {
  summary?: string;
  tips?: string[];
  criteria?: Record<string, number>;
}

interface SessionFeedbackProps {
  feedback: {
    scoreOverall: number | null;
    scoreBreakdown: Record<string, number> | null;
    rawFeedback: RawFeedback | null;
  };
}

export function SessionFeedback({ feedback }: SessionFeedbackProps) {
  const t = useTranslations("session");

  const { summary, tips, criteria } = feedback.rawFeedback || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("feedback")}</CardTitle>
        <CardDescription>
          Szczegółowa analiza Twojej rozmowy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        {feedback.scoreOverall && (
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <span className="text-2xl font-bold text-primary">
                {feedback.scoreOverall}
              </span>
            </div>
            <div>
              <p className="font-semibold">{t("overallScore")}</p>
              <p className="text-sm text-muted-foreground">na 100 punktów</p>
            </div>
          </div>
        )}

        {/* Criteria Breakdown */}
        {criteria && Object.keys(criteria).length > 0 && (
          <div>
            <h3 className="mb-3 font-semibold">{t("criteria")}</h3>
            <div className="space-y-2">
              {Object.entries(criteria).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="capitalize">{key}</span>
                  <span className="font-semibold">{value as number}/100</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div>
            <h3 className="mb-2 font-semibold">{t("summary")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {summary}
            </p>
          </div>
        )}

        {/* Tips */}
        {tips && Array.isArray(tips) && tips.length > 0 && (
          <div>
            <h3 className="mb-2 font-semibold">{t("tips")}</h3>
            <ul className="space-y-2">
              {tips.map((tip: string, index: number) => (
                <li key={index} className="text-sm leading-relaxed text-muted-foreground">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
