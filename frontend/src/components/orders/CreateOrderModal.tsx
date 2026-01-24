import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';
import { orderService } from '../../services/orderService';
import type { Product} from '../../types/product';
import type { OrderCreate } from '../../types/order';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderId: number) => void;
}

const CreateOrderModal = ({
  isOpen,
  onClose,
  onOrderCreated,
}: CreateOrderModalProps) => {
  // ============== QUERIES ==============
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(0, 100),
    enabled: isOpen,
  });

  const { data: allProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(0, 100),
    enabled: isOpen,
  });

  const products = allProducts.filter((p) => p.is_active);

  // ============== MUTATION ==============
  const createOrderMutation = useMutation({
    mutationFn: (orderData: OrderCreate) => orderService.createOrder(orderData),
    onSuccess: (createdOrder) => {
      setSuccessMessage(`Order #${createdOrder.id} created successfully!`);
      setTimeout(() => {
        onOrderCreated(createdOrder.id);
        handleClose();
      }, 1500);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    },
  });

  // ============== LOCAL STATE ==============
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [currentProduct, setCurrentProduct] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ============== CART HANDLERS ==============
  const addToCart = () => {
    // Validación: producto y cantidad válidos
    if (!currentProduct || quantity <= 0) {
      setError('Please select a product and enter a valid quantity (greater than 0)');
      return;
    }

    const selectedProduct = products.find((p) => p.id === currentProduct);
    if (!selectedProduct) {
      setError('Product not found');
      return;
    }

    setError(null);

    // Check if product already exists in cart
    const existingItem = cart.find((item) => item.product.id === currentProduct);

    if (existingItem) {
      // Sum quantity if product already exists
      setCart(
        cart.map((item) =>
          item.product.id === currentProduct
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      // Add new item to cart
      setCart([...cart, { product: selectedProduct, quantity }]);
    }

    // Reset form fields
    setCurrentProduct(null);
    setQuantity(1);
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
    setError(null);
  };

  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity reaches 0 or below
      removeFromCart(productId);
    } else {
      // Update quantity
      setCart(
        cart.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  // ============== CALCULATIONS ==============
  const calculateTotal = (): number => {
    return cart.reduce((total, item) => {
      const price =
        typeof item.product.price === 'string'
          ? parseFloat(item.product.price)
          : item.product.price;
      return total + price * item.quantity;
    }, 0);
  };

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const formatCurrency = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return formatPrice(numPrice);
  };

  const getCustomerName = (id: number): string => {
    const customer = customers.find((c) => c.id === id);
    return customer ? `${customer.name} ${customer.last_name}` : 'Unknown';
  };

  // ============== SUBMIT ORDER ==============
  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!customerId || cart.length === 0) {
      setError('Please select a customer and add at least one product to the cart');
      return;
    }

    const orderData: OrderCreate = {
      customer_id: customerId,
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    };

    createOrderMutation.mutate(orderData);
  };

  // ============== CLOSE HANDLER ==============
  const handleClose = () => {
    setCustomerId(null);
    setCurrentProduct(null);
    setQuantity(1);
    setCart([]);
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  // ============== RENDER ==============
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Order">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-none text-green-700 font-medium">
            ✓ {successMessage}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-none text-red-700">
            {error}
          </div>
        )}

        {loadingCustomers || loadingProducts ? (
          <div className="text-center text-gray-600 py-12">
            <div className="text-lg font-semibold mb-2">Loading customers and products...</div>
            <div className="text-sm">Please wait while we fetch the available data</div>
          </div>
        ) : (
          <>
            {/* SECTION 1: CUSTOMER SELECTION */}
            <div className="space-y-3 pb-6 border-b-2 border-gray-300">
              <h3 className="text-sm font-bold text-pwc-black uppercase tracking-wide">
                Step 1: Select Customer
              </h3>
              <select
                value={customerId || ''}
                onChange={(e) => {
                  setCustomerId(Number(e.target.value) || null);
                  setError(null);
                }}
                disabled={createOrderMutation.isPending}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:border-pwc-orange focus:outline-none focus:ring-2 focus:ring-pwc-orange bg-white text-pwc-black font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Select a customer --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.last_name} • {customer.email}
                  </option>
                ))}
              </select>
              {customerId && (
                <div className="bg-orange-50 p-3 border border-orange-200 rounded-none">
                  <p className="text-sm font-semibold text-pwc-black">
                    Selected: {getCustomerName(customerId)}
                  </p>
                </div>
              )}
            </div>

            {/* SECTION 2: ADD PRODUCTS */}
            <div className="space-y-3 pb-6 border-b-2 border-gray-300">
              <h3 className="text-sm font-bold text-pwc-black uppercase tracking-wide">
                Step 2: Add Products
              </h3>

              <div className="space-y-3">
                {/* Product Selector */}
                <div>
                  <label className="block text-xs font-bold text-pwc-black mb-2 uppercase">
                    Product
                  </label>
                  <select
                    value={currentProduct || ''}
                    onChange={(e) => {
                      setCurrentProduct(Number(e.target.value) || null);
                      setError(null);
                    }}
                    disabled={createOrderMutation.isPending || !customerId}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:border-pwc-orange focus:outline-none focus:ring-2 focus:ring-pwc-orange bg-white text-pwc-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!customerId
                        ? '-- Select a customer first --'
                        : '-- Select a product --'}
                    </option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} •{' '}
                        {formatCurrency(product.price)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-xs font-bold text-pwc-black mb-2 uppercase">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setQuantity(isNaN(val) || val < 1 ? 1 : val);
                    }}
                    onFocus={(e) => e.target.select()}
                    disabled={createOrderMutation.isPending}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:border-pwc-orange focus:outline-none focus:ring-2 focus:ring-pwc-orange text-pwc-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Add Button */}
                <Button
                  variant="primary"
                  onClick={addToCart}
                  disabled={createOrderMutation.isPending || !currentProduct || quantity <= 0}
                  className="w-full font-bold"
                >
                  + Add to Cart
                </Button>
              </div>

              {/* Quick Info */}
              {currentProduct && (
                <div className="bg-blue-50 p-3 border border-blue-200 rounded-none">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Tip:</span> Adding the same product
                    again will increase the quantity
                  </p>
                </div>
              )}
            </div>

            {/* SECTION 3: ORDER SUMMARY */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-pwc-black uppercase tracking-wide">
                Step 3: Review Order
              </h3>

              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-none">
                  <p className="font-semibold text-base">Your cart is empty</p>
                  <p className="text-sm mt-1">
                    Add products above to create an order
                  </p>
                </div>
              ) : (
                <>
                  {/* CART TABLE */}
                  <div className="border-2 border-gray-300 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-pwc-orange text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                            Product
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                            Price
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase">
                            Subtotal
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item, index) => {
                          const price =
                            typeof item.product.price === 'string'
                              ? parseFloat(item.product.price)
                              : item.product.price;
                          const subtotal = price * item.quantity;

                          return (
                            <tr
                              key={item.product.id}
                              className={`border-b border-gray-300 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-orange-50'
                              }`}
                            >
                              <td className="px-4 py-3 text-sm font-medium text-pwc-black">
                                {item.product.name}
                              </td>
                              <td className="px-4 py-3 text-sm text-center text-gray-700">
                                {formatPrice(price)}
                              </td>
                              <td className="px-4 py-3 text-sm text-center font-semibold text-pwc-black">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() =>
                                      updateCartItemQuantity(
                                        item.product.id,
                                        item.quantity - 1
                                      )
                                    }
                                    disabled={createOrderMutation.isPending}
                                    className="w-6 h-6 flex items-center justify-center border border-gray-300 hover:bg-red-100 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-gray-600"
                                    title="Decrease quantity"
                                  >
                                    −
                                  </button>
                                  <span className="w-8 text-center font-semibold">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateCartItemQuantity(
                                        item.product.id,
                                        item.quantity + 1
                                      )
                                    }
                                    disabled={createOrderMutation.isPending}
                                    className="w-6 h-6 flex items-center justify-center border border-gray-300 hover:bg-pwc-orange hover:text-white hover:border-pwc-orange disabled:opacity-50 disabled:cursor-not-allowed font-bold text-pwc-orange"
                                    title="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-bold text-pwc-orange">
                                {formatPrice(subtotal)}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <button
                                  onClick={() => removeFromCart(item.product.id)}
                                  disabled={createOrderMutation.isPending}
                                  className="text-red-600 hover:text-red-800 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase"
                                  title="Remove from cart"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* TOTAL BOX */}
                  <div className="bg-gradient-to-r from-pwc-orange to-orange-600 text-white p-4 border-2 border-pwc-orange rounded-none flex justify-between items-center shadow-sm">
                    <span className="text-lg font-bold">Order Total:</span>
                    <span className="text-3xl font-bold">
                      {formatPrice(calculateTotal())}
                    </span>
                  </div>

                  {/* ORDER DETAILS */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-300 rounded-none">
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase mb-1">
                        Items Count
                      </p>
                      <p className="text-2xl font-bold text-pwc-black">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase mb-1">
                        Product Lines
                      </p>
                      <p className="text-2xl font-bold text-pwc-black">{cart.length}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-300">
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={createOrderMutation.isPending}
                className="font-bold"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={
                  createOrderMutation.isPending ||
                  !customerId ||
                  cart.length === 0
                }
                className="font-bold"
              >
                {createOrderMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : (
                  'Confirm & Create Order'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CreateOrderModal;
