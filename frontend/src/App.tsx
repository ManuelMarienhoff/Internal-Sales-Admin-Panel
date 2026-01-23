import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout><Dashboard /></Layout>} path="/" />
        <Route element={<Layout><Products /></Layout>} path="/products" />
        <Route element={<Layout><div className="p-12"><h2 className="text-3xl font-serif">Customers</h2></div></Layout>} path="/customers" />
        <Route element={<Layout><div className="p-12"><h2 className="text-3xl font-serif">Orders</h2></div></Layout>} path="/orders" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;