"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface TranscriptMessage {
  role: "user" | "agent";
  message: string;
  timestamp?: string;
}

interface SessionTranscriptProps {
  transcript: TranscriptMessage[];
}

export function SessionTranscript({ transcript }: SessionTranscriptProps) {
  const t = useTranslations("session");
  const [isVisible, setIsVisible] = useState(false);

  if (!transcript || transcript.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("transcript")}</CardTitle>
        <div className="flex items-center justify-between gap-4">
          <CardDescription>{t("transcriptTitle")}</CardDescription>
          <Button variant="outline" size="sm" onClick={() => setIsVisible((prev) => !prev)}>
            {isVisible ? t("transcriptHide") : t("transcriptShow")}
          </Button>
        </div>
      </CardHeader>
      {isVisible ? (
        <CardContent>
          <div className="space-y-4">
            {transcript.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={index}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`relative flex max-w-[80%] flex-col gap-1 rounded-2xl px-4 py-3 shadow-sm ${
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span>{isUser ? t("user") : t("agent")}</span>
                      {msg.timestamp && (
                        <span className="text-xs opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.message}</p>
                    <span
                      className={`absolute bottom-[-6px] h-3 w-3 rotate-45 ${
                        isUser
                          ? "right-5 bg-primary"
                          : "left-5 border border-muted bg-card"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
