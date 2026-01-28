import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import FileUpload from '@/components/ui/FileUpload';
import { useProducts, Category, Product } from '@/contexts/ProductContext';
import { cn } from '@/lib/utils';


interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: FormData) => void;
    initialData?: Product | null;
}


export default function AddProductModal({ isOpen, onClose, onSave, initialData }: AddProductModalProps) {
    const { categories } = useProducts();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState<any>({
        name: '',
        categoryId: '',
        price: 0,
        stockQuantity: initialData?.stock || 0,
        sku: '',
        serialNumber: '',
        description: '',
        brand: '',
        costPrice: 0,
        isSerialized: false,
        serialNumbersText: '' // For the textarea
    });


    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                categoryId: initialData.categoryId || (typeof initialData.category === 'object' ? initialData.category.id : ''),
                price: initialData.price,
                stockQuantity: initialData.stock,
                sku: initialData.sku || '',
                serialNumber: (initialData as any).serialNumber || '',
                description: (initialData as any).description || '',
                brand: (initialData as any).brand || '',
                costPrice: (initialData as any).costPrice || 0,
                isSerialized: (initialData as any).isSerialized || false,
                serialNumbersText: ''
            });
            setSelectedFile(null);
        } else {
            setFormData({
                name: '',
                categoryId: categories[0]?.id || '',
                price: 0,
                stockQuantity: 0,
                sku: '',
                serialNumber: '',
                description: '',
                brand: '',
                costPrice: 0,
                isSerialized: false,
                serialNumbersText: ''
            });
            setSelectedFile(null);
        }
    }, [initialData, isOpen, categories]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = new FormData();

        // Prepare serial numbers array
        const serials = formData.serialNumbersText
            .split('\n')
            .map((s: string) => s.trim())
            .filter((s: string) => s !== '');

        Object.keys(formData).forEach(key => {
            if (key === 'serialNumbersText') return;
            data.append(key, formData[key]);
        });

        serials.forEach((sn: string) => {
            data.append('serialNumbers[]', sn);
        });

        if (selectedFile) {
            data.append('image', selectedFile);
        }
        onSave(data);
        onClose();
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Product" : "Add New Product"} className="max-w-2xl">
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="e.g. iPhone 15"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select
                                value={formData.categoryId}
                                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat: Category) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                            <input
                                type="text"
                                value={formData.sku || ''}
                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="e.g. #AP-IP15"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price (UGX)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.costPrice}
                                    onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="0"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Visible only to owners</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Sales Price (UGX)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.stockQuantity}
                                    onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.serialNumber || ''}
                                    onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="e.g. S/N 123456789"
                                    disabled={formData.isSerialized}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">Serialized Inventory</h4>
                                    <p className="text-xs text-slate-500">Track individual units via IMEI/Serial</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isSerialized: !formData.isSerialized })}
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-colors relative",
                                        formData.isSerialized ? "bg-blue-600" : "bg-slate-300"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                                        formData.isSerialized ? "left-7" : "left-1"
                                    )} />
                                </button>
                            </div>

                            {formData.isSerialized && (
                                <div className="animate-in slide-in-from-top-2 duration-200">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Add Available Serials (one per line)</label>
                                    <textarea
                                        value={formData.serialNumbersText}
                                        onChange={e => setFormData({ ...formData, serialNumbersText: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-24 text-sm font-mono"
                                        placeholder="IMEI123456789&#10;IMEI987654321"
                                    />
                                    <p className="text-[10px] text-blue-600 mt-1">Stock quantity will be set based on the number of serials entered.</p>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-20"
                                placeholder="Product description..."
                            />
                        </div>

                    </div>

                    <div>
                        <FileUpload
                            onFileSelect={(file) => {
                                setSelectedFile(file);
                            }}
                            label="Product Image"
                        />
                        {(selectedFile || initialData?.imageUrl) && (
                            <div className="mt-4">
                                <p className="text-xs font-medium text-slate-500 mb-2">Preview:</p>
                                <img
                                    src={selectedFile ? URL.createObjectURL(selectedFile) : initialData?.imageUrl}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded-lg border border-slate-200"
                                />
                            </div>
                        )}
                    </div>

                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200">
                        {initialData ? 'Update Product' : 'Save Product'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
