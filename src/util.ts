export function getDescription(str?: string) {
  if (!str) {
    return "";
  }

  return str.replace(/\s+/g, " ").trim();
}
