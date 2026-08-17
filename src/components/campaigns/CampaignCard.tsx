import { Campaign, CampaignStatus } from "@/data/campaigns"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

function statusVariant(status: CampaignStatus): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "active": return "success"
    case "exploratory": return "warning"
    case "suspended": return "danger"
    case "ended": return "neutral"
  }
}

function statusLabel(status: CampaignStatus): string {
  switch (status) {
    case "active": return "Active"
    case "exploratory": return "Exploratory"
    case "suspended": return "Suspended"
    case "ended": return "Ended"
  }
}

interface CampaignCardProps {
  campaign: Campaign
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Card className="flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-bold text-foreground leading-tight">
            {campaign.candidateName}
          </h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {campaign.office} · {campaign.region}, {campaign.country}
          </p>
        </div>
        <Badge variant={statusVariant(campaign.campaignStatus)} className="shrink-0">
          {statusLabel(campaign.campaignStatus)}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="neutral">{campaign.party}</Badge>
        <Badge variant="default">{campaign.country}</Badge>
      </div>

      <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3 flex-grow">
        {campaign.summary}
      </p>

      {campaign.keyIssues.length > 0 && (
        <div>
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1.5">
            Key Issues
          </p>
          <div className="flex flex-wrap gap-1.5">
            {campaign.keyIssues.map((issue) => (
              <span
                key={issue}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border"
              >
                {issue}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1 border-t border-border">
        <a
          href={campaign.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-medium text-primary hover:underline"
        >
          Official Website
        </a>
        {campaign.donationUrl && (
          <a
            href={campaign.donationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium text-primary hover:underline"
          >
            Donate
          </a>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Updated: {new Date(campaign.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>
    </Card>
  )
}
