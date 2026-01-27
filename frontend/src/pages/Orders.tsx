import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import type { Order } from '../types/order';
import Table from '../components/ui/Table';
import type { ColumnDef } from '../components/ui/Table';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import CreateOrderModal from '../components/orders/CreateOrderModal';
import type { PaginatedResponse } from '../types/pagination';

const Orders = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  // ============== QUERY ==============
  const { data, error, isError, isFetching } = useQuery<PaginatedResponse<Order>>({
    queryKey: ['orders', searchTerm, page, pageSize],
    queryFn: () => {
      const skip = (page - 1) * pageSize;
      return orderService.getOrders(skip, pageSize, searchTerm);
    },
    placeholderData: keepPreviousData,
  });

  // ============== HANDLERS ==============
  const handleOrderCreated = () => {
    setIsModalOpen(false);
    // Invalidate orders query to refetch fresh data
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  // ============== FORMATTERS ==============
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'text-red-700 bg-red-50';
      case 'confirmed':
        return 'text-yellow-700 bg-yellow-50';
      case 'completed':
        return 'text-green-800 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const columns: ColumnDef<Order>[] = [
    {
      header: 'ID',
      render: (order) => <span className="font-semibold text-pwc-black">#{order.id}</span>,
    },
    {
      header: 'Company',
      className: 'w-1/4',
      render: (order) => (
        <div>
          <div className="font-semibold text-gray-900">{order.customer.company_name}</div>
          <div className="text-xs text-gray-600">{order.customer.industry}</div>
        </div>
      ),
    },
    {
      header: 'Contact',
      render: (order) => (
        <div>
          <div className="font-medium text-gray-900">
            {order.customer.name} {order.customer.last_name}
          </div>
          <div className="text-xs text-gray-500">{order.customer.email}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (order) => (
        <span className={`px-3 py-1 rounded-none font-medium text-sm ${getStatusColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      ),
    },
    {
      header: 'Total',
      render: (order) => (
        <span className="font-semibold">{formatPrice(order.total_amount)}</span>
      ),
    },
    {
      header: 'Date',
      render: (order) => (
        <span className="text-gray-700">{formatDate(order.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="px-12 py-12">
      {/* Header with Title and Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-serif font-bold text-pwc-black">Engagements</h1>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          New Engagement
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          placeholder="Search engagements by ID or client name..."
          onSearch={handleSearch}
          initialValue={searchTerm}
        />
      </div>

      {isError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700">
          Error: {error instanceof Error ? error.message : 'Failed to load engagements'}
        </div>
      )}

      {/* Table and Pagination Container */}
      <div className="flex flex-col justify-between min-h-[600px]">
        {/* Table */}
        <div className={isFetching ? 'opacity-50 transition-opacity' : ''}>
          <Table 
            data={data?.items ?? []} 
            columns={columns} 
            emptyMessage="No engagements found"
            onRowClick={(order) => navigate(`/orders/${order.id}`)}
          />
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={data?.pages ?? 1}
          onPageChange={setPage}
        />
      </div>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
};

export default Orders;
