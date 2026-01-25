import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { productService } from '../services/productService';
import type { Product } from '../types/product';
import Table from '../components/ui/Table';
import type { ColumnDef } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import GenericForm from '../components/ui/GenericForm';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import type { FormField } from '../components/ui/GenericForm';
import type { PaginatedResponse } from '../types/pagination';

type ProductFormData = Omit<Product, 'id' | 'created_at'>;

const Products = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'active' | 'inactive'>('active');
  const pageSize = 8;

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  // ============== QUERY ==============
  const { data, error, isError, isFetching } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['products', searchTerm, page, pageSize, view],
    queryFn: () => {
      const skip = (page - 1) * pageSize;
      const isActive = searchTerm ? undefined : view === 'active' ? true : false;
      return productService.getProducts(skip, pageSize, searchTerm, isActive);
    },
    placeholderData: keepPreviousData,
  });

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
  };

  const renderServiceLineBadge = (serviceLine: string) => {
    const palette: Record<string, string> = {
      Audit: 'bg-blue-100 text-blue-800',
      Tax: 'bg-green-100 text-green-800',
      Consulting: 'bg-orange-100 text-orange-800',
    };
    const colors = palette[serviceLine] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${colors}`}>
        {serviceLine}
      </span>
    );
  };

  const columns: ColumnDef<Product>[] = [
    {
      header: 'ID',
      accessor: 'id',
      className: 'w-16',
    },
    {
      header: 'Service',
      accessor: 'name',
      className: 'w-1/4',
    },
    {
      header: 'Service Line',
      className: 'w-1/5',
      render: (product) => renderServiceLineBadge(product.service_line),
    },
    {
      header: 'Price',
      className: 'w-1/6',
      render: (product) => (
        <span className="font-semibold">{formatPrice(product.price)}</span>
      ),
    },
    {
      header: 'Description',
      className: 'w-1/3',
      render: (product) => (
        <span className="text-gray-700">{product.description || '-'}</span>
      ),
    },
    {
      header: 'Status',
      className: 'w-1/6',
      render: (product) => (
        product.is_active ? (
          <span className="text-green-800 font-medium">Active</span>
        ) : (
          <span className="text-gray-600 font-medium">Inactive</span>
        )
      ),
    },
  ];

  const formFields: FormField[] = [
    {
      name: 'name',
      label: 'Service Name',
      type: 'text',
      required: true,
      placeholder: 'Enter service name',
    },
    {
      name: 'service_line',
      label: 'Service Line',
      type: 'select',
      required: true,
      options: [
        { value: 'Audit', label: 'Audit' },
        { value: 'Tax', label: 'Tax' },
        { value: 'Consulting', label: 'Consulting' },
      ],
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
      setFormError(null);
      await productService.createProduct(data);
      // Invalidate query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create product');
    }
  };

  return (
    <div className="px-12 py-12">
      {/* Header with Title and Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-serif font-bold text-pwc-black">Services Catalog</h1>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          New Service
        </Button>
      </div>

      {/* Search Bar (global) */}
      <div className="mb-6">
        <SearchBar
          placeholder="Search services by ID or name..."
          onSearch={handleSearch}
          initialValue={searchTerm}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b border-gray-200">
        <button
          type="button"
          disabled={Boolean(searchTerm)}
          className={`pb-2 text-sm font-medium ${
            view === 'active' ? 'text-pwc-black border-b-2 border-pwc-orange' : 'text-gray-500'
          } ${searchTerm ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => {
            setView('active');
            setPage(1);
          }}
        >
          Active Services
        </button>
        <button
          type="button"
          disabled={Boolean(searchTerm)}
          className={`pb-2 text-sm font-medium ${
            view === 'inactive' ? 'text-pwc-black border-b-2 border-pwc-orange' : 'text-gray-500'
          } ${searchTerm ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => {
            setView('inactive');
            setPage(1);
          }}
        >
          Inactive Services
        </button>
      </div>

      {isError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700">
          Error: {error instanceof Error ? error.message : 'Failed to load products'}
        </div>
      )}

      {/* Table and Pagination Container */}
      <div className="flex flex-col justify-between min-h-[600px]">
        {/* Table */}
        <div className={isFetching ? 'opacity-50 transition-opacity' : ''}>
          <Table 
            data={data?.items ?? []} 
            columns={columns} 
            emptyMessage="No products found"
            onRowClick={(product) => navigate(`/products/${product.id}`)}
          />
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={data?.pages ?? 1}
          onPageChange={setPage}
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Service"
      >
        {formError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-none text-red-700">
            {formError}
          </div>
        )}
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
