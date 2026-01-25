import axiosInstance from '../api/axios';
import type { Order, OrderCreate, OrderUpdate, OrderWithDetails } from '../types/order';

export const orderService = {
  // ============== READ OPERATIONS ==============
  getOrders: async (skip: number = 0, limit: number = 10, search?: string): Promise<Order[]> => {
    try {
      const response = await axiosInstance.get<Order[]>('/orders', {
        params: {
          skip,
          limit,
          ...(search && { search }),
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch orders: ${error}`);
    }
  },

  getOrderById: async (id: number): Promise<OrderWithDetails> => {
    try {
      const response = await axiosInstance.get<OrderWithDetails>(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch order: ${error}`);
    }
  },

  // ============== CREATE OPERATION ==============
  createOrder: async (orderData: OrderCreate): Promise<Order> => {
    try {
      const response = await axiosInstance.post<Order>('/orders', orderData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create order: ${error}`);
    }
  },

  // ============== UPDATE OPERATION ==============
  updateOrder: async (id: number, orderData: Partial<OrderUpdate>): Promise<OrderWithDetails> => {
    try {
      const response = await axiosInstance.patch<OrderWithDetails>(`/orders/${id}`, orderData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update order: ${error}`);
    }
  },

  updateOrderStatus: async (id: number, orderData: OrderUpdate): Promise<Order> => {
    try {
      const response = await axiosInstance.patch<Order>(`/orders/${id}`, orderData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update order: ${error}`);
    }
  },

  // ============== DELETE OPERATION ==============
  deleteOrder: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/orders/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete order: ${error}`);
    }
  },
};
