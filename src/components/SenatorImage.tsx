"use client"

import { useState } from "react"

type SenatorImageProps = {
  bioguideId: string
  imageUrl?: string
  name: string
  width?: number
  height?: number
}

export default function SenatorImage({ bioguideId, imageUrl, name, width = 160, height = 160 }: SenatorImageProps) {
  const [imgSrc, setImgSrc] = useState(imageUrl || getImageUrl(bioguideId))
  const [hasError, setHasError] = useState(false)

  function getImageUrl(id: string) {
    if (!id) return ""
    const firstLetter = id[0]?.toUpperCase() || "A"
    return `https://bioguide.congress.gov/bioguide/photo/${firstLetter}/${id}.jpg`
  }

  const handleError = () => {
    if (!hasError && imageUrl && imgSrc !== imageUrl) {
      setImgSrc(imageUrl)
      setHasError(true)
    } else {
      setHasError(true)
    }
  }

  if (hasError && imgSrc === imageUrl) {
    return null // Hide image if both sources failed
  }

  return (
    <img
      src={imgSrc}
      alt={name}
      width={width}
      height={height}
      style={{ 
        borderRadius: "9999px", 
        objectFit: "cover",
        border: "3px solid #E5E7EB",
        flexShrink: 0
      }}
      onError={handleError}
    />
  )
}
