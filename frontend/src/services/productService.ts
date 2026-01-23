import axiosInstance from '../api/axios';
import type { Product } from '../types/product';

export const productService = {
  getProducts: async (skip: number = 0, limit: number = 10): Promise<Product[]> => {
    try {
      const response = await axiosInstance.get<Product[]>('/products', {
        params: {
          skip,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error}`);
    }
  },

  getProductById: async (id: number): Promise<Product> => {
    try {
      const response = await axiosInstance.get<Product>(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch product: ${error}`);
    }
  },
};
