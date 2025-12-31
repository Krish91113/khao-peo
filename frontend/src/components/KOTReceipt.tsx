import { motion, AnimatePresence } from "framer-motion";
import { X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
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

    const handlePrint = () => {
        window.print();
    };

    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('en-IN');
    const timeStr = currentDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
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
                    className="relative w-full max-w-md"
                >
                    {/* Close and Print Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-4 justify-center print:hidden w-full max-w-md mx-auto">
                        <Button onClick={handlePrint} variant="default" size="sm" className="w-full sm:w-auto touch-target">
                            <Printer className="h-4 w-4 mr-2" />
                            Print KOT
                        </Button>
                        <Button onClick={onClose} variant="outline" size="sm" className="w-full sm:w-auto touch-target">
                            <X className="h-4 w-4 mr-2" />
                            Close
                        </Button>
                    </div>

                    {/* Thermal Receipt */}
                    <div ref={receiptRef} className="thermal-receipt shadow-2xl">
                        <div className="thermal-receipt-header">
                            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>KHAO PEEO</div>
                            <div style={{ fontSize: '12px', marginTop: '4px' }}>KITCHEN ORDER TICKET</div>
                        </div>

                        <div style={{ marginTop: '12px' }}>
                            <div className="thermal-receipt-line">
                                <span>Date:</span>
                                <span>{dateStr}</span>
                            </div>
                            <div className="thermal-receipt-line">
                                <span>Time:</span>
                                <span>{timeStr}</span>
                            </div>
                            <div className="thermal-receipt-line">
                                <span>Table No:</span>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{table.table_number}</span>
                            </div>
                            <div className="thermal-receipt-line">
                                <span>KOT No:</span>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{kotNumber}</span>
                            </div>
                        </div>

                        <div className="thermal-receipt-separator"></div>

                        <div style={{ marginTop: '8px' }}>
                            <div className="thermal-receipt-line" style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
                                <span style={{ width: '15%' }}>QTY</span>
                                <span style={{ width: '85%' }}>DESCRIPTION</span>
                            </div>
                            {items.map((item, index) => (
                                <div key={index} className="thermal-receipt-line" style={{ marginTop: '6px' }}>
                                    <span style={{ width: '15%', fontWeight: 'bold' }}>{item.quantity}</span>
                                    <span style={{ width: '85%' }}>{item.name}</span>
                                </div>
                            ))}
                        </div>

                        <div className="thermal-receipt-separator"></div>

                        <div className="thermal-receipt-footer">
                            <div>Total Items: {items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                            <div style={{ marginTop: '8px', fontSize: '10px' }}>
                                ** KITCHEN COPY **
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
