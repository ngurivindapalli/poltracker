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
      <div className="flex items-center gap-6 bg-white rounded-2xl shadow p-6">
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
          <div className="text-sm text-gray-500 mb-1">
            {title}
          </div>
          <div className="text-3xl font-bold">
            {name}
          </div>
          <div className="text-gray-500">
            {state}
          </div>
        </div>
      </div>
    </div>
  )
}
