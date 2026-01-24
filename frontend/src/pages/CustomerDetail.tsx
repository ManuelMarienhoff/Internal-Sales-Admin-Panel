import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import type { CustomerWithOrders } from '../types/customer';
import DetailLayout from '../components/ui/DetailLayout';
import Button from '../components/ui/Button';

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: customer, isLoading, error, isError } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.getCustomerById(customerId),
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <DetailLayout
      title={customer ? `${customer.name} ${customer.last_name}` : 'Customer Details'}
      backRoute="/customers"
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
      {customer && (
        <div>
          {/* Description List - 2 Columns */}
          <dl className="grid grid-cols-2 gap-8">
            {/* First Name */}
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                First Name
              </dt>
              <dd className="text-xl font-semibold text-pwc-black">
                {customer.name}
              </dd>
            </div>

            {/* Last Name */}
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Last Name
              </dt>
              <dd className="text-xl font-semibold text-pwc-black">
                {customer.last_name}
              </dd>
            </div>

            {/* Email */}
            <div className="col-span-2">
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Email Address
              </dt>
              <dd className="text-base text-blue-600 hover:underline cursor-pointer">
                <a href={`mailto:${customer.email}`}>{customer.email}</a>
              </dd>
            </div>

            {/* Created At */}
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Member Since
              </dt>
              <dd className="text-base text-gray-600">
                {formatDate(customer.created_at)}
              </dd>
            </div>

            {/* Orders Count (if available) */}
            {customer && 'orders' in customer && (
              <div>
                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Total Orders
                </dt>
                <dd className="text-base font-semibold text-pwc-orange">
                  {(customer as CustomerWithOrders).orders?.length || 0}
                </dd>
              </div>
            )}
          </dl>

          {/* Additional Info Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-pwc-black mb-6 uppercase tracking-wide">
              Account Information
            </h3>

            <dl className="grid grid-cols-2 gap-8">
              <div>
                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Customer ID
                </dt>
                <dd className="text-base text-gray-700 font-mono">
                  #{customer.id}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Account Status
                </dt>
                <dd>
                  <span className="inline-block px-3 py-1 bg-green-50 text-green-800 font-semibold rounded-none text-sm">
                    Active
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Orders Section (if available) */}
          {customer && 'orders' in customer && (customer as CustomerWithOrders).orders?.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold text-pwc-black mb-6 uppercase tracking-wide">
                Recent Orders
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {(customer as CustomerWithOrders).orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`, { state: { from: location } })}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-none hover:bg-orange-50 transition cursor-pointer text-left"
                  >
                    <div>
                      <p className="font-semibold text-pwc-black">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">
                        Status: <span className="font-medium">{order.status}</span>
                      </p>
                    </div>
                    <p className="text-lg font-bold text-pwc-orange">
                      ${typeof order.total_amount === 'string'
                        ? parseFloat(order.total_amount).toFixed(2)
                        : order.total_amount.toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DetailLayout>
  );
};

export default CustomerDetail;
