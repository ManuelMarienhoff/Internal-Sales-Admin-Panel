// ============== PRODUCT CREATE PAYLOAD ==============
// Sent to backend when creating a new product
export interface ProductCreate {
  name: string;
  service_line: string;
  description?: string;
  price: number;
  is_active?: boolean;
}

// ============== PRODUCT UPDATE PAYLOAD ==============
// Sent to backend when updating an existing product
export interface ProductUpdate {
  name?: string;
  service_line?: string;
  description?: string;
  price?: number;
  is_active?: boolean;
}

// ============== PRODUCT RESPONSE ==============
// Received from backend in API responses
export interface Product extends ProductCreate {
  id: number;
  created_at: string;
}
