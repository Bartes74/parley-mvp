"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";

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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let logoPath = settings.logo_path;

      // Upload logo if new file selected
      if (logoFile) {
        setIsUploadingLogo(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", logoFile);

        const uploadResponse = await fetch("/api/upload/logo", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          console.error("Upload Error:", uploadResponse.status, errorData);
          throw new Error(`Failed to upload logo: ${uploadResponse.status}`);
        }

        const uploadData = await uploadResponse.json();
        console.log("Upload successful:", uploadData);
        logoPath = uploadData.path;
        setIsUploadingLogo(false);
      }

      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "branding",
          value: {
            ...settings,
            logo_path: logoPath,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      // Update local state with new logo path
      setSettings({ ...settings, logo_path: logoPath });
      setLogoFile(null);
      toast.success("Ustawienia brandingu zapisane");
    } catch (error) {
      console.error("Error saving branding settings:", error);
      toast.error(`Nie udało się zapisać ustawień: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      setIsUploadingLogo(false);
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
            <Label htmlFor="logo">Logo (wgraj plik lub podaj URL)</Label>

            {/* Current logo preview */}
            {settings.logo_path && (
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                <div className="relative h-20 w-40">
                  <Image
                    src={
                      settings.logo_path.startsWith('http')
                        ? settings.logo_path
                        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${settings.logo_path}`
                    }
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Obecne logo
                </div>
              </div>
            )}

            {/* File upload */}
            <div className="flex items-center gap-4">
              <label
                htmlFor="logo_file"
                className="inline-flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                Wybierz plik
              </label>
              <input
                id="logo_file"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Check file size (2MB limit)
                    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
                    if (file.size > MAX_SIZE) {
                      toast.error(`Plik jest za duży (${(file.size / 1024 / 1024).toFixed(2)}MB). Maksymalny rozmiar to 2MB.`);
                      e.target.value = ''; // Clear input
                      return;
                    }
                    setLogoFile(file);
                  }
                }}
                disabled={isSubmitting || isUploadingLogo}
                className="hidden"
              />
              <span className="text-sm text-muted-foreground">
                {logoFile ? logoFile.name : "Nie wybrano pliku"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Format: PNG, JPG, WEBP | Maksymalny rozmiar: 2MB | Zalecana wysokość: 80px
            </p>

            {/* Or separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  lub
                </span>
              </div>
            </div>

            {/* URL input */}
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
              Podaj URL zewnętrznego logo
            </p>

            {isUploadingLogo && (
              <p className="text-xs text-muted-foreground">
                Przesyłanie i przetwarzanie logo...
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Zapisywanie..." : tCommon("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
