export type SenatorLite = {
  bioguideId: string
  name: string
  party?: string
  state?: string
  url?: string
  imageUrl: string
}

export type BillLite = {
  title: string
  congress?: string
  type?: string
  number?: string
  introducedDate?: string
  latestAction?: string
  url?: string
}
