import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import type { Product } from '../types/product';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getProducts(0, 50);
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="px-12 py-12">
        <h1 className="text-4xl font-serif font-bold text-pwc-black mb-8">Products</h1>
        <div className="text-center text-gray-600">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-12 py-12">
        <h1 className="text-4xl font-serif font-bold text-pwc-black mb-8">Products</h1>
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
  };

  return (
    <div className="px-12 py-12">
      {/* Title */}
      <h1 className="text-4xl font-serif font-bold text-pwc-black mb-8">Products</h1>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-300">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead>
            <tr className="bg-pwc-orange">
              <th className="px-6 py-4 text-left text-pwc-black font-bold border-r border-white">
                Name
              </th>
              <th className="px-6 py-4 text-left text-pwc-black font-bold border-r border-white">
                Price
              </th>
              <th className="px-6 py-4 text-left text-pwc-black font-bold border-r border-white">
                Description
              </th>
              <th className="px-6 py-4 text-left text-pwc-black font-bold">
                Status
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {products.map((product, index) => (
              <tr
                key={product.id}
                className={`${
                  index % 2 === 0 ? 'bg-white' : 'bg-orange-50'
                } border-b border-gray-300 hover:bg-orange-100 transition-colors`}
              >
                <td className="px-6 py-4 text-pwc-black">{product.name}</td>
                <td className="px-6 py-4 text-pwc-black font-semibold">
                  {formatPrice(product.price)}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {product.description || '-'}
                </td>
                <td className="px-6 py-4">
                  {product.is_active ? (
                    <span className="text-green-800 font-medium">Active</span>
                  ) : (
                    <span className="text-gray-600 font-medium">Inactive</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          No products found
        </div>
      )}
    </div>
  );
};

export default Products;
