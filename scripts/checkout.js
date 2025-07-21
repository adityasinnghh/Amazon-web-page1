import { cart, removeFromCart, updateDeliveryOption } from '../data/cart.js';
import { products } from '../data/products.js';
import { formatCurrancy } from './utils/money.js';
import dayjs from 'https://unpkg.com/dayjs@1.11.10/esm/index.js';
import { deliveryOptions } from '../data/deliveryOptions.js';

// ========== DELIVERY OPTIONS ========== //
function generateDeliveryOptionsHTML(matchingProduct, cartItem) {
  return deliveryOptions.map(deliveryOption => {
    const deliveryDate = dayjs().add(deliveryOption.deliveryDays, 'days');
    const dateString = deliveryDate.format('dddd, MMMM D');
    const priceString = deliveryOption.priceCents === 0
      ? 'FREE'
      : `$${formatCurrancy(deliveryOption.priceCents)}`;
    const isChecked = deliveryOption.id === cartItem.deliveryOptionId;

    return `
      <div class="delivery-option js-delivery-option"
        data-product-id="${matchingProduct.id}"
        data-delivery-option-id="${deliveryOption.id}">
        <input type="radio"
          class="delivery-option-input"
          name="delivery-option-${matchingProduct.id}"
          ${isChecked ? 'checked' : ''}>
        <div>
          <div class="delivery-option-date">${dateString}</div>
          <div class="delivery-option-price">${priceString} - Shipping</div>
        </div>
      </div>
    `;
  }).join('');
}

// ========== ORDER SUMMARY BOX ========== //
function renderSummaryBox() {
  let itemTotalCents = 0;
  let shippingTotalCents = 0;
  let totalQuantity = 0;

  cart.forEach((cartItem) => {
    const product = products.find(p => p.id === cartItem.productId);
    const deliveryOption = deliveryOptions.find(option => option.id === cartItem.deliveryOptionId);

    if (product && deliveryOption) {
      itemTotalCents += product.priceCents * cartItem.quantity;
      shippingTotalCents += deliveryOption.priceCents;
      totalQuantity += cartItem.quantity;
    }
  });

  const beforeTaxCents = itemTotalCents + shippingTotalCents;
  const estimatedTaxCents = Math.round(beforeTaxCents * 0.10);
  const orderTotalCents = beforeTaxCents + estimatedTaxCents;

  const summaryDiv = document.getElementById('js-summary-box');
  if (summaryDiv) {
    summaryDiv.innerHTML = `
      <div class="payment-summary">
        <div class="payment-summary-title">Order Summary</div>

        <div class="payment-summary-row">
          <div>Items (${totalQuantity}):</div>
          <div class="payment-summary-money">$${formatCurrancy(itemTotalCents)}</div>
        </div>

        <div class="payment-summary-row">
          <div>Shipping & handling:</div>
          <div class="payment-summary-money">$${formatCurrancy(shippingTotalCents)}</div>
        </div>

        <div class="payment-summary-row subtotal-row">
          <div>Total before tax:</div>
          <div class="payment-summary-money">$${formatCurrancy(beforeTaxCents)}</div>
        </div>

        <div class="payment-summary-row">
          <div>Estimated tax (10%):</div>
          <div class="payment-summary-money">$${formatCurrancy(estimatedTaxCents)}</div>
        </div>

        <div class="payment-summary-row total-row">
          <div>Order total:</div>
          <div class="payment-summary-money">$${formatCurrancy(orderTotalCents)}</div>
        </div>

        <button class="place-order-button button-primary" id="place-order-btn">
          Place your order
        </button>
      </div>
    `;
  }
}

// ========== MAIN RENDER FUNCTION ========== //
function renderOrderSummary() {
  let cartSummaryHTML = '';

  cart.forEach((cartItem) => {
    const matchingProduct = products.find(p => p.id === cartItem.productId);
    const deliveryOption = deliveryOptions.find(option => option.id === cartItem.deliveryOptionId);

    if (!matchingProduct || !deliveryOption) return;

    const deliveryDate = dayjs().add(deliveryOption.deliveryDays, 'days');
    const dateString = deliveryDate.format('dddd, MMMM D');

    cartSummaryHTML += `
      <div class="cart-item-container js-cart-item-container-${matchingProduct.id}">
        <div class="delivery-date">Delivery date: ${dateString}</div>
        <div class="cart-item-details-grid">
          <img class="product-image" src="${matchingProduct.image}">
          <div class="cart-item-details">
            <div class="product-name">${matchingProduct.name}</div>
            <div class="product-price">$${formatCurrancy(matchingProduct.priceCents)}</div>
            <div class="product-quantity">
              <label>
                Quantity:
                <select class="quantity-select js-quantity-selector" data-product-id="${matchingProduct.id}">
                  ${[...Array(10)].map((_, i) => {
                    const qty = i + 1;
                    return `<option value="${qty}" ${qty === cartItem.quantity ? 'selected' : ''}>${qty}</option>`;
                  }).join('')}
                </select>
              </label>
              <span class="delete-quantity-link link-primary js-delete-link" 
                    data-product-id="${matchingProduct.id}">
                Delete
              </span>
            </div>
          </div>
          <div class="delivery-options">
            <div class="delivery-options-title">Choose a delivery option:</div>
            ${generateDeliveryOptionsHTML(matchingProduct, cartItem)}
          </div>
        </div>
      </div>
    `;
  });

  document.querySelector('.js-order-summary').innerHTML = cartSummaryHTML;
  renderSummaryBox();

  // DELETE FUNCTION
  document.querySelectorAll('.js-delete-link').forEach(link => {
    link.addEventListener('click', () => {
      const productId = link.dataset.productId;
      removeFromCart(productId);
      renderOrderSummary();
    });
  });

  // DELIVERY OPTION CHANGE
  document.querySelectorAll('.js-delivery-option').forEach(option => {
    option.addEventListener('click', () => {
      const productId = option.dataset.productId;
      const deliveryOptionId = option.dataset.deliveryOptionId;
      updateDeliveryOption(productId, deliveryOptionId);
      renderOrderSummary();
    });
  });

  // QUANTITY SELECT CHANGE
  document.querySelectorAll('.js-quantity-selector').forEach(select => {
    select.addEventListener('change', () => {
      const productId = select.dataset.productId;
      const newQuantity = Number(select.value);
      const cartItem = cart.find(item => item.productId === productId);
      if (cartItem && newQuantity > 0) {
        cartItem.quantity = newQuantity;
        renderOrderSummary();
      }
    });
  });

  // PLACE ORDER BUTTON EVENT
  const placeOrderBtn = document.getElementById('place-order-btn');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', () => {
      let itemTotalCents = 0;
      let shippingTotalCents = 0;
      let items = [];

      cart.forEach((cartItem) => {
        const product = products.find(p => p.id === cartItem.productId);
        const deliveryOption = deliveryOptions.find(option => option.id === cartItem.deliveryOptionId);

        if (product && deliveryOption) {
          itemTotalCents += product.priceCents * cartItem.quantity;
          shippingTotalCents += deliveryOption.priceCents;

          items.push({
            id: product.id,
            name: product.name,
            image: product.image,
            priceCents: product.priceCents,
            quantity: cartItem.quantity,
            deliveryDays: deliveryOption.deliveryDays
          });
        }
      });

      const beforeTaxCents = itemTotalCents + shippingTotalCents;
      const estimatedTaxCents = Math.round(beforeTaxCents * 0.10);
      const orderTotalCents = beforeTaxCents + estimatedTaxCents;

      const order = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        totalCents: orderTotalCents,
        items
      };

      const existingOrders = JSON.parse(localStorage.getItem('placedOrders')) || [];
      existingOrders.unshift(order);
      localStorage.setItem('placedOrders', JSON.stringify(existingOrders));

      // Clear cart from local storage
      localStorage.setItem('cart', JSON.stringify([]));

      // Redirect to order placed page
      window.location.href = 'orderplaced.html';
    });
  }
}

// INITIALIZE
renderOrderSummary();
