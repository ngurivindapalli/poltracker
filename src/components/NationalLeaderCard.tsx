import Image from "next/image"

type NationalLeaderCardProps = {
  name: string
  title: string
  image: string
  state: string
}

export default function NationalLeaderCard({
  name,
  title,
  image,
  state,
}: NationalLeaderCardProps) {
  return (
    <div className="max-w-4xl mx-auto mb-10">
      <div className="flex items-center gap-6 bg-card border border-border rounded-2xl shadow-subtle p-6">
        <Image
          src={image}
          width={140}
          height={140}
          alt={name}
          className="rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/images/placeholder-avatar.svg"
          }}
        />

        <div>
          <div className="text-sm text-muted-foreground mb-1">
            {title}
          </div>
          <div className="text-3xl font-semibold text-foreground">
            {name}
          </div>
          <div className="text-muted-foreground">
            {state}
          </div>
        </div>
      </div>
    </div>
  )
}
