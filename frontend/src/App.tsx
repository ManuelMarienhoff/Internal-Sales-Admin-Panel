import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout><Dashboard /></Layout>} path="/" />
        <Route element={<Layout><Products /></Layout>} path="/products" />
        <Route element={<Layout><ProductDetail /></Layout>} path="/products/:id" />
        <Route element={<Layout><Customers /></Layout>} path="/customers" />
        <Route element={<Layout><CustomerDetail /></Layout>} path="/customers/:id" />
        <Route element={<Layout><Orders /></Layout>} path="/orders" />
        <Route element={<Layout><OrderDetail /></Layout>} path="/orders/:id" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;