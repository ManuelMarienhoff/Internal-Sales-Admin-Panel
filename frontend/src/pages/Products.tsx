import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import type { Product } from '../types/product';
import Table from '../components/ui/Table';
import type { ColumnDef } from '../components/ui/Table';

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

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
  };

  const columns: ColumnDef<Product>[] = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Price',
      render: (product) => (
        <span className="font-semibold">{formatPrice(product.price)}</span>
      ),
    },
    {
      header: 'Description',
      render: (product) => (
        <span className="text-gray-700">{product.description || '-'}</span>
      ),
    },
    {
      header: 'Status',
      render: (product) => (
        <>
          {product.is_active ? (
            <span className="text-green-800 font-medium">Active</span>
          ) : (
            <span className="text-gray-600 font-medium">Inactive</span>
          )}
        </>
      ),
    },
  ];

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

  return (
    <div className="px-12 py-12">
      {/* Title */}
      <h1 className="text-4xl font-serif font-bold text-pwc-black mb-8">Products</h1>

      {/* Table */}
      <Table data={products} columns={columns} emptyMessage="No products found" />
    </div>
  );
};

export default Products;
