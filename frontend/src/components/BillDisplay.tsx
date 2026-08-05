import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Printer, X } from "lucide-react";
import { toast } from "sonner";
import { receiptSlideOut } from "@/lib/animations";

interface BillDisplayProps {
  bill: any;
  onClose: () => void;
  restaurantName?: string;
}

const BillDisplay = ({ bill, onClose, restaurantName }: BillDisplayProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Extract date and time
  const createdAt = bill?.created_at || bill?.createdAt || bill?.servedAt || bill?.served_at || new Date().toISOString();
  const dateObj = new Date(createdAt);
  const dateStr = dateObj.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
  const timeStr = dateObj.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true
  });

  // Extract table number
  const tableNumber = bill?.table?.table_number || bill?.table_number || bill?.tableNumber || "N/A";
  const billId = bill?.id || bill?._id || bill?.billNumber || "REPRINT";

  // Extract items array
  const rawItems = bill?.items || bill?.billDetails?.items || [];
  const items = rawItems.map((item: any) => ({
    name: item.name || item.item_name || "Unknown Item",
    quantity: item.quantity || 1,
    price: parseFloat(String(item.price || 0)),
  }));

  // Extract totals with smart calculation fallbacks
  const computedSubtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const rawSubtotal = bill?.subtotal || bill?.billDetails?.subtotal;
  const subtotalVal = rawSubtotal !== undefined ? parseFloat(String(rawSubtotal)) : computedSubtotal;

  const rawTax = bill?.tax || bill?.billDetails?.tax;
  const taxVal = rawTax !== undefined ? parseFloat(String(rawTax)) : subtotalVal * 0.05;

  const rawTotal = bill?.total_amount || bill?.totalAmount || bill?.total_bill_amount || bill?.totalBillAmount || bill?.billDetails?.total_amount;
  const totalVal = rawTotal !== undefined ? parseFloat(String(rawTotal)) : subtotalVal + taxVal;

  const totalQty = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=400,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Receipt - Table ${tableNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 8mm 6mm;
      font-size: 12px;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .divider-solid { border-top: 2px solid #000; margin: 6px 0; }
    .divider-dashed { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; padding: 3px 0; }
    @page { size: 80mm auto; margin: 0; }
    @media print { body { padding: 4mm; } }
  </style>
</head>
<body>
  ${content.innerHTML}
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
    toast.success("Receipt sent to printer!");
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          variants={receiptSlideOut}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="relative flex flex-col items-center gap-3 w-full max-w-xs"
        >
          {/* Action buttons */}
          <div className="flex gap-2 w-full print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: "#E85D25" }}
            >
              <Printer className="h-4 w-4" />
              Print Bill
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-all hover:opacity-80"
              style={{ borderColor: "#e1bfb4", color: "#594139", backgroundColor: "#fff" }}
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>

          {/* Thermal Receipt */}
          <div
            ref={receiptRef}
            style={{
              fontFamily: "'JetBrains Mono', 'Courier New', Courier, monospace",
              width: "80mm",
              maxWidth: "100%",
              backgroundColor: "#ffffff",
              color: "#000000",
              padding: "10mm 8mm",
              fontSize: "12px",
              lineHeight: "1.5",
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              borderRadius: "4px",
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", paddingBottom: "8px" }}>
              <div style={{ fontSize: "20px", fontWeight: "700", letterSpacing: "0.1em" }}>
                {restaurantName || "KHAO PEEO"}
              </div>
              <div style={{ fontSize: "10px", letterSpacing: "0.15em", opacity: 0.7, marginTop: "2px" }}>
                SMART POS FOR RESTAURANTS
              </div>
              <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "6px", letterSpacing: "0.08em" }}>
                *** REPRINT BILL ***
              </div>
            </div>

            {/* Solid divider */}
            <div style={{ borderTop: "2px solid #000", margin: "8px 0" }} />

            {/* Meta info */}
            <div style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span style={{ opacity: 0.6, fontSize: "11px" }}>DATE</span>
                <span style={{ fontWeight: "600", fontSize: "11px" }}>{dateStr}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span style={{ opacity: 0.6, fontSize: "11px" }}>TIME</span>
                <span style={{ fontWeight: "600", fontSize: "11px" }}>{timeStr}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ opacity: 0.6, fontSize: "11px" }}>TABLE NO</span>
                <span style={{ fontWeight: "700", fontSize: "16px" }}>#{tableNumber}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span style={{ opacity: 0.6, fontSize: "11px" }}>BILL NO</span>
                <span style={{ fontWeight: "700", fontSize: "12px" }}>
                  {billId.toString().slice(0, 8).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Dashed divider */}
            <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

            {/* Items header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "700",
              fontSize: "10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              paddingBottom: "4px",
              borderBottom: "1px solid #000",
            }}>
              <span style={{ width: "8%" }}>QTY</span>
              <span style={{ width: "52%", paddingLeft: "4px" }}>ITEM</span>
              <span style={{ width: "18%", textAlign: "center" }}>RATE</span>
              <span style={{ width: "22%", textAlign: "right" }}>AMOUNT</span>
            </div>

            {/* Items */}
            <div style={{ marginTop: "4px" }}>
              {items.map((item: any, index: number) => {
                const amount = (item.price * item.quantity).toFixed(2);
                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      padding: "4px 0",
                      borderBottom: index < items.length - 1 ? "1px dashed #ccc" : "none",
                      fontSize: "11px",
                    }}
                  >
                    <span style={{ width: "8%", fontWeight: "700" }}>{item.quantity}</span>
                    <span style={{ width: "52%", paddingLeft: "4px", fontWeight: "500" }}>{item.name}</span>
                    <span style={{ width: "18%", textAlign: "center", opacity: 0.75 }}>
                      {item.price.toFixed(0)}
                    </span>
                    <span style={{ width: "22%", textAlign: "right", fontWeight: "700" }}>
                      ₹{amount}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Dashed divider */}
            <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

            {/* Totals */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: "11px" }}>
                <span style={{ opacity: 0.7 }}>TOTAL ITEMS</span>
                <span style={{ fontWeight: "600" }}>{totalQty}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: "11px" }}>
                <span style={{ opacity: 0.7 }}>SUBTOTAL</span>
                <span style={{ fontWeight: "600" }}>₹{subtotalVal.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: "11px" }}>
                <span style={{ opacity: 0.7 }}>TAX (5% GST)</span>
                <span style={{ fontWeight: "600" }}>₹{taxVal.toFixed(2)}</span>
              </div>
            </div>

            {/* Solid divider before grand total */}
            <div style={{ borderTop: "2px solid #000", margin: "6px 0" }} />

            {/* Grand Total */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
              <span style={{ fontWeight: "700", fontSize: "14px", letterSpacing: "0.05em" }}>TOTAL</span>
              <span style={{ fontWeight: "700", fontSize: "16px" }}>₹{totalVal.toFixed(2)}</span>
            </div>

            {/* Solid divider */}
            <div style={{ borderTop: "2px solid #000", margin: "8px 0" }} />

            {/* Footer */}
            <div style={{ textAlign: "center", fontSize: "10px" }}>
              <div style={{ fontWeight: "700", letterSpacing: "0.08em" }}>
                THANK YOU FOR DINING WITH US!
              </div>
              <div style={{ opacity: 0.6, marginTop: "4px", fontSize: "9px" }}>
                We hope to serve you again soon
              </div>
              <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
              <div style={{ opacity: 0.5, fontSize: "9px" }}>
                Powered by Khao Peeo POS · netbro.in
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BillDisplay;
