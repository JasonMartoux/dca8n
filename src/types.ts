export interface Stream {
  id: string;
  inToken: string;
  outToken: string;
  flowRate: string;
  status: "actif" | "paused" | "completed" | "error";
  startDate: string;
}
