export const INDIA_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export function indiaStateToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function indiaSlugToState(slug: string) {
  const normalized = slug.replace(/-/g, " ").toLowerCase();
  return INDIA_STATES.find((s) => s.toLowerCase() === normalized);
}
