import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import type { Customer } from '../types/customer';
import Table from '../components/ui/Table';
import type { ColumnDef } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import GenericForm from '../components/ui/GenericForm';
import type { FormField } from '../components/ui/GenericForm';

type CustomerFormData = Omit<Customer, 'id' | 'created_at'>;

const Customers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ============== QUERY ==============
  const { data: customers = [], isLoading, error, isError } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(0, 50),
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const columns: ColumnDef<Customer>[] = [
    {
      header: 'Name',
      render: (customer) => `${customer.name} ${customer.last_name}`,
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Created At',
      render: (customer) => (
        <span className="text-gray-700">{formatDate(customer.created_at)}</span>
      ),
    },
  ];

  const formFields: FormField[] = [
    {
      name: 'name',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'Enter first name',
    },
    {
      name: 'last_name',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'Enter last name',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Enter email address',
    },
  ];

  const handleFormSubmit = async (data: CustomerFormData) => {
    try {
      setFormError(null);
      await customerService.createCustomer(data);
      // Invalidate query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create customer');
    }
  };

  if (isLoading) {
    return (
      <div className="px-12 py-12">
        <h1 className="text-4xl font-serif font-bold text-pwc-black mb-8">Customers</h1>
        <div className="text-center text-gray-600">Loading customers...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-12 py-12">
        <h1 className="text-4xl font-serif font-bold text-pwc-black mb-8">Customers</h1>
        <div className="text-center text-red-600">Error: {error instanceof Error ? error.message : 'Failed to load customers'}</div>
      </div>
    );
  }

  return (
    <div className="px-12 py-12">
      {/* Header with Title and Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-serif font-bold text-pwc-black">Customers</h1>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          New Customer
        </Button>
      </div>

      {/* Table */}
      <Table 
        data={customers} 
        columns={columns} 
        emptyMessage="No customers found"
        onRowClick={(customer) => navigate(`/customers/${customer.id}`)}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Customer"
      >
        {formError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-none text-red-700">
            {formError}
          </div>
        )}
        <GenericForm<CustomerFormData>
          fields={formFields}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Customers;
