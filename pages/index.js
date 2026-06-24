import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'ninos', label: 'Niños' },
  { id: 'hombres', label: 'Hombres' },
  { id: 'mujeres', label: 'Mujeres' },
  { id: 'electrodomesticos', label: 'Electrodomésticos' },
  { id: 'hogar', label: 'Hogar' }
];

const emptyProductForm = {
  name: '',
  price: '',
  category: 'mujeres',
  image: ''
};

function formatPrice(value) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

function normalizeRole(role) {
  return String(role || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeCategory(category) {
  return String(category || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ÃƒÂ±|Ã±|ãƒâ±|ã±|ñ/g, 'n');
}

function readJsonStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw || raw === 'null' || raw === 'undefined') return fallback;
    return JSON.parse(raw) || fallback;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
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
  const [message, setMessage] = useState('');
  const [orders, setOrders] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(emptyProductForm);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const role = normalizeRole(currentUser?.role);
  const canManageProducts = ['admin', 'dueno'].includes(role);
  const canSeeAllOrders = canManageProducts;
  const isAdmin = role === 'admin';

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (activeCategory === 'all') return true;
      return normalizeCategory(product.category) === normalizeCategory(activeCategory);
    });
  }, [products, activeCategory]);

  const cartCount = cart.reduce((sum, product) => sum + Number(product.quantity || 0), 0);
  const cartTotal = cart.reduce((sum, product) => sum + Number(product.quantity || 0) * Number(product.price || 0), 0);

  useEffect(() => {
    fetchProducts();

    const savedUser = readJsonStorage('saemi-current-user', null);
    const savedCart = readJsonStorage('saemi-cart', []);

    if (savedUser?.id) {
      setCurrentUser(savedUser);
      setAuthGateActive(false);
      setShowAuth(false);
      fetchOrders(savedUser);
    } else {
      setShowAuth(true);
      setAuthGateActive(true);
    }

    if (Array.isArray(savedCart)) {
      setCart(savedCart);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('saemi-cart', JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (currentUser?.id) {
      window.localStorage.setItem('saemi-current-user', JSON.stringify(currentUser));
    } else {
      window.localStorage.removeItem('saemi-current-user');
    }
  }, [currentUser]);

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
      if (loadedScript) loadedScript.remove();
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
  }, [googleLoaded, showAuth, googleClientId]);

  function showToast(text) {
    setMessage(text);
    window.clearTimeout(window.toastTimeout);
    window.toastTimeout = window.setTimeout(() => setMessage(''), 2500);
  }

  async function fetchProducts() {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar productos');
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      showToast('No se pudieron cargar los productos.');
    }
  }

  async function fetchOrders(user = currentUser) {
    if (!user?.id) {
      setOrders([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        userId: user.id,
        role: user.role || 'cliente'
      });
      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar pedidos');
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      showToast('No se pudieron cargar los pedidos.');
    }
  }

  async function handleGoogleCredentialResponse(response) {
    if (!response?.credential) {
      showToast('No se pudo iniciar sesión con Google.');
      return;
    }

    try {
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

      finishAuth(data, `Bienvenido, ${data.name}`);
    } catch (error) {
      console.error(error);
      showToast('No se pudo conectar con Google.');
    }
  }

  function finishAuth(user, toastText) {
    setCurrentUser(user);
    setAuthGateActive(false);
    setShowAuth(false);
    setMobileMenuOpen(false);
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
    setAuthAddress('');
    setAuthPhone('');
    fetchOrders(user);
    showToast(toastText);
  }

  async function handleLogin(event) {
    event?.preventDefault();

    if (!authEmail.trim() || !authPassword.trim()) {
      showToast('Ingresa correo y contraseña.');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Error al iniciar sesión');
        return;
      }

      finishAuth(data, `Bienvenido de nuevo, ${data.name}`);
    } catch (error) {
      console.error(error);
      showToast('No se pudo conectar con el servidor.');
    }
  }

  async function handleRegister(event) {
    event?.preventDefault();

    if (!authName.trim() || !authEmail.trim() || !authPassword.trim() || !authAddress.trim() || !authPhone.trim()) {
      showToast('Completa todos los campos para registrarte.');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName.trim(),
          email: authEmail.trim(),
          password: authPassword,
          address: authAddress.trim(),
          phone: authPhone.trim()
        })
      });
      const body = await response.json();

      if (!response.ok) {
        showToast(body.error || 'No fue posible registrar la cuenta');
        return;
      }

      finishAuth(body, 'Cuenta creada correctamente.');
    } catch (error) {
      console.error(error);
      showToast('No se pudo registrar la cuenta.');
    }
  }

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: Number(item.quantity || 0) + 1 } : item));
      }
      return [...current, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
    showToast('Producto agregado al carrito.');
  }

  function changeQuantity(id, delta) {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, Number(item.quantity || 0) + delta) } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  async function handleCheckout() {
    if (!currentUser) {
      setShowAuth(true);
      showToast('Debes iniciar sesión para finalizar la compra.');
      return;
    }

    if (!cart.length) {
      showToast('El carrito está vacío.');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser,
          items: cart,
          total: cartTotal,
          address: currentUser.address
        })
      });
      const body = await response.json();

      if (!response.ok) {
        showToast(body.error || 'Error al crear el pedido');
        return;
      }

      setCart([]);
      setCartOpen(false);
      fetchOrders(currentUser);
      showToast('Pedido creado correctamente.');
    } catch (error) {
      console.error(error);
      showToast('No se pudo crear el pedido.');
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    setOrders([]);
    setAuthGateActive(true);
    setShowAuth(true);
    setMobileMenuOpen(false);
    showToast('Has cerrado sesión.');
  }

  function openProductModal(product = null) {
    setEditingProduct(product);
    setProductForm(
      product
        ? {
            name: product.name || '',
            price: product.price || '',
            category: product.category || 'mujeres',
            image: product.image || ''
          }
        : emptyProductForm
    );
    setProductModalOpen(true);
  }

  function closeProductModal() {
    setProductModalOpen(false);
    setEditingProduct(null);
    setProductForm(emptyProductForm);
  }

  async function saveProduct(event) {
    event.preventDefault();

    if (!canManageProducts) {
      showToast('No tienes permiso para administrar productos.');
      return;
    }

    if (!productForm.name.trim() || !Number(productForm.price) || !productForm.category.trim()) {
      showToast('Completa todos los campos del producto.');
      return;
    }

    const payload = {
      name: productForm.name.trim(),
      price: Number(productForm.price),
      category: productForm.category.trim(),
      image: productForm.image.trim() || '/img/productos/top-1.jpeg'
    };

    try {
      const response = await fetch(editingProduct ? `/api/products/${editingProduct.id}` : '/api/products', {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await response.json();

      if (!response.ok) {
        showToast(body.error || 'No se pudo guardar el producto.');
        return;
      }

      await fetchProducts();
      closeProductModal();
      showToast(editingProduct ? 'Producto actualizado.' : 'Producto agregado.');
    } catch (error) {
      console.error(error);
      showToast('No se pudo guardar el producto.');
    }
  }

  async function deleteProduct(product) {
    if (!canManageProducts) {
      showToast('No tienes permiso para eliminar productos.');
      return;
    }

    try {
      const response = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      const body = await response.json();

      if (!response.ok) {
        showToast(body.error || 'No se pudo eliminar el producto.');
        return;
      }

      setProducts((current) => current.filter((item) => item.id !== product.id));
      setCart((current) => current.filter((item) => item.id !== product.id));
      showToast('Producto eliminado.');
    } catch (error) {
      console.error(error);
      showToast('No se pudo eliminar el producto.');
    }
  }

  async function updateOrderStatus(order, status) {
    if (!canSeeAllOrders) return;

    try {
      const params = new URLSearchParams({
        userId: currentUser.id,
        role: currentUser.role
      });
      const response = await fetch(`/api/orders/${order.id}?${params.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const body = await response.json();

      if (!response.ok) {
        showToast(body.error || 'No se pudo actualizar el pedido.');
        return;
      }

      fetchOrders(currentUser);
      showToast('Pedido actualizado.');
    } catch (error) {
      console.error(error);
      showToast('No se pudo actualizar el pedido.');
    }
  }

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
            <button className="cart-button" onClick={() => setCartOpen(true)}>
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

        <section className="products-section" id="productos">
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
            <h3>{canSeeAllOrders ? 'Panel de pedidos' : 'Tu compra'}</h3>
            <p>{canSeeAllOrders ? 'Revisa los pedidos pendientes y administra el catálogo.' : 'Revisa tus productos y el estado de tus pedidos.'}</p>
          </div>

          <div className="dashboard-grid">
            <div className="panel card">
              <div className="panel-header">
                <h4>Carrito</h4>
                <button className="secondary-button" onClick={() => setCartOpen(true)}>
                  Ver carrito
                </button>
              </div>
              <div className="panel-content">
                {cart.length === 0 ? (
                  <p className="empty-message">No has agregado productos aún.</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div>
                        <h5>{item.name}</h5>
                        <p>
                          {formatPrice(item.price)} x {item.quantity}
                        </p>
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
                {currentUser && (
                  <button className="secondary-button" onClick={() => fetchOrders(currentUser)}>
                    Actualizar
                  </button>
                )}
              </div>
              <div className="panel-content">
                {orders.length === 0 ? (
                  <p className="empty-message">Aún no hay pedidos registrados.</p>
                ) : (
                  orders.slice().reverse().map((order) => (
                    <div key={order.id} className="order-item">
                      <h5>Pedido #{String(order.id).slice(0, 8)}</h5>
                      <p>
                        <strong>Cliente:</strong> {order.user?.name || 'Cliente'}
                      </p>
                      <p>
                        <strong>Dirección:</strong> {order.address}
                      </p>
                      <p>
                        <strong>Total:</strong> {formatPrice(order.total)}
                      </p>
                      <p>
                        <strong>Estado:</strong> {order.status}
                      </p>
                      {canSeeAllOrders && (
                        <div className="order-actions">
                          <button className="secondary-button" onClick={() => updateOrderStatus(order, 'Pendiente')}>
                            Pendiente
                          </button>
                          <button className="secondary-button" onClick={() => updateOrderStatus(order, 'Enviado')}>
                            Enviado
                          </button>
                          <button className="secondary-button" onClick={() => updateOrderStatus(order, 'Entregado')}>
                            Entregado
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {canManageProducts && (
          <section className="dashboard-section">
            <div className="section-header">
              <h3>Panel del dueño</h3>
              <p>Administra productos directamente desde la página.</p>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h4>Productos</h4>
                <button className="secondary-button" onClick={() => openProductModal()}>
                  Agregar producto
                </button>
              </div>
              <div className="panel-content product-manager-list">
                {products.map((product) => (
                  <div key={product.id} className="product-manager-item">
                    <div>
                      <h5>{product.name}</h5>
                      <p>
                        {product.category} - {formatPrice(product.price)}
                      </p>
                    </div>
                    <div className="product-manager-actions">
                      <button className="secondary-button" onClick={() => openProductModal(product)}>
                        Editar
                      </button>
                      <button className="warning-button" onClick={() => deleteProduct(product)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {isAdmin && (
          <section className="dashboard-section">
            <div className="section-header">
              <h3>Panel Admin</h3>
              <p>Vista rápida de sesión y permisos actuales.</p>
            </div>

            <div className="panel">
              <div className="panel-content permission-item">
                <h5>{currentUser?.name}</h5>
                <p>{currentUser?.email}</p>
                <p>Rol: {currentUser?.role}</p>
              </div>
            </div>
          </section>
        )}
      </main>

      <aside className={`cart-panel ${cartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>Tu carrito</h3>
          <button className="close-cart" onClick={() => setCartOpen(false)}>
            Cerrar
          </button>
        </div>
        <div className="cart-content">
          {cart.length === 0 ? (
            <p className="empty-message">No has agregado productos aún.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div>
                  <h5>{item.name}</h5>
                  <p>
                    {formatPrice(item.price)} x {item.quantity}
                  </p>
                </div>
                <div className="item-controls">
                  <button onClick={() => changeQuantity(item.id, -1)}>-</button>
                  <button onClick={() => changeQuantity(item.id, 1)}>+</button>
                  <button onClick={() => removeFromCart(item.id)}>x</button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="cart-footer">
          <div className="cart-total">
            <span>Total</span>
            <strong>{formatPrice(cartTotal)}</strong>
          </div>
          {!currentUser && <p className="cart-warning">Debes iniciar sesión o registrarte para finalizar tu compra.</p>}
          <div className="payment-methods">
            <h4>Formas de pago</h4>
            <div className="payment-item">
              <span className="method-name">Nequi</span>
              <strong>3216620935</strong>
            </div>
            <div className="payment-item visa">
              <span className="method-name">Visa</span>
              <span>Tarjeta de débito / crédito</span>
            </div>
          </div>
          <button className={`checkout-button ${currentUser && cart.length ? 'enabled' : ''}`} onClick={handleCheckout} disabled={!currentUser || !cart.length}>
            Finalizar compra
          </button>
        </div>
      </aside>

      <button className="floating-cart" onClick={() => setCartOpen(true)} title="Abrir carrito">
        <span className="floating-icon">🛒</span>
        <span className="floating-badge">{cartCount}</span>
      </button>

      {(cartOpen || showAuth || productModalOpen) && <div className="overlay visible" onClick={() => {
        setCartOpen(false);
        if (!authGateActive) setShowAuth(false);
        closeProductModal();
      }} />}

      {showAuth && (
        <div className="modal">
          <div className="modal-content">
            {!authGateActive && (
              <button className="close-modal" onClick={() => setShowAuth(false)}>
                ×
              </button>
            )}
            <h3>{authMode === 'login' ? 'Iniciar sesión' : 'Registrarse'}</h3>
            <div className="modal-tabs">
              <button className={`tab ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>
                Login
              </button>
              <button className={`tab ${authMode === 'register' ? 'active' : ''}`} onClick={() => setAuthMode('register')}>
                Registrarse
              </button>
            </div>

            <div className="google-auth">
              {googleClientId ? (
                <>
                  <div id="google-signin-button" />
                  <p className="small-text">Usa tu cuenta de Google para iniciar sesión sin escribir el correo.</p>
                </>
              ) : (
                <p className="small-text">
                  Configura <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> en .env.local para habilitar acceso con Google.
                </p>
              )}
            </div>

            {authMode === 'login' ? (
              <form className="tab-panel" onSubmit={handleLogin}>
                <label htmlFor="loginEmail">Correo electrónico</label>
                <input id="loginEmail" type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="usuario@ejemplo.com" />

                <label htmlFor="loginPassword">Contraseña</label>
                <input id="loginPassword" type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="********" />

                <button className="primary-button" type="submit">
                  Iniciar sesión
                </button>
              </form>
            ) : (
              <form className="tab-panel" onSubmit={handleRegister}>
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

                <button className="primary-button" type="submit">
                  Registrar cuenta
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {productModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <button className="close-modal" onClick={closeProductModal}>
              ×
            </button>
            <h3>{editingProduct ? 'Editar producto' : 'Agregar producto'}</h3>
            <form className="tab-panel" onSubmit={saveProduct}>
              <label htmlFor="productName">Nombre del producto</label>
              <input id="productName" type="text" value={productForm.name} onChange={(event) => setProductForm((form) => ({ ...form, name: event.target.value }))} />

              <label htmlFor="productPrice">Precio</label>
              <input id="productPrice" type="number" min="0" value={productForm.price} onChange={(event) => setProductForm((form) => ({ ...form, price: event.target.value }))} />

              <label htmlFor="productCategory">Categoría</label>
              <select id="productCategory" value={productForm.category} onChange={(event) => setProductForm((form) => ({ ...form, category: event.target.value }))}>
                <option value="mujeres">Mujeres</option>
                <option value="hombres">Hombres</option>
                <option value="niños">Niños</option>
                <option value="electrodomesticos">Electrodomésticos</option>
                <option value="hogar">Hogar</option>
                <option value="otros">Otros</option>
              </select>

              <label htmlFor="productImage">URL de imagen</label>
              <input
                id="productImage"
                type="text"
                value={productForm.image}
                onChange={(event) => setProductForm((form) => ({ ...form, image: event.target.value }))}
                placeholder="/img/productos/ejemplo.jpeg"
              />

              <button className="primary-button" type="submit">
                Guardar producto
              </button>
            </form>
          </div>
        </div>
      )}

      <div className={`toast ${message ? 'visible' : ''}`}>{message}</div>
    </>
  );
}
