import type { Product } from './product';
import type { Customer } from './customer';

// ============== ORDER ITEM CREATE PAYLOAD ==============
// Item definition when creating an order
export interface OrderItemCreate {
  product_id: number;
  quantity: number;
}

// ============== ORDER ITEM RESPONSE ==============
// OrderItem received from backend with complete product info
export interface OrderItem extends OrderItemCreate {
  id: number;
  order_id: number;
  unit_price: number | string;
  created_at: string;
  product: Product;
}

// ============== ORDER CREATE PAYLOAD ==============
// Sent to backend when creating a new order
export interface OrderCreate {
  customer_id: number;
  items: OrderItemCreate[];
}

// ============== ORDER UPDATE PAYLOAD ==============
// Sent to backend when updating an order (status or items)
export interface OrderUpdate {
  status?: 'draft' | 'confirmed' | 'completed';
  items?: OrderItemCreate[];
}

// ============== ORDER RESPONSE ==============
// Basic order info received from backend
export interface Order extends OrderCreate {
  id: number;
  status: 'draft' | 'confirmed' | 'completed';
  total_amount: number | string;
  created_at: string;
}

// ============== ORDER WITH DETAILS ==============
// Complete order with customer and all item details
export interface OrderWithDetails extends Order {
  customer: Customer;
  items: OrderItem[];
}
