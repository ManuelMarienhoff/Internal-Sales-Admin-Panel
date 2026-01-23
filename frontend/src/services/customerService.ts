import axiosInstance from '../api/axios';
import type { Customer } from '../types/customer';

export const customerService = {
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
};
