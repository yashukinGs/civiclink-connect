export type IssueStatus =
  | "Pending"
  | "Verified"
  | "Assigned"
  | "In Progress"
  | "Resolved"
  | "Rejected"
  | "Closed";

export type IssuePriority = "Low" | "Medium" | "High";

export interface Issue {
  id: string;
  title: string;
  category: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  location: string;
  date: string;
  reporter: string;
  image?: string;
}

export const STATUS_STYLES: Record<IssueStatus, string> = {
  Pending: "bg-warning/15 text-warning border-warning/30",
  Verified: "bg-primary/15 text-primary border-primary/30",
  Assigned: "bg-accent/15 text-accent border-accent/30",
  "In Progress": "bg-primary/15 text-primary border-primary/30",
  Resolved: "bg-success/15 text-success border-success/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
  Closed: "bg-muted text-muted-foreground border-border",
};

export const PRIORITY_STYLES: Record<IssuePriority, string> = {
  Low: "bg-success/15 text-success border-success/30",
  Medium: "bg-warning/15 text-warning border-warning/30",
  High: "bg-destructive/15 text-destructive border-destructive/30",
};

export const CATEGORIES = [
  "Pothole",
  "Garbage",
  "Streetlight",
  "Water Leakage",
  "Drainage",
  "Road Damage",
  "Traffic Signal",
  "Public Property Damage",
  "Other",
];

export const TRACK_STAGES: IssueStatus[] = [
  "Pending",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
];

