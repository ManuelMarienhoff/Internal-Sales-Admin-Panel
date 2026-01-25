import axiosInstance from '../api/axios';
import type { Product, ProductCreate, ProductUpdate } from '../types/product';
import type { PaginatedResponse } from '../types/pagination';

export const productService = {
  // ============== READ OPERATIONS ==============
  getProducts: async (skip: number = 0, limit: number = 10, search?: string, isActive?: boolean): Promise<PaginatedResponse<Product>> => {
    try {
      const response = await axiosInstance.get<PaginatedResponse<Product>>('/products', {
        params: {
          skip,
          limit,
          ...(search && { search }),
          ...(isActive !== undefined ? { is_active: isActive } : {}),
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

  // ============== CREATE OPERATION ==============
  createProduct: async (productData: ProductCreate): Promise<Product> => {
    try {
      const response = await axiosInstance.post<Product>('/products', productData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create product: ${error}`);
    }
  },

  // ============== UPDATE OPERATION ==============
  updateProduct: async (id: number, productData: ProductUpdate): Promise<Product> => {
    try {
      const response = await axiosInstance.patch<Product>(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update product: ${error}`);
    }
  },

  // ============== DELETE OPERATION ==============
  deleteProduct: async (id: number): Promise<{ action: 'deleted' | 'deactivated'; message: string; affected_draft_orders: number[] }> => {
    try {
      const response = await axiosInstance.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete product: ${error}`);
    }
  },
};
