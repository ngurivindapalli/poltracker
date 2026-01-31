export function senatorImageUrl(bioguideId: string, size: '225x275' | '450x550' | 'original' = '225x275') {
  // Predictable public-domain images by Bioguide ID
  // served via https://unitedstates.github.io/images/congress/[size]/[bioguide].jpg
  return `https://unitedstates.github.io/images/congress/${size}/${bioguideId}.jpg`
}
