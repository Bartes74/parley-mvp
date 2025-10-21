import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface AgentCardProps {
  agent: {
    id: string
    title: string
    shortDescription: string | null
    difficulty: "beginner" | "intermediate" | "advanced"
    language: "pl" | "en"
    tags: string[]
    thumbnailPath: string | null
  }
  difficultyLabel: string
  languageLabel: string
}

const difficultyColors = {
  beginner: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  intermediate: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
}

export function AgentCard({ agent, difficultyLabel, languageLabel }: AgentCardProps) {
  const thumbnailUrl = agent.thumbnailPath
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/agent-thumbnails/${agent.thumbnailPath}`
    : null

  return (
    <Link href={`/agents/${agent.id}`}>
      <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/50">
        {/* Thumbnail - 16:9 aspect ratio */}
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={agent.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
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

        <CardHeader className="space-y-2">
          {/* Title */}
          <CardTitle className="line-clamp-1 text-xl group-hover:text-primary transition-colors">
            {agent.title}
          </CardTitle>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={difficultyColors[agent.difficulty]}>
              {difficultyLabel}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
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
              {languageLabel}
            </Badge>
          </div>

          {/* Description */}
          {agent.shortDescription && (
            <CardDescription className="line-clamp-2 text-sm">
              {agent.shortDescription}
            </CardDescription>
          )}
        </CardHeader>

        {/* Tags */}
        {agent.tags && agent.tags.length > 0 && (
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {agent.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {agent.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{agent.tags.length - 3}
                </Badge>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  )
}
