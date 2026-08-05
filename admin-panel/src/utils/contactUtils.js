/**
 * contactUtils.js
 * Shared utilities for resolving shop contact info and opening WhatsApp.
 * Used by OrderTracking, ShopDetails, and any other page needing shop contact.
 */

import api from '../services/api';

// ─── Phone Normalization ──────────────────────────────────────────────────────

/**
 * Normalize a raw phone number to pure digits with India country code (91)
 * when no country code is detected.
 *
 * Process:
 *  1. Strip all non-digit characters (spaces, hyphens, brackets, "+")
 *  2. Remove a leading trunk "0"
 *  3. If 10 digits remain (Indian mobile), prepend "91"
 *
 * @param   {string} raw  Raw phone string from any source
 * @returns {string}      Pure digits, e.g. "919876543210"
 */
export function normalizePhone(raw) {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = '91' + digits;
  return digits;
}

// ─── WhatsApp Opener ─────────────────────────────────────────────────────────

/**
 * Open a WhatsApp conversation with a pre-filled message.
 * On mobile: opens the WhatsApp app.
 * On desktop: opens WhatsApp Web in a new tab.
 *
 * @param   {string}  phone    Raw phone number (normalized internally)
 * @param   {string}  message  Plain-text message to pre-fill
 * @returns {boolean} true if opened; false if no valid number
 */
export function openWhatsApp(phone, message) {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  const encoded = encodeURIComponent(message);
  const url = 'https://wa.me/' + normalized + '?text=' + encoded;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

// ─── Message Builder ─────────────────────────────────────────────────────────

/**
 * Build the standard Go2Pick WhatsApp pre-filled message for an order.
 *
 * @param   {string} orderId
 * @returns {string}
 */
export function buildOrderMessage(orderId) {
  return (
    'Hi! I placed an order through Go2Pick.\n\n' +
    'Order ID: ' + orderId + '\n\n' +
    'I have a question regarding my order. Please assist me.'
  );
}

// ─── Phone Resolver ──────────────────────────────────────────────────────────

/**
 * Resolve a shop phone number from multiple fallback sources.
 *
 * Priority:
 *  1. order.businessPhone
 *  2. order.phone
 *  3. order.shop.businessPhone
 *  4. order.shop.phone
 *  5. GET /api/shops/{shopId}/contact  (live API — last resort)
 *
 * @param {object|null}   order            Order object from the API
 * @param {string|null}   shopId           Shop ID for the API fallback
 * @param {Function|null} setResolvedPhone Optional React state setter to cache result
 * @returns {Promise<string>} Raw phone string (empty if not found anywhere)
 */
export async function resolveShopPhone(order, shopId, setResolvedPhone = null) {
  const fromOrder =
    order?.businessPhone ||
    order?.phone ||
    order?.shop?.businessPhone ||
    order?.shop?.phone ||
    '';

  if (fromOrder) return fromOrder;

  const sid = shopId || order?.shopId || order?.shop?.id;
  if (!sid) return '';

  try {
    const res = await api.get('/api/shops/' + sid + '/contact');
    const phone = res.data?.contact?.phone || '';
    if (phone && setResolvedPhone) setResolvedPhone(phone);
    return phone;
  } catch (err) {
    console.error('[contactUtils] Could not fetch shop contact:', err);
    return '';
  }
}

