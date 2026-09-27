/**
 * ============================================================
 * Auth Adapter — WordPress JWT Authentication ↔ Frontend
 * ============================================================
 * Uses the "JWT Authentication for WP-API" plugin to handle
 * user login, registration, and profile management.
 *
 * Plugin: https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/
 * ============================================================
 */

import { wpUrl, wcUrl, request, authRequest } from "../wooClient.js";

/**
 * Login — authenticate user and receive a JWT token.
 * Uses the JWT Auth plugin endpoint.
 *
 * @param {string} email - User email (WP username or email)
 * @param {string} password
 * @returns {Promise<{ success: boolean, token: string, user: Object }>}
 */
export async function login(email, password) {
  const url = wpUrl("jwt-auth/v1/token");

  const data = await request(url, {
    method: "POST",
    body: JSON.stringify({ username: email, password }),
  });

  // JWT Auth plugin returns: { token, user_email, user_nicename, user_display_name }
  return {
    success: true,
    token: data.token,
    user: {
      email: data.user_email,
      displayName: data.user_display_name,
      nicename: data.user_nicename,
    },
  };
}

/**
 * Validate a JWT token (check if it's still valid).
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export async function validateToken(token) {
  try {
    const url = wpUrl("jwt-auth/v1/token/validate");
    await authRequest(url, token, { method: "POST" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Register a new customer.
 * WooCommerce REST API allows creating customers.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.firstName
 * @param {string} params.lastName
 * @param {string} [params.phone]
 * @returns {Promise<{ success: boolean, customerId: string }>}
 */
export async function register({ email, password, firstName, lastName, phone }) {
  const url = wcUrl("customers");

  const data = await request(url, {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      billing: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || "",
      },
    }),
  });

  return {
    success: true,
    customerId: String(data.id),
  };
}

/**
 * Get the current customer's profile.
 * Uses the WP REST API "users/me" endpoint with JWT token.
 *
 * @param {string} token
 * @returns {Promise<Object>} - User profile in frontend format
 */
export async function getProfile(token) {
  // Get WP user data
  const wpUser = await authRequest(wpUrl("wp/v2/users/me", { context: "edit" }), token);

  // Also get WooCommerce customer data for addresses
  // We need the customer ID — use email to find them
  let wcCustomer = null;
  try {
    const customers = await request(wcUrl("customers", { email: wpUser.email }));
    if (customers.length > 0) {
      wcCustomer = customers[0];
    }
  } catch {
    // Customer might not exist in WooCommerce yet
  }

  return mapCustomerProfile(wpUser, wcCustomer);
}

/**
 * Update customer profile.
 * @param {string} token
 * @param {Object} updates - { firstName, lastName, phone }
 * @returns {Promise<Object>} - Updated profile
 */
export async function updateProfile(token, updates) {
  // Get WP user info to find the WC customer ID
  const wpUser = await authRequest(wpUrl("wp/v2/users/me"), token);

  // Find the WC customer
  const customers = await request(wcUrl("customers", { email: wpUser.email }));
  if (!customers.length) throw new Error("Customer not found");

  const customerId = customers[0].id;

  const wcData = {};
  if (updates.firstName) wcData.first_name = updates.firstName;
  if (updates.lastName) wcData.last_name = updates.lastName;
  if (updates.phone) {
    wcData.billing = { ...customers[0].billing, phone: updates.phone };
  }

  const updated = await request(wcUrl(`customers/${customerId}`), {
    method: "PUT",
    body: JSON.stringify(wcData),
  });

  return mapCustomerProfile(wpUser, updated);
}

/**
 * Request password reset email.
 * Note: WordPress doesn't have a built-in REST API for this.
 * Requires a custom plugin or the "Simple JWT Login" plugin.
 *
 * @param {string} email
 */
export async function forgotPassword(email) {
  // This requires a custom WordPress endpoint or plugin.
  // Option 1: Use "WP REST API – Password Reset" plugin
  // Option 2: Create a small custom plugin (see docs/wp-custom-endpoints.md)
  const url = wpUrl("zayn/v1/forgot-password");
  return request(url, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/**
 * Reset password with token.
 * @param {string} resetToken
 * @param {string} newPassword
 * @param {string} [email] - Required by Zayn WP plugin
 */
export async function resetPassword(resetToken, newPassword, email = "") {
  const url = wpUrl("zayn/v1/reset-password");
  return request(url, {
    method: "POST",
    body: JSON.stringify({
      token: resetToken,
      password: newPassword,
      email,
    }),
  });
}

// ────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────

/**
 * Map WP User + WC Customer → frontend user shape.
 *
 * Your frontend expects:
 * { firstName, lastName, email, phone, addresses: [...] }
 */
function mapCustomerProfile(wpUser, wcCustomer) {
  const profile = {
    _id: String(wpUser?.id || wcCustomer?.id || ""),
    firstName: wcCustomer?.first_name || wpUser?.first_name || "",
    lastName: wcCustomer?.last_name || wpUser?.last_name || "",
    email: wcCustomer?.email || wpUser?.email || "",
    phone: wcCustomer?.billing?.phone || "",
    addresses: [],
  };

  // Map WooCommerce billing + shipping addresses
  if (wcCustomer) {
    const billing = wcCustomer.billing || {};
    const shipping = wcCustomer.shipping || {};

    if (billing.address_1) {
      profile.addresses.push({
        _id: "billing",
        label: "Billing Address",
        isDefault: true,
        firstName: billing.first_name || "",
        lastName: billing.last_name || "",
        email: billing.email || "",
        phone: billing.phone || "",
        street: billing.address_1 || "",
        apartment: billing.address_2 || "",
        city: billing.city || "",
        state: billing.state || "",
        zipcode: billing.postcode || "",
        country: billing.country || "IN",
      });
    }

    if (shipping.address_1) {
      profile.addresses.push({
        _id: "shipping",
        label: "Shipping Address",
        isDefault: false,
        firstName: shipping.first_name || "",
        lastName: shipping.last_name || "",
        email: "",
        phone: shipping.phone || "",
        street: shipping.address_1 || "",
        apartment: shipping.address_2 || "",
        city: shipping.city || "",
        state: shipping.state || "",
        zipcode: shipping.postcode || "",
        country: shipping.country || "IN",
      });
    }
  }

  return profile;
}
