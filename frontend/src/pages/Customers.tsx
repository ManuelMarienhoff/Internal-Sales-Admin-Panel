import { useState, useEffect } from 'react';
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await customerService.getCustomers(0, 50);
        setCustomers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

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

  const handleFormSubmit = (data: CustomerFormData) => {
    console.log('Form Data:', data);
    setIsModalOpen(false);
    // TODO: Connect to customerService.createCustomer() when backend is ready
  };

  if (loading) {
    return (
      <div className="px-12 py-12">
        <h1 className="text-4xl font-serif font-bold text-pwc-black mb-8">Customers</h1>
        <div className="text-center text-gray-600">Loading customers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-12 py-12">
        <h1 className="text-4xl font-serif font-bold text-pwc-black mb-8">Customers</h1>
        <div className="text-center text-red-600">Error: {error}</div>
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
      <Table data={customers} columns={columns} emptyMessage="No customers found" />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Customer"
      >
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
