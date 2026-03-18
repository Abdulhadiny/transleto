import { TaskStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<TaskStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  NOT_STARTED: { label: "Not Started", variant: "default" },
  IN_PROGRESS: { label: "In Progress", variant: "info" },
  SUBMITTED: { label: "Submitted", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "danger" },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
