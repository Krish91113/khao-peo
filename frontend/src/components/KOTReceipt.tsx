import { motion, AnimatePresence } from "framer-motion";
import { X, Printer } from "lucide-react";
import { receiptSlideOut } from "@/lib/animations";
import { useRef } from "react";

interface KOTReceiptProps {
    table: any;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    kotNumber: string;
    onClose: () => void;
}

export default function KOTReceipt({ table, items, kotNumber, onClose }: KOTReceiptProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
    const timeStr = currentDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const handlePrint = () => {
        const content = receiptRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return;

        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>KOT - Table ${table?.table_number || table?.tableNumber}</title>
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
    .large { font-size: 18px; }
    .xlarge { font-size: 22px; }
    .small { font-size: 10px; }
    .xsmall { font-size: 9px; }
    .divider-solid { border-top: 2px solid #000; margin: 6px 0; }
    .divider-dashed { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; padding: 3px 0; }
    .label { opacity: 0.65; }
    .qty-col { width: 12%; font-weight: 700; font-size: 14px; }
    .item-col { width: 88%; padding-left: 4px; }
    .col-header { font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    .uppercase { text-transform: uppercase; letter-spacing: 0.08em; }
    .mt4 { margin-top: 4px; }
    .mt8 { margin-top: 8px; }
    .mt12 { margin-top: 12px; }
    @page { size: 80mm auto; margin: 0; }
    @media print { body { padding: 4mm 4mm; } }
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
                            Print KOT
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
                                KHAO PEEO
                            </div>
                            <div style={{ fontSize: "10px", letterSpacing: "0.15em", opacity: 0.7, marginTop: "2px" }}>
                                SMART POS FOR RESTAURANTS
                            </div>
                            <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "6px", letterSpacing: "0.08em" }}>
                                *** KITCHEN ORDER TICKET ***
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
                                <span style={{ fontWeight: "700", fontSize: "16px" }}>
                                    {table?.table_number || table?.tableNumber}
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                                <span style={{ opacity: 0.6, fontSize: "11px" }}>KOT NO</span>
                                <span style={{ fontWeight: "700", fontSize: "13px" }}>{kotNumber}</span>
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
                            <span style={{ width: "12%" }}>QTY</span>
                            <span style={{ width: "88%", paddingLeft: "6px" }}>ITEM DESCRIPTION</span>
                        </div>

                        {/* Items */}
                        <div style={{ marginTop: "6px" }}>
                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        padding: "4px 0",
                                        borderBottom: index < items.length - 1 ? "1px dashed #ccc" : "none",
                                    }}
                                >
                                    <span style={{ width: "12%", fontWeight: "700", fontSize: "15px" }}>
                                        {item.quantity}
                                    </span>
                                    <span style={{ width: "88%", paddingLeft: "6px", fontSize: "12px", fontWeight: "500" }}>
                                        {item.name}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Dashed divider */}
                        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

                        {/* Footer summary */}
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                            <span style={{ opacity: 0.7 }}>TOTAL ITEMS</span>
                            <span style={{ fontWeight: "700" }}>{totalItems}</span>
                        </div>

                        {/* Solid divider */}
                        <div style={{ borderTop: "2px solid #000", margin: "8px 0" }} />

                        {/* Footer */}
                        <div style={{ textAlign: "center", fontSize: "10px" }}>
                            <div style={{ fontWeight: "700", letterSpacing: "0.1em" }}>** KITCHEN COPY **</div>
                            <div style={{ opacity: 0.6, marginTop: "4px", fontSize: "9px" }}>
                                This is a kitchen order ticket only
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
