import { UploadCloud, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSizeMB?: number;
    label?: string;
}

export default function FileUpload({ onFileSelect, accept = "image/*", maxSizeMB = 5, label = "Upload Image" }: FileUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        setError(null);
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File size exceeds ${maxSizeMB}MB`);
            return;
        }

        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreview(url);
        }

        onFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{label}</label>

            {preview ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                            type="button"
                            onClick={() => {
                                setPreview(null);
                                if (inputRef.current) inputRef.current.value = '';
                            }}
                            className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className={cn(
                        "border-2 border-dashed border-slate-200 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50",
                        "hover:border-blue-500 hover:bg-blue-50/50",
                        error && "border-red-500 bg-red-50"
                    )}
                >
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                        <UploadCloud className={cn("w-6 h-6 text-blue-600", error && "text-red-500")} />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Click or drag file back to upload</p>
                    <p className="text-xs text-slate-400 mt-1">
                        {error ? <span className="text-red-500 font-medium">{error}</span> : `Max size ${maxSizeMB}MB`}
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept={accept}
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                </div>
            )}
        </div>
    );
}
