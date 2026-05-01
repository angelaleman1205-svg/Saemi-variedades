const cartPanel = document.getElementById('cartPanel');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const overlay = document.getElementById('overlay');
const cartContent = document.getElementById('cartContent');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.getElementById('cartCount');
const checkoutButton = document.querySelector('.checkout-button');
const navLinks = document.querySelectorAll('.nav-link');
const productCards = document.querySelectorAll('.product-card');

let cart = [];

function openCart() {
  cartPanel.classList.add('open');
  overlay.classList.add('visible');
}

function closeCart() {
  cartPanel.classList.remove('open');
  overlay.classList.remove('visible');
}

openCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);

function formatPrice(price) {
  return `$${price.toLocaleString('es-CO')}`;
}

function updateCartUI() {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = formatPrice(total);
  cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

  cartContent.innerHTML = '';
  if (cart.length === 0) {
    cartContent.innerHTML = '<p class="empty-message">No has agregado productos aún.</p>';
    checkoutButton.classList.remove('enabled');
    checkoutButton.disabled = true;
    return;
  }

  cart.forEach((item, index) => {
    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item';
    itemElement.innerHTML = `
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

    cartContent.appendChild(itemElement);
  });

  checkoutButton.classList.add('enabled');
  checkoutButton.disabled = false;
}

function addToCart(product) {
  const existing = cart.find((item) => item.name === product.name);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  updateCartUI();
}

productCards.forEach((card) => {
  const button = card.querySelector('.add-to-cart');
  const name = card.querySelector('h4').textContent;
  const priceText = card.querySelector('.price').textContent.replace(/[^0-9]/g, '');
  const priceValue = Number(priceText) || 0;

  button.addEventListener('click', () => {
    addToCart({ name, price: priceValue });
    openCart();
  });
});

cartContent.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const action = button.dataset.action;
  const index = Number(button.dataset.index);
  if (index < 0 || index >= cart.length) return;

  if (action === 'remove') {
    cart.splice(index, 1);
  } else if (action === 'decrease') {
    cart[index].quantity -= 1;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
  } else if (action === 'increase') {
    cart[index].quantity += 1;
  }

  updateCartUI();
});

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const category = link.dataset.category;

    navLinks.forEach((item) => item.classList.remove('active'));
    link.classList.add('active');

    productCards.forEach((card) => {
      if (category === 'all' || card.dataset.category === category) {
        card.style.display = 'grid';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

updateCartUI();
