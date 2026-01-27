import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';
import { orderService } from '../../services/orderService';
import type { Product } from '../../types/product';
import type { OrderCreate } from '../../types/order';
import type { Customer } from '../../types/customer';
import type { PaginatedResponse } from '../../types/pagination';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

// Refactor B2B: CartItem ya no tiene cantidad, es un servicio único.
interface CartItem {
  product: Product;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderId: number) => void;
  initialData?: { orderId: number; customerId: number; items: CartItem[] };
  isEditMode?: boolean;
}

const CreateOrderModal = ({
  isOpen,
  onClose,
  onOrderCreated,
  initialData,
  isEditMode = false,
}: CreateOrderModalProps) => {
  // ============== QUERIES ==============
  const { data: customersData, isLoading: loadingCustomers } = useQuery<PaginatedResponse<Customer>>({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(0, 100), // Traemos suficientes para el select
    enabled: isOpen,
  });

  const { data: productsData, isLoading: loadingProducts } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(0, 100),
    enabled: isOpen,
  });

  const customers = customersData?.items ?? [];
  const allProducts = productsData?.items ?? [];
  const products = allProducts.filter((p) => p.is_active);

  // ============== MUTATION ==============
  const createOrderMutation = useMutation({
    mutationFn: (orderData: OrderCreate) => orderService.createOrder(orderData),
    onSuccess: (createdOrder) => {
      setSuccessMessage(`Engagement #${createdOrder.id} created successfully!`);
      setTimeout(() => {
        onOrderCreated(createdOrder.id);
        handleClose();
      }, 1500);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: (orderData: OrderCreate) =>
      orderService.updateOrder(initialData?.orderId || 0, { items: orderData.items }),
    onSuccess: (updatedOrder) => {
      setSuccessMessage(`Engagement #${updatedOrder.id} updated successfully!`);
      setTimeout(() => {
        onOrderCreated(updatedOrder.id);
        handleClose();
      }, 1500);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    },
  });

  // ============== LOCAL STATE ==============
  const [customerId, setCustomerId] = useState<number | null>(initialData?.customerId || null);
  const [currentProduct, setCurrentProduct] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>(initialData?.items || []);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ============== SUBMISSION GUARD: Prevent Double Submit ==============
  const isSubmittingOrSuccess = 
    createOrderMutation.isPending || 
    createOrderMutation.isSuccess || 
    updateOrderMutation.isPending || 
    updateOrderMutation.isSuccess;

  // ============== CART HANDLERS (B2B Logic) ==============
  const addToCart = () => {
    if (!currentProduct) {
      setError('Please select a service to add');
      return;
    }

    const selectedProduct = products.find((p) => p.id === currentProduct);
    if (!selectedProduct) {
      setError('Product not found');
      return;
    }

    // Validación B2B: No duplicados. Un contrato tiene un servicio una sola vez.
    const alreadyInCart = cart.some((item) => item.product.id === currentProduct);
    if (alreadyInCart) {
      setError('This service is already included in this engagement.');
      return;
    }

    setError(null);
    setCart([...cart, { product: selectedProduct }]);
    setCurrentProduct(null); // Reset select
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
    setError(null);
  };

  // ============== CALCULATIONS ==============
  const calculateTotal = (): number => {
    return cart.reduce((total, item) => {
      const price = typeof item.product.price === 'string' 
        ? parseFloat(item.product.price) 
        : item.product.price;
      return total + price;
    }, 0);
  };

  const formatPrice = (price: number): string => `$${price.toFixed(2)}`;

  const formatCurrency = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return formatPrice(numPrice);
  };

  // ============== SUBMIT ORDER ==============
  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!customerId || cart.length === 0) {
      setError('Please select a client and add at least one service');
      return;
    }

    // Mapeo simple: Solo Product ID, sin cantidades
    const orderData: OrderCreate = {
      customer_id: customerId,
      items: cart.map((item) => ({ 
        product_id: item.product.id 
      })),
    };

    if (isEditMode && initialData) {
      updateOrderMutation.mutate(orderData);
    } else {
      createOrderMutation.mutate(orderData);
    }
  };

  // ============== CLOSE HANDLER ==============
  const handleClose = () => {
    if (!isEditMode) {
      setCustomerId(null);
      setCart([]);
    }
    setCurrentProduct(null);
    setError(null);
    setSuccessMessage(null);
    // FIX: Reset React Query mutation states to prevent isSuccess persisting
    createOrderMutation.reset();
    updateOrderMutation.reset();
    onClose();
  };

  const modalTitle = isEditMode ? `Edit Engagement #${initialData?.orderId}` : 'Create New Engagement';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle}>
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        {/* MESSAGES */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 font-medium">
            ✓ {successMessage}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {loadingCustomers || loadingProducts ? (
          <div className="text-center text-gray-600 py-12">
            Loading data...
          </div>
        ) : (
          <>
            {/* STEP 1: CUSTOMER */}
            <div className="space-y-3 pb-6 border-b border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Step 1: Select Client
              </h3>
              <select
                value={customerId || ''}
                onChange={(e) => {
                  setCustomerId(Number(e.target.value) || null);
                  setError(null);
                }}
                disabled={isSubmittingOrSuccess || isEditMode}
                className="w-full px-4 py-2 border border-gray-300 focus:border-pwc-orange focus:ring-1 focus:ring-pwc-orange bg-white"
              >
                <option value="">-- Select Client Company --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name} | {customer.industry} ({customer.name} {customer.last_name})
                  </option>
                ))}
              </select>
            </div>

            {/* STEP 2: ADD SERVICES */}
            <div className="space-y-3 pb-6 border-b border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Step 2: Add Services
              </h3>
              <div className="flex gap-2">
                <select
                  value={currentProduct || ''}
                  onChange={(e) => {
                    setCurrentProduct(Number(e.target.value) || null);
                    setError(null);
                  }}
                  disabled={!customerId || isSubmittingOrSuccess}
                  className="flex-1 px-4 py-2 border border-gray-300 focus:border-pwc-orange focus:ring-1 focus:ring-pwc-orange bg-white"
                >
                  <option value="">-- Select Professional Service --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} [{product.service_line}] - {formatCurrency(product.price)}
                    </option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  onClick={addToCart}
                  disabled={!currentProduct || isSubmittingOrSuccess}
                >
                  Add Service
                </Button>
              </div>
            </div>

            {/* STEP 3: SUMMARY TABLE (No Quantity) */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Step 3: Selected Services
              </h3>
              
              {cart.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 text-gray-500">
                  No services added yet.
                </div>
              ) : (
                <div className="border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left">Service</th>
                        <th className="px-4 py-2 text-right">Fee</th>
                        <th className="px-4 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.product.id} className="border-t border-gray-200">
                          <td className="px-4 py-2 font-medium">
                            {item.product.name}
                            <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-1 rounded">
                              {item.product.service_line}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            {formatCurrency(item.product.price)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              disabled={isSubmittingOrSuccess}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td className="px-4 py-3 text-right">Total Contract Value:</td>
                        <td className="px-4 py-3 text-right text-pwc-orange text-lg">
                          {formatPrice(calculateTotal())}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmittingOrSuccess}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!customerId || cart.length === 0 || isSubmittingOrSuccess}
              >
                {createOrderMutation.isSuccess || updateOrderMutation.isSuccess
                  ? 'Done! Redirecting...'
                  : createOrderMutation.isPending || updateOrderMutation.isPending
                    ? 'Processing...'
                    : 'Create Engagement'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CreateOrderModal;