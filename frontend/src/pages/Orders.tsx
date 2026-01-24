import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import type { Order } from '../types/order';
import Table from '../components/ui/Table';
import type { ColumnDef } from '../components/ui/Table';
import Button from '../components/ui/Button';
import CreateOrderModal from '../components/orders/CreateOrderModal';

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ============== FETCH ORDERS ==============
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders(0, 50);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ============== HANDLERS ==============
  const handleOrderCreated = () => {
    setIsModalOpen(false);
    fetchOrders();
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
      header: 'Order ID',
      accessor: 'id',
    },
    {
      header: 'Customer ID',
      accessor: 'customer_id',
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
      header: 'Total Amount',
      render: (order) => (
        <span className="font-semibold">{formatPrice(order.total_amount)}</span>
      ),
    },
    {
      header: 'Created At',
      render: (order) => (
        <span className="text-gray-700">{formatDate(order.created_at)}</span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="px-12 py-12">
        <h1 className="text-4xl font-serif font-bold text-pwc-black mb-8">Orders</h1>
        <div className="text-center text-gray-600">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-12 py-12">
        <h1 className="text-4xl font-serif font-bold text-pwc-black mb-8">Orders</h1>
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="px-12 py-12">
      {/* Header with Title and Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-serif font-bold text-pwc-black">Orders</h1>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + New Order
        </Button>
      </div>

      {/* Table */}
      <Table data={orders} columns={columns} emptyMessage="No orders found" />

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
