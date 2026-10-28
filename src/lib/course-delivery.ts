export type CourseDeliveryMode = "live" | "recorded";

export function courseDeliveryMode(value: string | null | undefined): CourseDeliveryMode {
  return value === "recorded" ? "recorded" : "live";
}