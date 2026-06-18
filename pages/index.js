import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'niños', label: 'Niños' },
  { id: 'hombres', label: 'Hombres' },
  { id: 'mujeres', label: 'Mujeres' },
  { id: 'electrodomesticos', label: 'Electrodomésticos' },
  { id: 'hogar', label: 'Hogar' }
];

function formatPrice(value) {
  return `$${Number(value).toLocaleString('es-CO')}`;
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authGateActive, setAuthGateActive] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [message, setMessage] = useState('');
  const [orders, setOrders] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => activeCategory === 'all' || product.category === activeCategory);
  }, [products, activeCategory]);

  const cartCount = cart.reduce((sum, product) => sum + product.quantity, 0);
  const cartTotal = cart.reduce((sum, product) => sum + product.quantity * product.price, 0);
  const canSeeAllOrders = ['admin', 'dueno', 'dueño'].includes(String(currentUser?.role || '').trim().toLowerCase());

  useEffect(() => {
    if (!googleClientId || typeof window === 'undefined') return;

    const scriptId = 'google-identity-client';
    if (document.getElementById(scriptId)) {
      setGoogleLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.id = scriptId;
    script.onload = () => setGoogleLoaded(true);
    document.body.appendChild(script);

    return () => {
      const loadedScript = document.getElementById(scriptId);
      if (loadedScript) {
        document.body.removeChild(loadedScript);
      }
    };
  }, [googleClientId]);

  useEffect(() => {
    if (!googleLoaded || !showAuth || !window.google?.accounts?.id) return;
    const container = document.getElementById('google-signin-button');
    if (!container) return;

    container.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredentialResponse
    });
    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text: 'signin_with'
    });
    window.google.accounts.id.prompt();
  }, [googleLoaded, showAuth, googleClientId]);

  async function handleGoogleCredentialResponse(response) {
    if (!response?.credential) {
      showToast('No se pudo iniciar sesión con Google.');
      return;
    }

    const googleRes = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: response.credential })
    });
    const data = await googleRes.json();

    if (!googleRes.ok) {
      showToast(data.error || 'Error al iniciar sesión con Google');
      return;
    }

    setCurrentUser(data);
    setAuthGateActive(false);
    setShowAuth(false);
    setMobileMenuOpen(false);
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
    setAuthAddress('');
    setAuthPhone('');
    fetchOrders(data);
    showToast(`Bienvenido, ${data.name}`);
  }

  useEffect(() => {
    fetchProducts();
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('saemi-current-user') : null;
    const savedCart = typeof window !== 'undefined' ? localStorage.getItem('saemi-cart') : null;
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
      setAuthGateActive(false);
      fetchOrders(parsedUser);
    } else {
      setShowAuth(true);
      setAuthGateActive(true);
    }
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('saemi-cart', JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentUser) {
        localStorage.setItem('saemi-current-user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('saemi-current-user');
      }
    }
  }, [currentUser]);

  function showToast(text) {
    setMessage(text);
    window.clearTimeout(window.toastTimeout);
    window.toastTimeout = window.setTimeout(() => setMessage(''), 2500);
  }

  async function fetchProducts() {
    const response = await fetch('/api/products');
    const data = await response.json();
    setProducts(data);
  }

  async function fetchOrders(user = currentUser) {
    if (!user?.id) {
      setOrders([]);
      return;
    }

    const params = new URLSearchParams({
      userId: user.id,
      role: user.role || 'cliente'
    });
    const response = await fetch(`/api/orders?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      setOrders(data);
    }
  }

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { ...product, quantity: 1 }];
    });
    showToast('Producto agregado al carrito.');
  };

  const changeQuantity = (id, delta) => {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const handleLogin = async () => {
  if (!authEmail.trim() || !authPassword.trim()) {
    showToast('Ingresa correo y contraseña.');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: authEmail,
        password: authPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.error || 'Error al iniciar sesión');
      return;
    }

    setCurrentUser(data);
    setAuthGateActive(false);
    setShowAuth(false);
    setMobileMenuOpen(false);
    setAuthPassword('');

    showToast(`Bienvenido de nuevo, ${data.name}`);

    fetchOrders(data);
  } catch (error) {
    console.error(error);
    showToast('No se pudo conectar con el servidor');
  }
};

  const handleRegister = async () => {
    if (!authName.trim() || !authEmail.trim() || !authPassword.trim() || !authAddress.trim() || !authPhone.trim()) {
      showToast('Completa todos los campos para registrarte.');
      return;
    }
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: authName, email: authEmail, password: authPassword, address: authAddress, phone: authPhone })
    });
    const body = await response.json();
    if (!response.ok) {
      showToast(body.error || 'No fue posible registrar la cuenta');
      return;
    }
    setCurrentUser(body);
    setAuthGateActive(false);
    setShowAuth(false);
    setMobileMenuOpen(false);
    setAuthPassword('');
    showToast('Cuenta creada correctamente.');
    fetchOrders(body);
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      setShowAuth(true);
      showToast('Debes iniciar sesión para finalizar la compra.');
      return;
    }
    if (!cart.length) {
      showToast('El carrito está vacío.');
      return;
    }

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: currentUser, items: cart, total: cartTotal, address: currentUser.address })
    });
    const body = await response.json();
    if (!response.ok) {
      showToast(body.error || 'Error al crear el pedido');
      return;
    }
    setCart([]);
    fetchOrders(currentUser);
    showToast('Pedido creado correctamente.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setOrders([]);
    setAuthGateActive(true);
    setShowAuth(true);
    showToast('Has cerrado sesión.');
    setMobileMenuOpen(false);
  };

  return (
    <>
      <Head>
        <title>Saemi Variedades</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <header className="site-header">
        <div className="brand-row">
          <div className="logo-wrap">
            <img src="/img/logo.png" alt="Logo Saemi Variedades" className="logo" />
            <div>
              <h1>Saemi Variedades</h1>
              <p>Lo que buscas, aquí lo encuentras</p>
            </div>
          </div>
          <button className="hamburger" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Menú">
            ☰
          </button>
          <div className="header-actions">
            <button className="cart-button" onClick={() => setMobileMenuOpen(false)}>
              Carrito <span className="badge">{cartCount}</span>
            </button>
            <div className="auth-area">
              <span className="welcome-text">{currentUser ? `${currentUser.name} (${currentUser.role})` : 'Inicia sesión para pedir'}</span>
              {currentUser ? (
                <button className="auth-button" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              ) : (
                <button className="auth-button" onClick={() => setShowAuth(true)}>
                  Acceder
                </button>
              )}
            </div>
          </div>
        </div>
        <nav className={`main-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`nav-link ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(category.id);
                setMobileMenuOpen(false);
              }}
            >
              {category.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <h2>Bienvenido a Saemi Variedades</h2>
            <p>Encuentra una gran variedad de productos para toda la familia y paga con Nequi o Visa.</p>
          </div>
        </section>

        <section className="products-section">
          <div className="section-header">
            <h3>Productos destacados</h3>
            <p>Selecciona una categoría para filtrar los productos.</p>
          </div>
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card">
                <img src={product.image} alt={product.name} />
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="price">{formatPrice(product.price)}</p>
                  <div className="button-row">
                    <button className="primary-button" onClick={() => addToCart(product)}>
                      Agregar al carrito
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {filteredProducts.length === 0 && <p className="empty-message">No hay productos en esta categoría.</p>}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h3>Tu carrito</h3>
            <p>Revisa tus productos antes de finalizar el pedido.</p>
          </div>
          <div className="dashboard-grid">
            <div className="panel card">
              <div className="panel-header">
                <h4>Carrito</h4>
              </div>
              <div className="panel-content">
                {cart.length === 0 ? (
                  <p className="empty-message">No has agregado productos aún.</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div>
                        <h5>{item.name}</h5>
                        <p>{formatPrice(item.price)} x {item.quantity}</p>
                      </div>
                      <div className="item-controls">
                        <button onClick={() => changeQuantity(item.id, -1)}>-</button>
                        <button onClick={() => changeQuantity(item.id, 1)}>+</button>
                        <button onClick={() => removeFromCart(item.id)}>x</button>
                      </div>
                    </div>
                  ))
                )}
                <div className="cart-total">
                  <span>Total</span>
                  <strong>{formatPrice(cartTotal)}</strong>
                </div>
                {!currentUser && <p className="cart-warning">Debes iniciar sesión o registrarte para finalizar tu compra.</p>}
                <button className={`checkout-button ${currentUser && cart.length ? 'enabled' : ''}`} onClick={handleCheckout} disabled={!currentUser || !cart.length}>
                  Finalizar compra
                </button>
              </div>
            </div>
            <div className="panel card">
              <div className="panel-header">
                <h4>{canSeeAllOrders ? 'Pedidos pendientes' : 'Mis pedidos'}</h4>
              </div>
              <div className="panel-content">
                {orders.length === 0 ? (
                  <p className="empty-message">Aún no hay pedidos registrados.</p>
                ) : (
                  orders.slice().reverse().map((order) => (
                    <div key={order.id} className="order-item">
                      <h5>Pedido #{order.id}</h5>
                      <p><strong>Cliente:</strong> {order.user.name}</p>
                      <p><strong>Dirección:</strong> {order.address}</p>
                      <p><strong>Total:</strong> {formatPrice(order.total)}</p>
                      <p><strong>Estado:</strong> {order.status}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {showAuth && (
        <div className="modal">
          <div className="modal-content">
            {!authGateActive && <button className="close-modal" onClick={() => setShowAuth(false)}>×</button>}
            <h3>{authMode === 'login' ? 'Iniciar sesión' : 'Registrarse'}</h3>
            <div className="modal-tabs">
              <button className={`tab ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>Login</button>
              <button className={`tab ${authMode === 'register' ? 'active' : ''}`} onClick={() => setAuthMode('register')}>Registrarse</button>
            </div>

            <div className="google-auth">
              {googleClientId ? (
                <>
                  <div id="google-signin-button" />
                  <p className="small-text">Usa tu cuenta de Google para iniciar sesión sin escribir el correo.</p>
                </>
              ) : (
                <p className="small-text">Configura <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> en .env.local para habilitar acceso con Google.</p>
              )}
            </div>

            {authMode === 'login' ? (
              <div className="tab-panel">
                <label htmlFor="loginEmail">Correo electrónico</label>
                <input id="loginEmail" type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="usuario@ejemplo.com" />

                <label htmlFor="loginPassword">Contraseña</label>
                <input id="loginPassword" type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="********" /> 
                <button className="primary-button" onClick={handleLogin}>Iniciar sesión</button>
              </div>
            ) : (
              <div className="tab-panel">
                <label htmlFor="registerName">Nombre completo</label>
                <input id="registerName" type="text" value={authName} onChange={(event) => setAuthName(event.target.value)} />
                <label htmlFor="registerAddress">Dirección de entrega</label>
                <input id="registerAddress" type="text" value={authAddress} onChange={(event) => setAuthAddress(event.target.value)} />
                <label htmlFor="registerPhone">Número de teléfono</label>
                <input id="registerPhone" type="tel" value={authPhone} onChange={(event) => setAuthPhone(event.target.value)} />
                <label htmlFor="registerEmail">Correo electrónico</label>
                <input id="registerEmail" type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} />
                <label htmlFor="registerPassword">Contraseña</label>
                <input id="registerPassword" type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="********" />
                <button className="primary-button" onClick={handleRegister}>Registrar cuenta</button>
              </div>
            )}
          </div>
          <div className="overlay visible" onClick={() => { if (!authGateActive) setShowAuth(false); }} />
        </div>
      )}

      <div className={`toast ${message ? 'visible' : ''}`}>{message}</div>
    </>
  );
}
