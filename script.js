const productGrid = document.getElementById('productGrid');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartPanel = document.getElementById('cartPanel');
const overlay = document.getElementById('overlay');
const cartContent = document.getElementById('cartContent');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.getElementById('cartCount');
const checkoutButton = document.getElementById('checkoutBtn');
const cartWarning = document.getElementById('cartWarning');
const navLinks = document.querySelectorAll('.nav-link');
const siteHeader = document.querySelector('.site-header');
const welcomeMessage = document.getElementById('welcomeMessage');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authModal = document.getElementById('authModal');
const closeAuthModal = document.getElementById('closeAuthModal');
const authTabs = document.querySelectorAll('.tab');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const registerForm = document.getElementById('registerForm');
const registerName = document.getElementById('registerName');
const registerAddress = document.getElementById('registerAddress');
const registerPhone = document.getElementById('registerPhone');
const registerEmail = document.getElementById('registerEmail');
const floatingCart = document.getElementById('floatingCart');
const floatingCartCount = document.getElementById('floatingCartCount');
const managerPanel = document.getElementById('managerPanel');
const adminPanel = document.getElementById('adminPanel');
const addProductBtn = document.getElementById('addProductBtn');
const productManagerList = document.getElementById('productManagerList');
const ordersPanelContent = document.getElementById('ordersPanelContent');
const permissionsPanel = document.getElementById('permissionsPanel');
const productModal = document.getElementById('productModal');
const closeProductModal = document.getElementById('closeProductModal');
const productModalTitle = document.getElementById('productModalTitle');
const productForm = document.getElementById('productForm');
const productName = document.getElementById('productName');
const productPrice = document.getElementById('productPrice');
const productCategory = document.getElementById('productCategory');
const productImage = document.getElementById('productImage');
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

let activeCategory = 'all';
let cart = [];
let products = [];
let users = [];
let orders = [];
let currentUser = null;
let editingProductId = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

const state = {
  load(key, fallback) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  },
  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const defaultProducts = [
  { id: 'p1', name: 'Body Rosado', price: 30000, category: 'mujeres', image: 'img/productos/body-1.jpeg' },
  { id: 'p2', name: 'Body Camel', price: 27000, category: 'mujeres', image: 'img/productos/body-2.jpeg' },
  { id: 'p3', name: 'Body Colombia', price: 30000, category: 'mujeres', image: 'img/productos/body-3.jpeg' },
  { id: 'p4', name: 'Top Tamara', price: 20000, category: 'mujeres', image: 'img/productos/top-1.jpeg' },
  { id: 'p5', name: 'Top Noah Camel', price: 30000, category: 'mujeres', image: 'img/productos/top-2.jpeg' },
  { id: 'p6', name: 'Top Esperanza', price: 25000, category: 'mujeres', image: 'img/productos/top-3.jpeg' },
  { id: 'p7', name: 'Combo Belleza Especial', price: 67000, category: 'mujeres', image: 'img/productos/combo-1.jpeg' },
  { id: 'p8', name: 'Splash + Mantequilla', price: 32000, category: 'mujeres', image: 'img/productos/combo-2.jpeg' },
  { id: 'p9', name: 'Buzo Naia Blanco', price: 35000, category: 'hombres', image: 'img/productos/buzo-naia.jpeg' },
  { id: 'p10', name: 'Falda Globo Camel', price: 35000, category: 'mujeres', image: 'img/productos/falda.jpeg' },
  { id: 'p11', name: 'Bafle Rosado Bluetooth', price: 40000, category: 'electrodomesticos', image: 'img/productos/bafle.jpeg' },
  { id: 'p12', name: 'Mini Licuadora Azul', price: 30000, category: 'electrodomesticos', image: 'img/productos/licuadora.jpeg' },
  { id: 'p13', name: 'EarPods USB-C Apple', price: 14000, category: 'electrodomesticos', image: 'img/productos/audifonos.jpeg' },
  { id: 'p14', name: 'Mega Set de Arte 208 Pzas', price: 55000, category: 'ninos', image: 'img/productos/arte.jpeg' },
  { id: 'p15', name: 'Tablero Didactico Kuromi', price: 22000, category: 'ninos', image: 'img/productos/tablero.jpeg' },
  { id: 'p16', name: 'Lonchera Encanto', price: 10000, category: 'ninos', image: 'img/productos/lonchera.jpeg' },
  { id: 'p17', name: 'Bolso Infantil 3 en 1', price: 50000, category: 'ninos', image: 'img/productos/bolso.jpeg' },
  { id: 'p19', name: 'Plancha de Vapor', price: 72000, category: 'hogar', image: 'img/productos/plancha.jpeg' }
];

const defaultUsers = [
  { email: 'admin@saemi.com', name: 'Admin', address: 'Oficina central', phone: '3000000001', role: 'admin' },
  { email: 'dueno@saemi.com', name: 'Dueno', address: 'Tienda principal', phone: '3000000002', role: 'dueno' },
  { email: 'cliente@saemi.com', name: 'Cliente', address: 'Calle 123', phone: '3000000003', role: 'cliente' }
];

function formatPrice(value) {
  return `$${Number(value).toLocaleString('es-CO')}`;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.remove('visible'), 2500);
}

function saveAll() {
  state.save('saemi-products', products);
  state.save('saemi-cart', cart);
  state.save('saemi-users', users);
  state.save('saemi-orders', orders);
  state.save('saemi-current-user', currentUser);
}

function loadState() {
  products = state.load('saemi-products', defaultProducts);
  cart = state.load('saemi-cart', []);
  users = state.load('saemi-users', defaultUsers);
  orders = state.load('saemi-orders', []);
  currentUser = state.load('saemi-current-user', null);
}

function renderProducts() {
  productGrid.innerHTML = '';
  const filtered = products.filter((product) => activeCategory === 'all' || product.category === activeCategory);
  if (!filtered.length) {
    productGrid.innerHTML = '<p class="empty-message">No hay productos en esta categoria.</p>';
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.category = product.category;
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null; this.style.display='none';">
      <div class="product-info">
        <h4>${product.name}</h4>
        <p class="price">${formatPrice(product.price)}</p>
        <div class="button-row">
          <button class="primary-button add-to-cart" data-id="${product.id}">Agregar al carrito</button>
        </div>
      </div>
    `;
    productGrid.appendChild(card);
  });

  document.querySelectorAll('.add-to-cart').forEach((button) => {
    button.addEventListener('click', () => {
      const product = products.find((item) => item.id === button.dataset.id);
      if (product) addToCart(product);
    });
  });
}

function renderManagerProducts() {
  if (!productManagerList) return;
  productManagerList.innerHTML = '';
  products.forEach((product) => {
    const item = document.createElement('div');
    item.className = 'product-manager-item';
    item.innerHTML = `
      <div>
        <h5>${product.name}</h5>
        <p>${product.category} - ${formatPrice(product.price)}</p>
      </div>
      <div class="product-manager-actions">
        <button class="secondary-button" data-action="edit" data-id="${product.id}">Editar</button>
        <button class="warning-button" data-action="delete" data-id="${product.id}">Eliminar</button>
      </div>
    `;
    productManagerList.appendChild(item);
  });

  productManagerList.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      const product = products.find((item) => item.id === button.dataset.id);
      if (!product) return;
      if (button.dataset.action === 'edit') {
        openProductModal(product);
      } else if (button.dataset.action === 'delete') {
        products = products.filter((item) => item.id !== product.id);
        saveAll();
        renderProducts();
        renderManagerProducts();
        showToast('Producto eliminado.');
      }
    });
  });
}

function renderOrders() {
  if (!ordersPanelContent) return;
  ordersPanelContent.innerHTML = '';
  if (!orders.length) {
    ordersPanelContent.innerHTML = '<p class="empty-message">No hay pedidos todavia.</p>';
    return;
  }

  orders.slice().reverse().forEach((order) => {
    const orderItem = document.createElement('div');
    orderItem.className = 'order-item';
    orderItem.innerHTML = `
      <h5>Pedido #${order.id}</h5>
      <p><strong>Cliente:</strong> ${order.user.name}</p>
      <p><strong>Email:</strong> ${order.user.email}</p>
      <p><strong>Direccion:</strong> ${order.address}</p>
      <p><strong>Total:</strong> ${formatPrice(order.total)}</p>
      <p><strong>Estado:</strong> ${order.status}</p>
    `;
    ordersPanelContent.appendChild(orderItem);
  });
}

function renderPermissions() {
  if (!permissionsPanel) return;
  permissionsPanel.innerHTML = '';
  users.forEach((user) => {
    const item = document.createElement('div');
    item.className = 'permission-item';
    item.innerHTML = `
      <h5>${user.name}</h5>
      <p>${user.email}</p>
      <p>Rol: ${user.role}</p>
    `;
    permissionsPanel.appendChild(item);
  });
}

function updateCartUI() {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = formatPrice(total);
  cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  floatingCartCount.textContent = cartCount.textContent;

  if (!cart.length) {
    cartContent.innerHTML = '<p class="empty-message">No has agregado productos aun.</p>';
    checkoutButton.classList.remove('enabled');
    checkoutButton.disabled = true;
    cartWarning.classList.add('hidden');
    return;
  }

  cartContent.innerHTML = '';
  cart.forEach((item, index) => {
    const element = document.createElement('div');
    element.className = 'cart-item';
    element.innerHTML = `
      <div>
        <h5>${item.name}</h5>
        <p>${formatPrice(item.price)} x ${item.quantity}</p>
      </div>
      <div class="item-controls">
        <button data-action="decrease" data-index="${index}">-</button>
        <button data-action="increase" data-index="${index}">+</button>
        <button data-action="remove" data-index="${index}">x</button>
      </div>
    `;
    cartContent.appendChild(element);
  });

  if (!currentUser) {
    checkoutButton.classList.remove('enabled');
    checkoutButton.disabled = true;
    cartWarning.classList.remove('hidden');
    return;
  }

  checkoutButton.classList.add('enabled');
  checkoutButton.disabled = false;
  cartWarning.classList.add('hidden');
}

function addToCart(product) {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveAll();
  updateCartUI();
  showToast('Producto agregado al carrito.');
}

function handleCartButtons(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const action = button.dataset.action;
  const index = Number(button.dataset.index);
  if (Number.isNaN(index) || index < 0 || index >= cart.length) return;

  if (action === 'remove') {
    cart.splice(index, 1);
  } else if (action === 'decrease') {
    cart[index].quantity -= 1;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
  } else if (action === 'increase') {
    cart[index].quantity += 1;
  }

  saveAll();
  updateCartUI();
}

function openCart() {
  cartPanel.classList.add('open');
  overlay.classList.add('visible');
}

function closeCart() {
  cartPanel.classList.remove('open');
  overlay.classList.remove('visible');
}

function toggleMobileMenu() {
  mainNav.classList.toggle('mobile-open');
}

function openAuthModal() {
  authModal.classList.remove('hidden');
  overlay.classList.add('visible');
}

function closeAuth() {
  authModal.classList.add('hidden');
  overlay.classList.remove('visible');
}

function openProductModal(product = null) {
  productModal.classList.remove('hidden');
  overlay.classList.add('visible');
  if (product) {
    editingProductId = product.id;
    productModalTitle.textContent = 'Editar producto';
    productName.value = product.name;
    productPrice.value = product.price;
    productCategory.value = product.category;
    productImage.value = product.image;
  } else {
    editingProductId = null;
    productModalTitle.textContent = 'Agregar producto';
    productForm.reset();
  }
}

function closeProduct() {
  productModal.classList.add('hidden');
  overlay.classList.remove('visible');
}

function applyRoleUI() {
  const role = currentUser?.role || 'cliente';
  managerPanel.classList.toggle('hidden', role !== 'dueno' && role !== 'admin');
  adminPanel.classList.toggle('hidden', role !== 'admin');
}

function renderUserUI() {
  if (!currentUser) {
    welcomeMessage.textContent = 'Bienvenido, crea una cuenta o inicia sesion para hacer pedidos.';
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    applyRoleUI();
    renderOrders();
    renderPermissions();
    return;
  }
  welcomeMessage.textContent = `${currentUser.name} (${currentUser.role})`;
  loginBtn.classList.add('hidden');
  logoutBtn.classList.remove('hidden');
  applyRoleUI();
  renderManagerProducts();
  renderOrders();
  renderPermissions();
}

function registerNewUser(name, email, address, phone) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!name.trim() || !address.trim() || !phone.trim() || !normalizedEmail) {
    showToast('Completa todos los campos para generar una cuenta.');
    return;
  }
  if (users.some((item) => item.email.toLowerCase() === normalizedEmail)) {
    showToast('Este correo ya esta registrado.');
    return;
  }
  const newUser = { name: name.trim(), email: normalizedEmail, address: address.trim(), phone: phone.trim(), role: 'cliente' };
  users.push(newUser);
  currentUser = newUser;
  saveAll();
  renderUserUI();
  updateCartUI();
  closeAuth();
  showToast('Cuenta creada correctamente.');
}

function checkout() {
  if (!currentUser) {
    showToast('Debes iniciar sesion o registrarte para finalizar la compra.');
    openAuthModal();
    return;
  }

  if (!cart.length) {
    showToast('El carrito esta vacio.');
    return;
  }

  const orderId = Date.now();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = {
    id: orderId,
    user: { ...currentUser },
    address: currentUser.address,
    items: [...cart],
    total,
    status: 'Pendiente',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  cart = [];
  saveAll();
  updateCartUI();
  renderOrders();
  closeCart();
  showToast('Compra realizada. Tu pedido se enviara a ' + currentUser.address + '.');
}

function openTab(tabName) {
  authTabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === tabName));
  loginTab.classList.toggle('hidden', tabName !== 'login');
  registerTab.classList.toggle('hidden', tabName !== 'register');
}

function handleCategoryChange(category, linkElement) {
  activeCategory = category;
  navLinks.forEach((link) => link.classList.toggle('active', link === linkElement));
  renderProducts();
  if (mainNav.classList.contains('mobile-open')) {
    mainNav.classList.remove('mobile-open');
  }
}

function setInitialPosition() {
  const position = state.load('saemi-cart-position', { x: 20, y: 20 });
  floatingCart.style.left = `${position.x}px`;
  floatingCart.style.top = `${position.y}px`;
}

function saveCartPosition() {
  const rect = floatingCart.getBoundingClientRect();
  state.save('saemi-cart-position', { x: rect.left, y: rect.top });
}

function handleDragStart(event) {
  isDragging = true;
  floatingCart.classList.add('dragging');
  const rect = floatingCart.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  dragOffset.x = clientX - rect.left;
  dragOffset.y = clientY - rect.top;
}

function handleDragMove(event) {
  if (!isDragging) return;
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  const x = clientX - dragOffset.x;
  const y = clientY - dragOffset.y;
  floatingCart.style.left = `${Math.max(8, Math.min(window.innerWidth - floatingCart.offsetWidth - 8, x))}px`;
  floatingCart.style.top = `${Math.max(8, Math.min(window.innerHeight - floatingCart.offsetHeight - 8, y))}px`;
}

function handleDragEnd() {
  if (!isDragging) return;
  isDragging = false;
  floatingCart.classList.remove('dragging');
  saveCartPosition();
}

function attachEvents() {
  openCartBtn.addEventListener('click', openCart);
  closeCartBtn.addEventListener('click', closeCart);
  overlay.addEventListener('click', () => {
    closeCart();
    closeAuth();
    closeProduct();
    mainNav.classList.remove('mobile-open');
  });
  window.addEventListener('scroll', () => {
    siteHeader.classList.toggle('scrolled', window.scrollY > 50);
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      handleCategoryChange(link.dataset.category, link);
    });
  });

  loginBtn.addEventListener('click', openAuthModal);
  closeAuthModal.addEventListener('click', closeAuth);
  logoutBtn.addEventListener('click', () => {
    currentUser = null;
    saveAll();
    renderUserUI();
    updateCartUI();
    showToast('Has cerrado sesion.');
  });

  authTabs.forEach((tab) => {
    tab.addEventListener('click', () => openTab(tab.dataset.tab));
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: loginEmail.value,
          password: loginPassword.value
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Error al iniciar sesion');
        return;
      }

      currentUser = data;
      saveAll();
      renderUserUI();
      updateCartUI();
      closeAuth();
      showToast(`Sesion iniciada como ${data.role}.`);
    } catch (error) {
      console.error(error);
      showToast('No se pudo conectar con el servidor');
    }
  });

  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    registerNewUser(registerName.value, registerEmail.value, registerAddress.value, registerPhone.value);
  });

  addProductBtn.addEventListener('click', () => openProductModal());
  closeProductModal.addEventListener('click', closeProduct);
  productForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const productData = {
      id: editingProductId || `p${Date.now()}`,
      name: productName.value.trim(),
      price: Number(productPrice.value),
      category: productCategory.value,
      image: productImage.value.trim() || ''
    };
    if (!productData.name || !productData.price || !productData.category) {
      showToast('Completa todos los campos del producto.');
      return;
    }
    if (editingProductId) {
      products = products.map((item) => (item.id === editingProductId ? productData : item));
      showToast('Producto actualizado.');
    } else {
      products.push(productData);
      showToast('Producto agregado.');
    }
    saveAll();
    renderProducts();
    renderManagerProducts();
    closeProduct();
  });

  cartContent.addEventListener('click', handleCartButtons);
  checkoutButton.addEventListener('click', checkout);

  menuToggle.addEventListener('click', toggleMobileMenu);
  floatingCart.addEventListener('click', openCart);
  floatingCart.addEventListener('mousedown', handleDragStart);
  floatingCart.addEventListener('touchstart', handleDragStart, { passive: true });
  window.addEventListener('mousemove', handleDragMove);
  window.addEventListener('touchmove', handleDragMove, { passive: false });
  window.addEventListener('mouseup', handleDragEnd);
  window.addEventListener('touchend', handleDragEnd);
}

function init() {
  loadState();
  setInitialPosition();
  renderProducts();
  renderUserUI();
  updateCartUI();
  openTab('login');
  attachEvents();
  if (!currentUser) {
    openAuthModal();
  }
}

init();
