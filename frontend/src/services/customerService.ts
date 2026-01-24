import axiosInstance from '../api/axios';
import type { Customer, CustomerCreate, CustomerUpdate } from '../types/customer';

export const customerService = {
  // ============== READ OPERATIONS ==============
  getCustomers: async (skip: number = 0, limit: number = 10): Promise<Customer[]> => {
    try {
      const response = await axiosInstance.get<Customer[]>('/customers', {
        params: {
          skip,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch customers: ${error}`);
    }
  },

  getCustomerById: async (id: number): Promise<Customer> => {
    try {
      const response = await axiosInstance.get<Customer>(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch customer: ${error}`);
    }
  },

  // ============== CREATE OPERATION ==============
  createCustomer: async (customerData: CustomerCreate): Promise<Customer> => {
    try {
      const response = await axiosInstance.post<Customer>('/customers', customerData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create customer: ${error}`);
    }
  },

  // ============== UPDATE OPERATION ==============
  updateCustomer: async (id: number, customerData: CustomerUpdate): Promise<Customer> => {
    try {
      const response = await axiosInstance.patch<Customer>(`/customers/${id}`, customerData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update customer: ${error}`);
    }
  },

  // ============== DELETE OPERATION ==============
  deleteCustomer: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/customers/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete customer: ${error}`);
    }
  },
};
