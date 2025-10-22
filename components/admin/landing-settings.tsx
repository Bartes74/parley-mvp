"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface LandingSettingsProps {
  initialSettings: {
    headline: string;
    lead: string;
    cta_login: string;
    cta_register: string;
  };
}

export function LandingSettings({ initialSettings }: LandingSettingsProps) {
  const t = useTranslations("admin.settings.landing");
  const tCommon = useTranslations("common");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState(initialSettings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "landing",
          value: settings,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success(t("saved"));
    } catch (error) {
      console.error("Error saving landing settings:", error);
      toast.error("Nie udało się zapisać ustawień");
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
            <Label htmlFor="headline">{t("headline")}</Label>
            <Input
              id="headline"
              value={settings.headline}
              onChange={(e) =>
                setSettings({ ...settings, headline: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead">{t("lead")}</Label>
            <Textarea
              id="lead"
              value={settings.lead}
              onChange={(e) =>
                setSettings({ ...settings, lead: e.target.value })
              }
              rows={3}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cta_login">{t("ctaLogin")}</Label>
              <Input
                id="cta_login"
                value={settings.cta_login}
                onChange={(e) =>
                  setSettings({ ...settings, cta_login: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta_register">{t("ctaRegister")}</Label>
              <Input
                id="cta_register"
                value={settings.cta_register}
                onChange={(e) =>
                  setSettings({ ...settings, cta_register: e.target.value })
                }
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("saving") : tCommon("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
