import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { API_URL } from '@/lib/api';

export interface Product {
    id: string; // Changed to string for UUID
    name: string;
    sku?: string;
    unit?: string;
    category: string | any; // API returns category object
    price: number;
    stock: number;
    imageUrl?: string;
    image?: string | null;
    isLowStock?: boolean;
    status?: boolean;
    categoryId: string;
    isSerialized?: boolean;
    serialItems?: any[];
}



export interface Category {
    id: string;
    name: string;
    description?: string;
    parentId?: string | null;
    icons?: string;
    color?: string;
    _count?: {
        products: number;
        subCategories: number;
    };
}

interface Pagination {
    page: number;
    pages: number;
    total: number;
}

interface ProductContextType {
    products: Product[];
    categories: Category[];
    loading: boolean;
    pagination: Pagination;
    updateProduct: (id: string, updates: FormData) => Promise<void>;
    deductStock: (id: string, quantity: number) => Promise<void>;
    addProduct: (product: FormData) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    refreshProducts: (page?: number, limit?: number, keyword?: string, categoryId?: string) => Promise<void>;
    // Category Management
    addCategory: (name: string, parentId?: string) => Promise<void>;
    updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
}


const ProductContext = createContext<ProductContextType | undefined>(undefined);

// No static initial data, everything fetched from API

export function ProductProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 1, total: 0 });

    const refreshProducts = async (page = 1, limit = 50, keyword = '', categoryId = '') => {
        try {
            setLoading(true);
            const response = await api.get('/products', {
                params: { page, limit, keyword, categoryId }
            });

            const { products: rawProducts, page: currentPage, pages, total } = response.data;

            const transformed = rawProducts.map((p: any) => ({
                ...p,
                stock: p.stockQuantity,
                image: p.imageUrl ? (p.imageUrl.startsWith('http') ? p.imageUrl : `${API_URL}${p.imageUrl}`) : null,
                category: p.category?.name || 'Uncategorized',
                isSerialized: p.isSerialized,
                serialItems: p.serialItems
            }));

            setProducts(transformed);
            setPagination({ page: currentPage, pages, total });
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    // Load initial data
    useEffect(() => {
        refreshProducts();
        refreshCategories();
    }, []);

    const updateProduct = async (id: string, updates: FormData) => {
        try {
            await api.put(`/products/${id}`, updates, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await refreshProducts();
        } catch (error) {
            console.error('Failed to update product:', error);
            throw error;
        }
    };

    const addProduct = async (newProduct: FormData) => {
        try {
            await api.post('/products', newProduct, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await refreshProducts();
        } catch (error) {
            console.error('Failed to add product:', error);
            throw error;
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            await api.delete(`/products/${id}`);
            await refreshProducts();
        } catch (error) {
            console.error('Failed to delete product:', error);
            throw error;
        }
    };

    const deductStock = async (id: string, quantity: number) => {
        try {
            await api.patch(`/products/${id}/stock`, { quantity, type: 'subtract' });
            await refreshProducts();
        } catch (error) {
            console.error('Failed to deduct stock:', error);
            throw error;
        }
    };

    // Category Handlers (Keep mock for now or implement as needed)
    const addCategory = async (name: string, parentId?: string) => {
        try {
            await api.post('/categories', { name, parentId });
            await refreshCategories();
        } catch (error) {
            console.error('Failed to add category:', error);
            throw error;
        }
    };

    const updateCategory = async (id: string, updates: Partial<Category>) => {
        try {
            await api.put(`/categories/${id}`, updates);
            await refreshCategories();
        } catch (error) {
            console.error('Failed to update category:', error);
            throw error;
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            await api.delete(`/categories/${id}`);
            await refreshCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
            throw error;
        }
    };

    return (
        <ProductContext.Provider value={{
            products,
            categories,
            loading,
            pagination,
            updateProduct,
            deductStock,
            addProduct,
            deleteProduct,
            addCategory,
            updateCategory,
            deleteCategory,
            refreshProducts
        }}>
            {children}
        </ProductContext.Provider>
    );
}


export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) throw new Error('useProducts must be used within a ProductProvider');
    return context;
};
