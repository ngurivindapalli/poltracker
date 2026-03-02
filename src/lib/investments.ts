export async function getInvestments(id: string) {
  try {
    const res = await fetch(
      `https://poltracker-investments.s3.amazonaws.com/${id}.json`
    )

    if (!res.ok) return []

    return res.json()
  } catch (e) {
    console.log("Investment fetch error:", e)
    return []
  }
}
