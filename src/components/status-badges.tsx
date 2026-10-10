import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-ui";

const ORDER_STATUS_STYLE: Record<string, string> = {
  pending_payment: "border-transparent bg-warning/15 text-warning",
  confirmed: "border-transparent bg-success/15 text-success",
  processing: "border-transparent bg-secondary text-secondary-foreground",
  shipped: "border-transparent bg-secondary text-secondary-foreground",
  delivered: "border-transparent bg-success/15 text-success",
  cancelled: "border-transparent bg-destructive/10 text-destructive",
  returned: "border-transparent bg-muted text-muted-foreground",
  refunded: "border-transparent bg-muted text-muted-foreground",
};

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  paid: "border-transparent bg-success/15 text-success",
  cod_collected: "border-transparent bg-success/15 text-success",
  cod_due: "border-transparent bg-warning/15 text-warning",
  pending: "border-transparent bg-secondary text-secondary-foreground",
  unpaid: "border-transparent bg-muted text-muted-foreground",
  failed: "border-transparent bg-destructive/10 text-destructive",
  refunded: "border-transparent bg-muted text-muted-foreground",
};

/** Colored order-status badge (client-safe labels from @/lib/order-ui). */
export function OrderStatusBadge({ status }: { status: string }) {
  const style = ORDER_STATUS_STYLE[status] ?? "border-transparent bg-muted text-muted-foreground";
  const label = ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status;
  return <Badge className={style}>{label}</Badge>;
}

/** Colored payment-status badge. */
export function PaymentStatusBadge({ status }: { status: string }) {
  const style = PAYMENT_STATUS_STYLE[status] ?? "border-transparent bg-muted text-muted-foreground";
  const label = PAYMENT_STATUS_LABELS[status as keyof typeof PAYMENT_STATUS_LABELS] ?? status;
  return <Badge className={style}>{label}</Badge>;
}
