"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface BrandingSettingsProps {
  initialSettings: {
    logo_path: string | null;
    primary_color: string;
  };
}

export function BrandingSettings({ initialSettings }: BrandingSettingsProps) {
  const t = useTranslations("admin.settings.branding");
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
          key: "branding",
          value: settings,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Ustawienia brandingu zapisane");
    } catch (error) {
      console.error("Error saving branding settings:", error);
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
            <Label htmlFor="primary_color">Kolor główny</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="primary_color"
                type="color"
                value={settings.primary_color}
                onChange={(e) =>
                  setSettings({ ...settings, primary_color: e.target.value })
                }
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={settings.primary_color}
                onChange={(e) =>
                  setSettings({ ...settings, primary_color: e.target.value })
                }
                placeholder="#10b981"
                className="flex-1"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Wybierz kolor który będzie używany jako główny kolor aplikacji
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo (URL)</Label>
            <Input
              id="logo"
              type="text"
              value={settings.logo_path || ""}
              onChange={(e) =>
                setSettings({ ...settings, logo_path: e.target.value || null })
              }
              placeholder="https://example.com/logo.png"
            />
            <p className="text-sm text-muted-foreground">
              Podaj URL logo lub pozostaw puste aby użyć domyślnego
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Zapisywanie..." : tCommon("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
