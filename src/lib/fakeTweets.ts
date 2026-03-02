export function generateFakeTweets(name: string) {
  const topics = [
    "Working families deserve economic fairness.",
    "We need affordable healthcare for every American.",
    "Investing in infrastructure creates jobs.",
    "Climate action is economic action.",
    "Education must remain accessible."
  ]

  // Use a simple hash of the name to get consistent "random" numbers
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash = hash & 0xffffffff // Convert to 32-bit integer
  }

  return topics.map((t, i) => {
    // Generate deterministic "random" likes based on name hash and index
    const seed = Math.abs(hash) + i * 1000
    const likes = 5000 + (seed % 15000)
    
    return {
      id: i,
      text: `${t} — ${name}`,
      likes: likes,
      time: `${i + 1} day${i === 0 ? '' : 's'} ago`
    }
  })
}
