import { getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import { AgentCard } from "@/components/agent-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AgentsPageProps {
  searchParams: Promise<{ tag?: string }>
}

export default async function AgentsPage({ searchParams }: AgentsPageProps) {
  const [{ tag: rawTag }, t, tAgent] = await Promise.all([
    searchParams,
    getTranslations("agents"),
    getTranslations("agent"),
  ])

  const selectedTag = rawTag?.trim() || null

  const supabase = await createClient()

  let query = supabase
    .from("agents")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  if (selectedTag) {
    query = query.contains("tags", [selectedTag])
  }

  const { data: agents, error } = await query

  if (error) {
    console.error("Error fetching agents:", error)
  }

  const hasAgents = Boolean(agents && agents.length > 0)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {selectedTag ? (
        <div className="mb-8 flex flex-col gap-3 rounded-lg border border-dashed bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("filteringByTag", { tag: selectedTag })}
            </p>
            {!hasAgents ? (
              <p className="text-sm text-muted-foreground/70">
                {t("noAgentsWithTag", { tag: selectedTag })}
              </p>
            ) : null}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/agents">{t("clearTagFilter")}</Link>
          </Button>
        </div>
      ) : null}

      {/* Agents Grid */}
      {!hasAgents ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            {selectedTag ? t("noAgentsWithTag", { tag: selectedTag }) : t("noAgents")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("noAgentsDescription")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents!.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={{
                id: agent.id,
                title: agent.title,
                shortDescription: agent.short_description,
                difficulty: agent.difficulty,
                language: agent.language,
                tags: agent.tags || [],
                thumbnailPath: agent.thumbnail_path,
              }}
              difficultyLabel={tAgent(`difficulty.${agent.difficulty}`)}
              languageLabel={tAgent(`language.${agent.language}`)}
              activeTag={selectedTag}
            />
          ))}
        </div>
      )}
    </div>
  )
}
