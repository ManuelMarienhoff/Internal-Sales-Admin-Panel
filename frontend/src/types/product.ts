export interface Product {
  id: number;
  name: string;
  description?: string;
  price: string | number;
  is_active: boolean;
  created_at: string;
}
