import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import type { CustomerWithOrders, CustomerUpdate } from '../types/customer';
import DetailLayout from '../components/ui/DetailLayout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import GenericForm from '../components/ui/GenericForm';
import type { FormField } from '../components/ui/GenericForm';

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const { data: customer, isLoading, error, isError } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.getCustomerById(customerId),
  });

  // Mutation para actualizar cliente
  const updateMutation = useMutation({
    mutationFn: (data: CustomerUpdate) => customerService.updateCustomer(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditModalOpen(false);
      setEditError(null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update customer';
      setEditError(errorMessage);
    },
  });

  // Mutation para eliminar cliente
  const deleteMutation = useMutation({
    mutationFn: () => customerService.deleteCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete customer';
      alert(`Cannot delete customer: ${errorMessage}`);
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderIndustryBadge = (industry: string) => {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
        {industry}
      </span>
    );
  };

  const editFormFields: FormField[] = [
    { name: 'name', label: 'First Name', type: 'text', placeholder: 'Enter first name' },
    { name: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Enter last name' },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter email' },
  ];

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const handleEditSubmit = async (data: CustomerUpdate) => {
    updateMutation.mutate(data);
  };

  return (
    <>
      <DetailLayout
        title={customer ? customer.company_name : 'Customer Details'}
        backRoute="/customers"
      isLoading={isLoading}
      error={isError ? error : null}
      actions={
        customer && (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(true)}
              disabled={updateMutation.isPending || deleteMutation.isPending}
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              className="text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        )
      }
    >
      {customer && (
        <div>
          {/* Description List - 2 Columns */}
          <dl className="grid grid-cols-2 gap-8">
            {/* Company Name */}
            <div className="col-span-2">
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Company Name
              </dt>
              <dd className="text-xl font-semibold text-pwc-black">
                {customer.company_name}
              </dd>
            </div>

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
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Email Address
              </dt>
              <dd className="text-base text-blue-600 hover:underline cursor-pointer">
                <a href={`mailto:${customer.email}`}>{customer.email}</a>
              </dd>
            </div>

            {/* Industry */}
            <div>
              <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                Industry
              </dt>
              <dd>
                {renderIndustryBadge(customer.industry)}
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
          {customer && 'orders' in customer && (customer as CustomerWithOrders).orders?.length > 0 && (() => {
            const sortedOrders = [...(customer as CustomerWithOrders).orders].sort(
              (a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
            );
            
            return (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-bold text-pwc-black mb-6 uppercase tracking-wide">
                  Recent Engagements
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {sortedOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`, { state: { from: location } })}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-none hover:bg-orange-50 transition cursor-pointer text-left"
                  >
                    <div>
                      <p className="font-semibold text-pwc-black">Engagement #{order.id}</p>
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
            );
          })()}
        </div>
      )}
    </DetailLayout>

      {/* Edit Modal */}
      {customer && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Customer">
          {editError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-none text-red-700">
              {editError}
            </div>
          )}
          <GenericForm<CustomerUpdate>
            fields={editFormFields}
            initialValues={{
              name: customer.name,
              last_name: customer.last_name,
              email: customer.email,
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditError(null);
            }}
          />
        </Modal>
      )}
    </>
  );
};

export default CustomerDetail;
