import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';
import type { ProductUpdate } from '../types/product';
import DetailLayout from '../components/ui/DetailLayout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import GenericForm from '../components/ui/GenericForm';
import type { FormField } from '../components/ui/GenericForm';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const { data: product, isLoading, error, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId),
  });

  // Mutation para actualizar producto
  const updateMutation = useMutation({
    mutationFn: (data: ProductUpdate) => productService.updateProduct(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditModalOpen(false);
      setEditError(null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update product';
      setEditError(errorMessage);
    },
  });

  // Mutation para eliminar producto
  const deleteMutation = useMutation({
    mutationFn: () => productService.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/products');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete product';
      alert(`Cannot delete product: ${errorMessage}`);
    },
  });

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const editFormFields: FormField[] = [
    { name: 'name', label: 'Product Name', type: 'text', placeholder: 'Enter product name' },
    { name: 'price', label: 'Price', type: 'number', placeholder: 'Enter price' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
    {
      name: 'is_active',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
  ];

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const handleEditSubmit = async (data: ProductUpdate) => {
    updateMutation.mutate(data);
  };

  return (
    <>
      <DetailLayout
        title={product?.name || 'Product Details'}
        backRoute="/products"
      isLoading={isLoading}
      error={isError ? error : null}
      actions={
        product && (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(true)}
              disabled={updateMutation.isPending || deleteMutation.isPending}
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              className="text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        )
      }
    >
      {product && (
        <div>
          {/* Description List - 2 Columns */}
          <dl className="grid grid-cols-2 gap-8">
            {/* Product Name */}
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Product Name
              </dt>
              <dd className="text-xl font-semibold text-pwc-black">
                {product.name}
              </dd>
            </div>

            {/* Price */}
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Price
              </dt>
              <dd className="text-xl font-semibold text-pwc-orange">
                {formatPrice(product.price)}
              </dd>
            </div>

            {/* Description */}
            <div className="col-span-2">
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Description
              </dt>
              <dd className="text-base text-gray-700 leading-relaxed">
                {product.description || (
                  <span className="text-gray-400 italic">No description provided</span>
                )}
              </dd>
            </div>

            {/* Status */}
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Status
              </dt>
              <dd>
                {product.is_active ? (
                  <span className="inline-block px-3 py-1 bg-green-50 text-green-800 font-semibold rounded-none text-sm">
                    Active
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 bg-gray-50 text-gray-700 font-semibold rounded-none text-sm">
                    Inactive
                  </span>
                )}
              </dd>
            </div>

            {/* Created At */}
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Created At
              </dt>
              <dd className="text-base text-gray-600">
                {formatDate(product.created_at)}
              </dd>
            </div>
          </dl>

          {/* Additional Info Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-pwc-black mb-6 uppercase tracking-wide">
              Additional Information
            </h3>

            <dl className="grid grid-cols-2 gap-8">
              <div>
                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Product ID
                </dt>
                <dd className="text-base text-gray-700 font-mono">
                  #{product.id}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Last Updated
                </dt>
                <dd className="text-base text-gray-600">
                  {formatDate(product.created_at)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </DetailLayout>

      {/* Edit Modal */}
      {product && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Product">
          {editError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-none text-red-700">
              {editError}
            </div>
          )}
          <GenericForm<ProductUpdate>
            fields={editFormFields}
            initialValues={{
              name: product.name,
              price: product.price,
              description: product.description,
              is_active: product.is_active,
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditError(null);
            }}
          />
        </Modal>
      )}
    </>
  );
};

export default ProductDetail;
