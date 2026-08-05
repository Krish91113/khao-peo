import { useState, useEffect, useRef } from "react";
import { Loader2, Printer, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { billsAPI } from "@/api/bills";
import { restaurantAPI } from "@/api/restaurant";
import { toast } from "sonner";

interface FinalBillDialogProps {
    tableId: string;
    tableNumber: number;
    open: boolean;
    onClose: () => void;
}

const FinalBillDialog = ({ tableId, tableNumber, open, onClose }: FinalBillDialogProps) => {
    const [loading, setLoading] = useState(true);
    const [billData, setBillData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [restaurantName, setRestaurantName] = useState<string>("");
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            generateBill();
            fetchRestaurantDetails();
        }
    }, [open, tableId]);

    const fetchRestaurantDetails = async () => {
        try {
            const details = await restaurantAPI.getMyRestaurant();
            setRestaurantName(details.name);
        } catch (error) {
            console.error("Failed to fetch restaurant details:", error);
        }
    };

    const generateBill = async () => {
        setLoading(true);
        setError(null);
        try {
            const bill = await billsAPI.createFinal(tableId);
            setBillData(bill);
            toast.success(`Final bill generated for Table ${tableNumber}`);
        } catch (error: any) {
            console.error("Failed to generate final bill:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to generate final bill";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return {
            date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        };
    };

    const handlePrint = () => {
        const content = receiptRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank', 'width=400,height=700');
        if (!printWindow) return;

        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Final Bill - Table ${tableNumber}</title>
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
        toast.success("Customer receipt sent to printer!");
    };

    // Compute values from bill data
    const billId = billData?.id || billData?._id || '';
    const createdAt = billData?.created_at || billData?.createdAt || new Date().toISOString();
    const { date: dateStr, time: timeStr } = formatDate(createdAt);
    const items = billData?.items || [];
    const subtotal = parseFloat(String(billData?.subtotal || 0)).toFixed(2);
    const tax = parseFloat(String(billData?.tax || 0)).toFixed(2);
    const totalAmount = parseFloat(String(billData?.total_amount || billData?.totalAmount || 0)).toFixed(2);
    const totalQty = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

    if (!open) return null;

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
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-col items-center gap-3 w-full max-w-xs"
                >
                    {/* Action Buttons */}
                    {!loading && !error && billData && (
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
                    )}

                    {/* Receipt Card */}
                    <div
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
                            minHeight: "120px",
                        }}
                    >
                        {/* Loading State */}
                        {loading && (
                            <div style={{ textAlign: "center", padding: "24px 0" }}>
                                <div style={{ fontSize: "20px", fontWeight: "700", letterSpacing: "0.1em", marginBottom: "12px" }}>
                                    KHAO PEEO
                                </div>
                                <div style={{ borderTop: "2px solid #000", margin: "8px 0" }} />
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 0" }}>
                                    <span style={{ fontSize: "11px", opacity: 0.7 }}>Generating bill...</span>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {error && !loading && (
                            <div style={{ textAlign: "center", padding: "16px 0" }}>
                                <div style={{ fontSize: "20px", fontWeight: "700", letterSpacing: "0.1em", marginBottom: "12px" }}>
                                    KHAO PEEO
                                </div>
                                <div style={{ borderTop: "2px solid #000", margin: "8px 0" }} />
                                <div style={{ fontSize: "11px", color: "#ba1a1a", padding: "8px 0" }}>
                                    ⚠ {error}
                                </div>
                                <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
                                <button
                                    onClick={onClose}
                                    style={{
                                        marginTop: "8px",
                                        padding: "6px 16px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        fontSize: "11px",
                                        cursor: "pointer",
                                        backgroundColor: "#f5f5f5",
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        )}

                        {/* Bill Content */}
                        {!loading && !error && billData && (
                            <div ref={receiptRef}>
                                {/* Header */}
                                <div style={{ textAlign: "center", paddingBottom: "8px" }}>
                                    <div style={{ fontSize: "20px", fontWeight: "700", letterSpacing: "0.1em" }}>
                                        {restaurantName || "KHAO PEEO"}
                                    </div>
                                    <div style={{ fontSize: "10px", letterSpacing: "0.15em", opacity: 0.7, marginTop: "2px" }}>
                                        SMART POS FOR RESTAURANTS
                                    </div>
                                    <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "6px", letterSpacing: "0.08em" }}>
                                        *** CUSTOMER RECEIPT ***
                                    </div>
                                </div>

                                {/* Solid divider */}
                                <div style={{ borderTop: "2px solid #000", margin: "8px 0" }} />

                                {/* Bill meta info */}
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
                                        const price = parseFloat(String(item.price || 0));
                                        const qty = item.quantity || 0;
                                        const amount = (price * qty).toFixed(2);
                                        const name = item.name || item.item_name || 'Item';
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
                                                <span style={{ width: "8%", fontWeight: "700" }}>{qty}</span>
                                                <span style={{ width: "52%", paddingLeft: "4px", fontWeight: "500" }}>{name}</span>
                                                <span style={{ width: "18%", textAlign: "center", opacity: 0.75 }}>
                                                    {price.toFixed(0)}
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
                                        <span style={{ fontWeight: "600" }}>₹{subtotal}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: "11px" }}>
                                        <span style={{ opacity: 0.7 }}>TAX (5% GST)</span>
                                        <span style={{ fontWeight: "600" }}>₹{tax}</span>
                                    </div>
                                </div>

                                {/* Solid divider before grand total */}
                                <div style={{ borderTop: "2px solid #000", margin: "6px 0" }} />

                                {/* Grand Total */}
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                                    <span style={{ fontWeight: "700", fontSize: "14px", letterSpacing: "0.05em" }}>TOTAL</span>
                                    <span style={{ fontWeight: "700", fontSize: "16px" }}>₹{totalAmount}</span>
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
                        )}
                    </div>

                    {/* Close button when error */}
                    {error && !loading && (
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 rounded-lg text-sm font-semibold border transition-all hover:opacity-80 print:hidden"
                            style={{ borderColor: "#e1bfb4", color: "#594139", backgroundColor: "#fff" }}
                        >
                            Close
                        </button>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FinalBillDialog;
