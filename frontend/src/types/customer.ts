import type { Order } from './order';

// ============== CUSTOMER CREATE PAYLOAD ==============
// Sent to backend when creating a new customer
export interface CustomerCreate {
  name: string;
  last_name: string;
  email: string;
}

// ============== CUSTOMER UPDATE PAYLOAD ==============
// Sent to backend when updating an existing customer
export interface CustomerUpdate {
  name?: string;
  last_name?: string;
  email?: string;
}

// ============== CUSTOMER RESPONSE ==============
// Received from backend in API responses
export interface Customer extends CustomerCreate {
  id: number;
  created_at: string;
}

// ============== CUSTOMER WITH ORDERS ==============
// Customer with complete order history
// Note: Order type is defined in order.ts to avoid circular dependencies
export interface CustomerWithOrders extends Customer {
  orders: Order[];
}
