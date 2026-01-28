import { Router } from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock
} from '../controllers/productController';
import { protect, authorize } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';


const router = Router();

router.route('/')
    .get(protect, getProducts)
    .post(protect, authorize('SUPER_ADMIN', 'ADMIN'), upload.single('image'), createProduct);

router.route('/:id')
    .get(getProductById)
    .put(protect, authorize('SUPER_ADMIN', 'ADMIN'), upload.single('image'), updateProduct)

    .delete(protect, authorize('SUPER_ADMIN', 'ADMIN'), deleteProduct);

router.patch('/:id/stock', protect, authorize('SUPER_ADMIN', 'ADMIN'), updateStock);

export default router;
