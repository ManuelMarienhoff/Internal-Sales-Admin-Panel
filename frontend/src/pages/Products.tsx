import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import type { Product } from '../types/product';
import Table from '../components/ui/Table';
import type { ColumnDef } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import GenericForm from '../components/ui/GenericForm';
import type { FormField } from '../components/ui/GenericForm';

type ProductFormData = Omit<Product, 'id' | 'created_at'>;

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const formFields: FormField[] = [
    {
      name: 'name',
      label: 'Product Name',
      type: 'text',
      required: true,
      placeholder: 'Enter product name',
    },
    {
      name: 'price',
      label: 'Price',
      type: 'number',
      required: true,
      placeholder: 'Enter price',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter product description',
    },
    {
      name: 'is_active',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
  ];

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      const newProduct = await productService.createProduct(data);
      setProducts([...products, newProduct]);
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    }
  };

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
      {/* Header with Title and Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-serif font-bold text-pwc-black">Products</h1>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          New Product
        </Button>
      </div>

      {/* Table */}
      <Table data={products} columns={columns} emptyMessage="No products found" />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Product"
      >
        <GenericForm<ProductFormData>
          fields={formFields}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}


export default Products;
