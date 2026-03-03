export const normalize = (value: string = "") =>
  value.toLowerCase().replace(/[^a-z]/g, "");
