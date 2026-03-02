import members from "../../../../data/bundestag-cache.json"

export async function GET() {
  console.log("Serving cached Bundestag data")

  return Response.json(members)
}
