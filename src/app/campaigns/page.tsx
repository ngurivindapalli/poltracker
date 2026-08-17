import { CampaignFeed } from "@/components/campaigns/CampaignFeed"
import { CommentSection } from "@/components/comments/CommentSection"

export const metadata = {
  title: "Campaign Tracker | Politeia",
  description: "Candidates, campaign messaging, issues, and public updates.",
}

export default function CampaignsPage() {
  return (
    <div className="section space-y-12">
      <div className="space-y-2 pb-6 border-b border-border">
        <h1 className="text-3xl font-bold text-foreground">Campaign Tracker</h1>
        <p className="text-muted-foreground text-base">
          Candidates, messaging, issues, and public updates from the US, Canada, Europe, and Latin America.
        </p>
      </div>

      <CampaignFeed />

      <div className="border-t border-border pt-10">
        <CommentSection entityType="campaigns" entityId="global" />
      </div>
    </div>
  )
}
