export interface Order {
  id: number;
  customer_id: number;
  status: 'draft' | 'confirmed' | 'completed';
  total_amount: string | number;
  created_at: string;
}
