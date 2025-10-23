"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

interface ElevenLabsSettingsProps {
  initialSettings: {
    secret: string;
  };
}

export function ElevenLabsSettings({ initialSettings }: ElevenLabsSettingsProps) {
  const t = useTranslations("admin.settings.elevenlabs");
  const [secret, setSecret] = useState(initialSettings.secret || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const hasSecret = useMemo(() => Boolean(initialSettings.secret), [initialSettings.secret]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "elevenlabs",
          value: { secret },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save secret");
      }

      toast.success(t("saved"));
    } catch (error) {
      console.error("Error saving elevenlabs secret:", error);
      toast.error(t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="elevenlabs_secret">{t("secretLabel")}</Label>
            <div className="flex gap-2">
              <Input
                id="elevenlabs_secret"
                type={isVisible ? "text" : "password"}
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                placeholder={t("secretPlaceholder")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVisible((prev) => !prev)}
                className="shrink-0"
              >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {hasSecret ? t("secretHelpExisting") : t("secretHelp")}
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("saving") : t("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
