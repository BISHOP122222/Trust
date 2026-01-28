import Modal from '@/components/ui/Modal';
import { CheckCircle, Printer, Store } from 'lucide-react';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any | null;
}

export default function CheckoutModal({ isOpen, onClose, order }: CheckoutModalProps) {
    if (!order) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sale Completed" className="max-w-md">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-in zoom-in duration-300">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Payment Successful!</h2>
                <p className="text-slate-500">The transaction has been recorded.</p>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left font-mono text-sm space-y-3 relative overflow-hidden group">
                    {/* Receipt Header */}
                    <div className="text-center border-b border-slate-200 pb-3 mb-3 border-dashed">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Store className="w-4 h-4" />
                            <span className="font-bold uppercase">TRUST POS</span>
                        </div>
                        <p className="text-xs text-slate-500">Kampala Branch, Uganda</p>
                        <p className="text-xs text-slate-500">{order.orderNumber || 'ORD-UNKNOWN'}</p>
                        {order.customer && <p className="text-xs text-slate-500 mt-1">Customer: {order.customer.name}</p>}
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                        {order.items?.map((item: any, i: number) => (
                            <div key={i} className="space-y-0.5">
                                <div className="flex justify-between">
                                    <span className="flex-1">{item.quantity}x {item.product?.name}</span>
                                    <span className="shrink-0">{(item.price * item.quantity - (item.discountAmount || 0)).toLocaleString()}</span>
                                </div>
                                {item.discountAmount > 0 && (
                                    <p className="text-[10px] text-emerald-600 font-bold">- Discount: {item.discountAmount.toLocaleString()}</p>
                                )}
                                {(item.serialNumber || (item as any).serialNumber) && (
                                    <p className="text-[10px] text-slate-400 font-mono">
                                        S/N: {item.serialNumber || (item as any).serialNumber}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t border-slate-200 pt-3 mt-3 border-dashed space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>Subtotal</span>
                            <span>{(order.subtotal || 0).toLocaleString()}</span>
                        </div>
                        {order.discountAmount > 0 && (
                            <div className="flex justify-between text-xs text-red-500">
                                <span>Discount</span>
                                <span>- {(order.discountAmount || 0).toLocaleString()}</span>
                            </div>
                        )}

                        <div className="flex justify-between font-bold text-lg pt-1">
                            <span>TOTAL</span>
                            <span>UGX {(order.totalAmount || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="text-center text-xs text-slate-400 pt-4 mt-2 border-t border-slate-200 border-dashed">
                        <p>Thank you for shopping with us!</p>
                        <p>{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={handlePrint} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                        <Printer className="w-5 h-5" /> Print Receipt
                    </button>
                    <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                        New Sale
                    </button>
                </div>
            </div>
        </Modal>
    );
}

