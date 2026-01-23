import { useState, useEffect } from 'react';
import { customerService } from '../services/customerService';
import type { Customer } from '../types/customer';
import Table from '../components/ui/Table';
import type { ColumnDef } from '../components/ui/Table';

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      {/* Title */}
      <h1 className="text-4xl font-serif font-bold text-pwc-black mb-8">Customers</h1>

      {/* Table */}
      <Table data={customers} columns={columns} emptyMessage="No customers found" />
    </div>
  );
};

export default Customers;
