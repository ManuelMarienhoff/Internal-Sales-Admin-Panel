import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import type { Customer } from '../types/customer';
import Table from '../components/ui/Table';
import type { ColumnDef } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import GenericForm from '../components/ui/GenericForm';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import type { FormField } from '../components/ui/GenericForm';
import type { PaginatedResponse } from '../types/pagination';

type CustomerFormData = Omit<Customer, 'id' | 'created_at'>;

const Customers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  // ============== QUERY ==============
  const { data, error, isError, isFetching } = useQuery<PaginatedResponse<Customer>>({
    queryKey: ['customers', searchTerm, page, pageSize],
    queryFn: () => {
      const skip = (page - 1) * pageSize;
      return customerService.getCustomers(skip, pageSize, searchTerm);
    },
    placeholderData: keepPreviousData,
  });

  const columns: ColumnDef<Customer>[] = [
    {
      header: 'ID',
      accessor: 'id',
      className: 'w-[90px] min-w-[90px]',
    },
    {
      header: 'Company',
      accessor: 'company_name',
    },
    {
      header: 'Industry',
      render: (customer) => (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
          {customer.industry}
        </span>
      ),
    },
    {
      header: 'Contact',
      render: (customer) => `${customer.name} ${customer.last_name}`,
    },
    {
      header: 'Contact Email',
      accessor: 'email',
      className: 'min-w-[220px]',
    },
  ];

  const sortedCustomers = (data?.items ?? []).slice().sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

  const formFields: FormField[] = [
    {
      name: 'company_name',
      label: 'Company Name',
      type: 'text',
      required: true,
      placeholder: 'Enter company name',
    },
    {
      name: 'industry',
      label: 'Industry',
      type: 'select',
      required: true,
      options: [
        { value: 'Technology', label: 'Technology' },
        { value: 'Finance', label: 'Finance' },
        { value: 'Retail', label: 'Retail' },
        { value: 'Healthcare', label: 'Healthcare' },
        { value: 'Energy', label: 'Energy' },
        { value: 'Manufacturing', label: 'Manufacturing' },
      ],
    },
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

  return (
    <div className="h-full flex flex-col px-12 py-12">
      {/* Header with Title and Button */}
      <div className="flex justify-between items-center mb-8 flex-shrink-0">
        <h1 className="text-4xl font-serif font-bold text-pwc-black">Clients</h1>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          New Customer
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex-shrink-0">
        <SearchBar
          placeholder="Search clients by ID, name, or email..."
          onSearch={handleSearch}
          initialValue={searchTerm}
        />
      </div>

      {isError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 flex-shrink-0">
          Error: {error instanceof Error ? error.message : 'Failed to load customers'}
        </div>
      )}

      {/* Table and Pagination */}
      <div className={isFetching ? 'opacity-50 transition-opacity' : ''}>
        <Table 
          data={sortedCustomers} 
          columns={columns} 
          emptyMessage="No customers found"
          onRowClick={(customer) => navigate(`/customers/${customer.id}`)}
          rowsPerPage={pageSize}
        />
      </div>

      <div>
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
