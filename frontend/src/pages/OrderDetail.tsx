import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import type { OrderWithDetails } from '../types/order';
import DetailLayout from '../components/ui/DetailLayout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import type { ColumnDef } from '../components/ui/Table';

interface OrderItem {
  id: number;
  product_id: number;
  order_id: number;
  quantity: number;
  unit_price: string | number;
  created_at: string;
  product: {
    id: number;
    name: string;
    price: string | number;
  };
}

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: order, isLoading, error, isError } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId) as Promise<OrderWithDetails>,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-red-50 text-red-800';
      case 'confirmed':
        return 'bg-yellow-50 text-yellow-800';
      case 'completed':
        return 'bg-green-50 text-green-800';
      default:
        return 'bg-gray-50 text-gray-800';
    }
  };

  const itemColumns: ColumnDef<OrderItem>[] = [
    {
      header: 'Product',
      render: (item) => (
        <button
          onClick={() => navigate(`/products/${item.product.id}`, { state: { from: location } })}
          className="font-medium text-pwc-black hover:text-pwc-orange transition cursor-pointer"
        >
          {item.product.name}
        </button>
      ),
    },
    {
      header: 'Unit Price',
      render: (item) => <span>{formatPrice(item.unit_price)}</span>,
    },
    {
      header: 'Quantity',
      render: (item) => (
        <span className="font-semibold text-center">{item.quantity}</span>
      ),
    },
    {
      header: 'Subtotal',
      render: (item) => {
        const price =
          typeof item.unit_price === 'string'
            ? parseFloat(item.unit_price)
            : item.unit_price;
        const subtotal = price * item.quantity;
        return (
          <span className="font-bold text-pwc-orange">
            {formatPrice(subtotal)}
          </span>
        );
      },
    },
  ];

  return (
    <DetailLayout
      title={order ? `Order #${order.id}` : 'Order Details'}
      backRoute="/orders"
      isLoading={isLoading}
      error={isError ? error : null}
      actions={
        order && order.status === 'draft' && (
          <div className="flex gap-3">
            <Button variant="secondary">Edit</Button>
            <Button variant="secondary" className="text-red-600 hover:bg-red-50">
              Cancel Order
            </Button>
          </div>
        )
      }
    >
      {order && (
        <div>
          {/* Order Header Info - 2 Columns */}
          <dl className="grid grid-cols-2 gap-8 mb-12">
            {/* Order ID */}
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Order ID
              </dt>
              <dd className="text-xl font-semibold text-pwc-black">
                #{order.id}
              </dd>
            </div>

            {/* Status */}
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Status
              </dt>
              <dd>
                <span
                  className={`inline-block px-3 py-1 font-semibold rounded-none text-sm ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </dd>
            </div>

            {/* Customer Name */}
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Customer
              </dt>
              <dd className="text-base font-medium">
                <button
                  onClick={() => navigate(`/customers/${order.customer?.id}`, { state: { from: location } })}
                  className="text-pwc-black hover:text-pwc-orange transition cursor-pointer underline"
                >
                  {order.customer?.name} {order.customer?.last_name}
                </button>
              </dd>
            </div>

            {/* Customer Email */}
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Email
              </dt>
              <dd className="text-base text-blue-600 hover:underline cursor-pointer">
                <a href={`mailto:${order.customer?.email}`}>
                  {order.customer?.email}
                </a>
              </dd>
            </div>

            {/* Order Total */}
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Order Total
              </dt>
              <dd className="text-2xl font-bold text-pwc-orange">
                {formatPrice(order.total_amount)}
              </dd>
            </div>

            {/* Created At */}
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Created At
              </dt>
              <dd className="text-base text-gray-600">
                {formatDate(order.created_at)}
              </dd>
            </div>
          </dl>

          {/* Divider */}
          <div className="border-t border-gray-200 my-8"></div>

          {/* Order Items Table */}
          <div>
            <h3 className="text-lg font-bold text-pwc-black mb-6 uppercase tracking-wide">
              Order Items ({order.items?.length || 0})
            </h3>

            {order.items && order.items.length > 0 ? (
              <Table
                data={order.items}
                columns={itemColumns}
                emptyMessage="No items in this order"
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No items found in this order</p>
              </div>
            )}
          </div>

          {/* Order Summary Stats */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-pwc-black mb-6 uppercase tracking-wide">
              Summary
            </h3>

            <div className="grid grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-none">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Total Items
                </p>
                <p className="text-2xl font-bold text-pwc-black">
                  {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                </p>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-none">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Product Lines
                </p>
                <p className="text-2xl font-bold text-pwc-black">
                  {order.items?.length || 0}
                </p>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-none">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Grand Total
                </p>
                <p className="text-2xl font-bold text-pwc-orange">
                  {formatPrice(order.total_amount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DetailLayout>
  );
};

export default OrderDetail;
