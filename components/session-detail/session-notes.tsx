"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface SessionNotesProps {
  sessionId: string;
  initialNotes: string;
}

export function SessionNotes({ sessionId, initialNotes }: SessionNotesProps) {
  const t = useTranslations("session");
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save with debounce
  const saveNotes = useCallback(
    async (notesToSave: string) => {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/sessions/${sessionId}/notes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notesToSave }),
        });

        if (!response.ok) throw new Error("Failed to save notes");

        toast.success(t("notesSaved"));
      } catch {
        toast.error(t("notesSaveError"));
      } finally {
        setIsSaving(false);
      }
    },
    [sessionId, t]
  );

  // Debounce auto-save
  useEffect(() => {
    if (notes === initialNotes) return; // Don't save if unchanged

    const timeoutId = setTimeout(() => {
      saveNotes(notes);
    }, 2000); // Save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [notes, initialNotes, saveNotes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("notes")}</CardTitle>
        <CardDescription>
          {t("notesTitle")}
          {isSaving && (
            <span className="ml-2 text-xs text-muted-foreground">
              Zapisywanie...
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("notesPlaceholder")}
          className="min-h-[200px] font-mono text-sm"
        />
      </CardContent>
    </Card>
  );
}
