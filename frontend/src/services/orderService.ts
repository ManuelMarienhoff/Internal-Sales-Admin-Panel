import axiosInstance from '../api/axios';
import type { Order } from '../types/order';

export const orderService = {
  getOrders: async (skip: number = 0, limit: number = 10): Promise<Order[]> => {
    try {
      const response = await axiosInstance.get<Order[]>('/orders', {
        params: {
          skip,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch orders: ${error}`);
    }
  },

  getOrderById: async (id: number): Promise<Order> => {
    try {
      const response = await axiosInstance.get<Order>(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch order: ${error}`);
    }
  },
};
