// Public domain member photos by Bioguide ID.
// See: https://github.com/unitedstates/images
export function memberPhotoUrl(bioguideId: string, size: '225x275' | '450x550' | 'original' = '225x275') {
  return `https://unitedstates.github.io/images/congress/${size}/${bioguideId}.jpg`
}
