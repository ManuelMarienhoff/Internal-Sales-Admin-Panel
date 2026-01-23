import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import type { Order } from '../types/order';
import Table from '../components/ui/Table';
import type { ColumnDef } from '../components/ui/Table';

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchOrders();
  }, []);

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
        return 'text-red-700 font-medium';
      case 'confirmed':
        return 'text-yellow-700 font-medium';
      case 'completed':
        return 'text-green-800 font-medium';
      default:
        return 'text-gray-600 font-medium';
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
      header: 'Total Amount',
      render: (order) => (
        <span className="font-semibold">{formatPrice(order.total_amount)}</span>
      ),
    },
    {
      header: 'Status',
      render: (order) => (
        <span className={getStatusColor(order.status)}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
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
      {/* Title */}
      <h1 className="text-4xl font-serif font-bold text-pwc-black mb-8">Orders</h1>

      {/* Table */}
      <Table data={orders} columns={columns} emptyMessage="No orders found" />
    </div>
  );
};

export default Orders;
