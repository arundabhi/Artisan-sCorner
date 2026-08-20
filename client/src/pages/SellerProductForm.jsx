import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Upload, X, Loader2, Save } from 'lucide-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Price must be a positive number'),
  compareAtPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Compare price must be a positive number').optional(),
  stock: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number.isInteger(Number(val)), 'Stock must be a positive integer'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  isFeatured: z.boolean().optional(),
});

const SellerProductForm = () => {
  const { id } = useParams(); // populated if editing
  const isEdit = !!id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const categories = ['Kitchenware', 'Ceramics', 'Home Decor', 'Leather Goods', 'Wellness'];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isFeatured: false,
    },
  });

  // Load existing product details if editing
  useEffect(() => {
    if (isEdit) {
      const fetchProduct = async () => {
        setFetching(true);
        try {
          // We can query by product ID or slug. The backend API handles products/:id or products/:slug
          // Wait, let's fetch by GET /api/products list and find, or just query products detail endpoint.
          // The public products detail endpoint is /api/products/:slug. But wait! The CRUD patch/delete uses ID.
          // Let's query GET /api/products with a direct vendor list or query details.
          // Wait, let's make sure the details endpoint works with both ID and slug! Mongoose CastError catches ID, and slug queries string. So the details endpoint `/api/products/:slug` in controller actually does `findOne({ slug })`. Let's see: we can query by ID directly by fetching vendor products and filtering. This is a very safe fallback.
          const res = await api.get('/products/vendor/me');
          const prod = res.data?.products?.find(p => p._id === id);
          
          if (!prod) {
            toast.error('Product not found');
            navigate('/dashboard/seller/products');
            return;
          }

          setValue('name', prod.name);
          setValue('description', prod.description);
          setValue('category', prod.category);
          setValue('price', prod.price.toString());
          setValue('compareAtPrice', prod.compareAtPrice ? prod.compareAtPrice.toString() : '0');
          setValue('stock', prod.stock.toString());
          setValue('sku', prod.sku);
          setValue('isFeatured', prod.isFeatured || false);
          
          setExistingImages(prod.images || []);
        } catch (err) {
          toast.error('Failed to load product details');
          navigate('/dashboard/seller/products');
        } finally {
          setFetching(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEdit]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 5 images maximum
    const availableSlots = 5 - imageFiles.length - (isEdit ? existingImages.length : 0);
    const filesToUpload = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      toast.error('Maximum limit is 5 images per product.');
    }

    const newFiles = [...imageFiles, ...filesToUpload];
    setImageFiles(newFiles);

    const newPreviews = filesToUpload.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const handleRemoveNewImage = (idx) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== idx);
    setImageFiles(updatedFiles);
    
    const updatedPreviews = imagePreviews.filter((_, i) => i !== idx);
    setImagePreviews(updatedPreviews);
  };

  const handleRemoveExistingImage = (idx) => {
    setExistingImages(existingImages.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data) => {
    // Validate images selection
    if (!isEdit && imageFiles.length === 0) {
      toast.error('Please upload at least one product image.');
      return;
    }
    if (isEdit && existingImages.length === 0 && imageFiles.length === 0) {
      toast.error('Please upload at least one product image.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('price', data.price);
    formData.append('compareAtPrice', data.compareAtPrice || '0');
    formData.append('stock', data.stock);
    formData.append('sku', data.sku);
    formData.append('isFeatured', data.isFeatured ? 'true' : 'false');

    // Append newly selected files
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    // Append remaining existing images so server knows what to keep/delete
    if (isEdit) {
      formData.append('existingImages', JSON.stringify(existingImages));
    }

    try {
      if (isEdit) {
        // If editing, send existing images array as reference if we didn't replace them
        // Wait, the backend product update controller accepts files and overwrites. Let's make sure it handles updates.
        await api.patch(`/products/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Product listed successfully!');
      }
      navigate('/dashboard/seller/products');
    } catch (err) {
      toast.error(err.message || 'Product operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-artisanal-50">
        <Loader2 className="animate-spin text-artisanal-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-6 space-y-6">
      {/* Back link */}
      <div>
        <Link
          to="/dashboard/seller/products"
          className="inline-flex items-center gap-1 text-xs font-semibold text-charcoal hover:underline"
        >
          <ArrowLeft size={14} /> Back to Products List
        </Link>
        <h1 className="text-3xl font-serif font-bold text-artisanal-900 mt-2">
          {isEdit ? 'Modify Creation' : 'List New Creation'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-artisanal-200 rounded-3xl p-8 shadow-md space-y-6">
        
        {/* Core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Product Title
            </label>
            <input
              type="text"
              placeholder="e.g. Hand-Carved Walnut Salad Bowl"
              className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                errors.name ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
              }`}
              {...register('name')}
            />
            {errors.name && <span className="text-xs text-red-500 mt-1 block">{errors.name.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Product SKU
            </label>
            <input
              type="text"
              placeholder="e.g. WW-BOWL-01"
              disabled={isEdit} // SKU shouldn't be edited once created
              className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                isEdit ? 'bg-artisanal-100 cursor-not-allowed border-artisanal-200' : errors.sku ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
              }`}
              {...register('sku')}
            />
            {errors.sku && <span className="text-xs text-red-500 mt-1 block">{errors.sku.message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Category
            </label>
            <select
              className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 font-medium ${
                errors.category ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
              }`}
              {...register('category')}
            >
              <option value="">Select Craft</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <span className="text-xs text-red-500 mt-1 block">{errors.category.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Price ($)
            </label>
            <input
              type="text"
              placeholder="0.00"
              className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                errors.price ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
              }`}
              {...register('price')}
            />
            {errors.price && <span className="text-xs text-red-500 mt-1 block">{errors.price.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Compare Price ($)
            </label>
            <input
              type="text"
              placeholder="Optional sale price comparison"
              className="w-full bg-artisanal-50 border border-artisanal-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500"
              {...register('compareAtPrice')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Stock Quantity
            </label>
            <input
              type="number"
              placeholder="Units available"
              className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                errors.stock ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
              }`}
              {...register('stock')}
            />
            {errors.stock && <span className="text-xs text-red-500 mt-1 block">{errors.stock.message}</span>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
            Creation Description
          </label>
          <textarea
            rows={5}
            placeholder="Describe the material characteristics, craft workflow steps, oil coatings, dimensions, weight..."
            className={`w-full bg-artisanal-50 border rounded-xl p-4 text-sm focus:outline-none focus:border-artisanal-500 ${
              errors.description ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
            }`}
            {...register('description')}
          />
          {errors.description && <span className="text-xs text-red-500 mt-1 block">{errors.description.message}</span>}
        </div>

        {/* Image upload box */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
            Creations Images (Up to 5 images)
          </label>
          
          <div className="flex flex-wrap gap-4 items-center">
            {/* Existing images list (If editing) */}
            {isEdit && existingImages.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-artisanal-300">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X size={10} />
                </button>
              </div>
            ))}

            {/* Newly selected image previews */}
            {imagePreviews.map((preview, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-artisanal-300">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveNewImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X size={10} />
                </button>
              </div>
            ))}

            {/* Upload prompt */}
            {imageFiles.length + existingImages.length < 5 && (
              <label className="w-20 h-20 bg-artisanal-50 hover:bg-artisanal-100 border-2 border-dashed border-artisanal-300 hover:border-artisanal-400 rounded-xl flex items-center justify-center cursor-pointer transition-all flex-shrink-0">
                <Upload size={18} className="text-artisanal-400" />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>
        </div>

        {/* Featured flag */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="isFeatured"
            className="w-4 h-4 text-artisanal-500 focus:ring-artisanal-400 border-artisanal-300 rounded cursor-pointer"
            {...register('isFeatured')}
          />
          <label htmlFor="isFeatured" className="text-sm font-medium text-charcoal cursor-pointer">
            Feature this product on homepage list
          </label>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-artisanal-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/seller/products')}
            className="bg-white border border-artisanal-300 text-charcoal px-6 py-2.5 rounded-xl text-xs font-semibold hover:bg-artisanal-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-clay hover:bg-clay-dark text-white rounded-xl px-8 py-2.5 text-xs font-semibold shadow flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
            {isEdit ? 'Save Changes' : 'List Product'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default SellerProductForm;
