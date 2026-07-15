function PaymentStatusBanner({ status, saleInfo, onDismiss }) {
  if (!status) return null;

  const message = status === "success"
    ? saleInfo
      ? `Payment successful — ${saleInfo.quantity} x ${saleInfo.product_name} sold, stock has been updated.`
      : "Payment successful — stock has been updated."
    : "Payment was cancelled — no changes were made.";

  const borderColor = status === "success" ? "var(--color-accent)" : "var(--color-amber)";

  return (
    <div className="card" style={{ borderLeft: `4px solid ${borderColor}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{message}</span>
      <button className="btn btn--ghost" onClick={onDismiss}>Dismiss</button>
    </div>
  );
}

export default PaymentStatusBanner