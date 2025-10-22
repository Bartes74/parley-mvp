import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { StartSessionButton } from "@/components/start-session-button"

interface AgentPageProps {
  params: Promise<{
    id: string
    locale: string
  }>
}

const difficultyColors = {
  beginner: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  intermediate: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params
  const t = await getTranslations("agent")
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch agent details
  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (error || !agent) {
    notFound()
  }

  const thumbnailUrl = agent.thumbnail_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/agent-thumbnails/${agent.thumbnail_path}`
    : null

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/agents">
            <ArrowLeft className="mr-2 size-4" />
            Powrót do katalogu
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left column - Image & Details */}
        <div className="space-y-6">
          {/* Thumbnail */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={agent.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground/40"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className={difficultyColors[agent.difficulty as keyof typeof difficultyColors]}>
              {t(`difficulty.${agent.difficulty}`)}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {t(`language.${agent.language}`)}
            </Badge>
          </div>

          {/* Tags */}
          {agent.tags && agent.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Tagi</h3>
              <div className="flex flex-wrap gap-2">
                {agent.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Content */}
        <div className="space-y-6">
          <div>
            <h1 className="mb-3 text-3xl font-bold">{agent.title}</h1>
            {agent.short_description && (
              <p className="text-lg text-muted-foreground">
                {agent.short_description}
              </p>
            )}
          </div>

          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Instrukcje</CardTitle>
              <CardDescription>{t("instructions")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {agent.instructions ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {agent.instructions}
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p>
                    Ten scenariusz rozmowy pozwoli Ci ćwiczyć umiejętności
                    komunikacyjne w realistycznym środowisku. Po zakończeniu
                    rozmowy otrzymasz szczegółowy feedback oraz transkrypcję.
                  </p>
                  <ul>
                    <li>Kliknij przycisk START aby rozpocząć</li>
                    <li>Rozmawiaj naturalnie z agentem</li>
                    <li>Po zakończeniu otrzymasz analizę i feedback</li>
                  </ul>
                </div>
              )}

              {/* Start Button */}
              <StartSessionButton
                agentId={agent.id}
                userId={user.id}
                agentTitle={agent.title}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
