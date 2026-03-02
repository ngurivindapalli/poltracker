import Image from "next/image"
import Link from "next/link"

type Leader = {
  id: string
  name: string
  party: string
  role?: string
  image?: string
}

export default function LeaderCard({ leader }: { leader: Leader }) {
  return (
    <Link
      href={`/germany/member/${leader.id}`}
      className="bg-white rounded-xl shadow p-6 flex gap-6 items-center hover:shadow-lg transition"
      style={{
        textDecoration: "none",
        color: "inherit"
      }}
    >
      <Image
        src={leader.image || "/images/placeholder-avatar.svg"}
        width={90}
        height={90}
        alt={leader.name}
        className="rounded-full object-cover"
        style={{
          border: "2px solid #E5E7EB"
        }}
        onError={(e) => {
          e.currentTarget.src = "/images/placeholder-avatar.svg"
        }}
      />

      <div>
        <h3 className="text-xl font-semibold" style={{ marginBottom: "0.5rem" }}>
          {leader.name}
        </h3>
        <p className="text-gray-500" style={{ marginBottom: "0.25rem" }}>
          {leader.party}
        </p>
        {leader.role && (
          <p className="text-sm text-gray-400">
            {leader.role}
          </p>
        )}
      </div>
    </Link>
  )
}
