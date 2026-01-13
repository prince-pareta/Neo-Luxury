import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Feather, ShoppingBag, User, BarChart2, Package, X, Check, Menu } from 'lucide-react'; // Install: npm install lucide-react

// --- CONTEXT: App State Management ---
const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // Real-time Database Listener
  useEffect(() => {
    const unsubProd = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy('date', 'desc')), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubProd(); unsubOrders(); };
  }, []);

  const addToCart = (product) => {
    setCart([...cart, product]);
    setIsCartOpen(true);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const getCartTotal = () => cart.reduce((total, item) => total + Number(item.price), 0);

  return (
    <AppContext.Provider value={{ cart, addToCart, removeFromCart, isCartOpen, setIsCartOpen, products, orders, getCartTotal, setCart }}>
      {children}
    </AppContext.Provider>
  );
};

// --- COMPONENTS ---

// 1. Navigation (Glassmorphism)
const Navbar = () => {
  const { cart, setIsCartOpen } = useContext(AppContext);
  return (
    <nav className="glass-panel" style={{ position: 'fixed', top: 0, width: '100%', padding: '20px 40px', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '-1px' }}>JAI <span style={{ color: 'var(--gold)' }}>2026</span></div>
      </Link>
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '14px', textTransform: 'uppercase' }}>Collections</Link>
        <Link to="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '12px' }}>ADMIN AREA</Link>
        <div onClick={() => setIsCartOpen(true)} style={{ position: 'relative', cursor: 'pointer' }}>
          <ShoppingBag size={20} />
          {cart.length > 0 && <span style={{ position: 'absolute', top: -8, right: -8, background: 'var(--gold)', color: 'black', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>{cart.length}</span>}
        </div>
      </div>
    </nav>
  );
};

// 2. Hero Section
const Hero = () => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, #1a1a1a 0%, #000 70%)', zIndex: -1 }}></div>
    <div style={{ textAlign: 'center', zIndex: 2 }}>
      <h1 className="animate-float" style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '20px', background: 'linear-gradient(to right, #fff, #888)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
        Future of<br /><span style={{ fontStyle: 'italic', color: 'var(--gold)', WebkitTextFillColor: 'var(--gold)' }}>Luxury</span>
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px', letterSpacing: '2px' }}>SPRING / SUMMER 2026</p>
      <button className="neo-btn" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>Explore Drop</button>
    </div>
  </div>
);

// 3. Product Store
const Store = () => {
  const { products, addToCart } = useContext(AppContext);
  return (
    <div style={{ padding: '100px 5%' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '50px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>Latest Arrivals</h2>
      <div className="grid-layout">
        {products.map(p => (
          <div key={p.id} style={{ position: 'relative', group: 'hover' }}>
            <div style={{ aspectRatio: '3/4', background: '#111', overflow: 'hidden', marginBottom: '15px' }}>
              <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9, transition: '0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '5px' }}>{p.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{p.category}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--gold)', fontWeight: '600' }}>₹{p.price}</div>
                <button onClick={() => addToCart(p)} style={{ marginTop: '10px', background: 'transparent', border: '1px solid white', color: 'white', padding: '5px 15px', cursor: 'pointer', fontSize: '10px', textTransform: 'uppercase' }}>Add +</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. Smart Cart Sidebar
const CartSidebar = () => {
  const { isCartOpen, setIsCartOpen, cart, removeFromCart, getCartTotal } = useContext(AppContext);
  const navigate = useNavigate();

  return (
    <div style={{ position: 'fixed', top: 0, right: isCartOpen ? 0 : '-400px', width: '400px', height: '100%', background: '#0a0a0a', borderLeft: '1px solid var(--border)', transition: '0.4s', zIndex: 200, padding: '30px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h2>Your Bag</h2>
        <X onClick={() => setIsCartOpen(false)} style={{ cursor: 'pointer' }} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {cart.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '15px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #222' }}>
            <img src={item.image} style={{ width: '60px', height: '80px', objectFit: 'cover' }} />
            <div>
              <h4>{item.name}</h4>
              <p style={{ color: 'var(--gold)' }}>₹{item.price}</p>
              <button onClick={() => removeFromCart(idx)} style={{ fontSize: '10px', background: 'none', border: 'none', color: '#666', marginTop: '5px', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ paddingTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '18px' }}>
          <span>Total</span>
          <span>₹{getCartTotal()}</span>
        </div>
        <button className="neo-btn" style={{ width: '100%' }} onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}>Checkout Securely</button>
      </div>
    </div>
  );
};

// 5. Multi-Step Checkout
const Checkout = () => {
  const { cart, getCartTotal, setCart } = useContext(AppContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const order = {
      customer: { name: formData.get('name'), phone: formData.get('phone'), address: formData.get('address') },
      items: cart,
      total: getCartTotal(),
      date: new Date().toISOString(),
      status: 'Processing'
    };
    
    await addDoc(collection(db, 'orders'), order);
    setCart([]);
    setLoading(false);
    alert('Order Placed! ID: #JAI-' + Math.floor(Math.random() * 1000));
    navigate('/');
  };

  return (
    <div style={{ padding: '120px 20px', display: 'flex', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '40px' }}>
        <h2 style={{ marginBottom: '30px' }}>Secure Checkout</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px', textTransform: 'uppercase' }}>Contact Info</label>
            <input name="name" className="neo-input" placeholder="Full Name" required style={{ marginBottom: '10px' }} />
            <input name="phone" className="neo-input" placeholder="Phone Number" required />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px', textTransform: 'uppercase' }}>Shipping Address</label>
            <textarea name="address" className="neo-input" rows="3" placeholder="Full Address" required></textarea>
          </div>
          <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Amount</span>
            <span style={{ color: 'var(--gold)', fontSize: '20px' }}>₹{getCartTotal()}</span>
          </div>
          <button className="neo-btn" style={{ width: '100%' }} disabled={loading}>{loading ? 'Processing...' : 'Confirm Order'}</button>
        </form>
      </div>
    </div>
  );
};

// 6. Pro Admin Dashboard
const Admin = () => {
  const { orders, products } = useContext(AppContext);
  const [view, setView] = useState('dashboard');
  
  // Fake Chart Visual
  const ChartBar = ({ h }) => <div style={{ width: '10px', height: h, background: 'var(--gold)', borderRadius: '5px', opacity: 0.7 }}></div>;

  const addProduct = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await addDoc(collection(db, 'products'), {
      name: fd.get('name'), price: fd.get('price'), category: fd.get('cat'), image: 'https://source.unsplash.com/random/400x500/?fashion' // Auto image for demo
    });
    alert('Product Added');
  };

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, 'orders', id), { status });
  };

  return (
    <div className="admin-grid">
      <div style={{ borderRight: '1px solid var(--border)', padding: '20px' }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '40px' }}>JAI ADMIN.</div>
        <div onClick={() => setView('dashboard')} style={{ padding: '15px', cursor: 'pointer', background: view==='dashboard'?'#222':'transparent', borderRadius: '8px', marginBottom: '5px' }}>Dashboard</div>
        <div onClick={() => setView('orders')} style={{ padding: '15px', cursor: 'pointer', background: view==='orders'?'#222':'transparent', borderRadius: '8px', marginBottom: '5px' }}>Orders ({orders.length})</div>
        <div onClick={() => setView('products')} style={{ padding: '15px', cursor: 'pointer', background: view==='products'?'#222':'transparent', borderRadius: '8px' }}>Catalogue</div>
      </div>

      <div style={{ padding: '40px', overflowY: 'auto' }}>
        {view === 'dashboard' && (
          <div>
            <h2 style={{ marginBottom: '30px' }}>Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ color: '#888', fontSize: '12px' }}>TOTAL REVENUE</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>₹{orders.reduce((a,b) => a + Number(b.total), 0)}</div>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ color: '#888', fontSize: '12px' }}>PENDING ORDERS</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{orders.filter(o=>o.status==='Processing').length}</div>
              </div>
            </div>
            
            <div className="glass-panel" style={{ padding: '30px' }}>
              <h3>Sales Activity</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', height: '100px', marginTop: '20px' }}>
                <ChartBar h="40%" /><ChartBar h="60%" /><ChartBar h="30%" /><ChartBar h="80%" /><ChartBar h="50%" /><ChartBar h="90%" /><ChartBar h="70%" />
              </div>
            </div>
          </div>
        )}

        {view === 'orders' && (
          <div>
            <h2>Active Orders</h2>
            <div style={{ marginTop: '20px' }}>
              {orders.map(o => (
                <div key={o.id} className="glass-panel" style={{ padding: '20px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{o.customer.name}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{o.items.length} Items | ₹{o.total}</div>
                  </div>
                  <div>
                    <span style={{ padding: '5px 10px', background: o.status==='Shipped'?'green':'#333', borderRadius: '4px', fontSize: '12px', marginRight: '10px' }}>{o.status}</span>
                    {o.status !== 'Shipped' && <button onClick={() => updateStatus(o.id, 'Shipped')} style={{ padding: '5px 10px', cursor: 'pointer' }}>Mark Shipped</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'products' && (
          <div>
            <h2>Product Management</h2>
            <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
              <h4>Add New Product</h4>
              <form onSubmit={addProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <input name="name" className="neo-input" placeholder="Product Name" required />
                <input name="cat" className="neo-input" placeholder="Category (Men/Women)" required />
                <input name="price" className="neo-input" type="number" placeholder="Price" required />
                <button className="neo-btn">Publish Item</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP WRAPPER ---
function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<><Navbar /><Hero /><Store /><CartSidebar /></>} />
            <Route path="/checkout" element={<><Navbar /><Checkout /></>} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
