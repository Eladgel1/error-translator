export function formatLocalDateTime(value: string): string {
  return new Date(value).toLocaleString("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
