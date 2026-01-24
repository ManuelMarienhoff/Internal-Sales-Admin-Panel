import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/productService';
import DetailLayout from '../components/ui/DetailLayout';
import Button from '../components/ui/Button';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);

  const { data: product, isLoading, error, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId),
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

  return (
    <DetailLayout
      title={product?.name || 'Product Details'}
      backRoute="/products"
      isLoading={isLoading}
      error={isError ? error : null}
      actions={
        <div className="flex gap-3">
          <Button variant="secondary">Edit</Button>
          <Button variant="secondary" className="text-red-600 hover:bg-red-50">
            Delete
          </Button>
        </div>
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
  );
};

export default ProductDetail;
