"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TranscriptMessage {
  role: "user" | "agent";
  message: string;
  timestamp?: string;
}

interface SessionTranscriptProps {
  transcript: TranscriptMessage[];
}

export function SessionTranscript({ transcript }: SessionTranscriptProps) {
  const t = useTranslations("session");

  if (!transcript || transcript.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("transcript")}</CardTitle>
        <CardDescription>{t("transcriptTitle")}</CardDescription>
      </CardHeader>
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
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold">
                      {isUser ? t("user") : t("agent")}
                    </span>
                    {msg.timestamp && (
                      <span className="text-xs opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
