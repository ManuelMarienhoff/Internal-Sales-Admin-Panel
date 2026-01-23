import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout><Dashboard /></Layout>} path="/" />
        <Route element={<Layout><Products /></Layout>} path="/products" />
        <Route element={<Layout><Customers /></Layout>} path="/customers" />
        <Route element={<Layout><Orders /></Layout>} path="/orders" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;