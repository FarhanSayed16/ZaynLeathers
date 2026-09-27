<?php
/**
 * Plugin Name: Zayn Leathers Custom API
 * Description: Custom REST API endpoints for the Zayn Leathers headless React frontend.
 *              Covers Razorpay payments, wishlist, settings, shipping, and password reset.
 * Version:     1.0.0
 * Author:      Zayn Leathers Dev
 * License:     GPL-2.0+
 *
 * ─────────────────────────────────────────────────────────────
 * INSTALLATION:
 * 1. Upload this file to: wp-content/plugins/zayn-custom-api/zayn-custom-api.php
 * 2. Activate it from WordPress Admin → Plugins
 * 3. Configure constants below or use wp-config.php defines
 * ─────────────────────────────────────────────────────────────
 */

if ( ! defined( 'ABSPATH' ) ) exit;

/* ────────────────────────────────────────────────
 * 1. CORS — Allow the React frontend origin
 * ──────────────────────────────────────────────── */
add_action( 'init', function () {
    $allowed = [
        'http://localhost:5173',
        'https://zaynleather.com',
        'https://www.zaynleather.com',
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ( in_array( $origin, $allowed, true ) ) {
        header( "Access-Control-Allow-Origin: $origin" );
        header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
        header( 'Access-Control-Allow-Headers: Content-Type, Authorization' );
        header( 'Access-Control-Allow-Credentials: true' );

        if ( $_SERVER['REQUEST_METHOD'] === 'OPTIONS' ) {
            status_header( 200 );
            exit;
        }
    }
});

/* ────────────────────────────────────────────────
 * 2. SITE SETTINGS — /wp-json/zayn/v1/settings
 * ──────────────────────────────────────────────── */
add_action( 'rest_api_init', function () {
    register_rest_route( 'zayn/v1', '/settings', [
        'methods'             => 'GET',
        'callback'            => 'zayn_get_settings',
        'permission_callback' => '__return_true',
    ]);
});

function zayn_get_settings() {
    // These values can be managed via WordPress Admin → Settings → Zayn Leathers
    // or stored as WordPress options
    return rest_ensure_response([
        'deliveryFee'            => (int) get_option( 'zayn_delivery_fee', 41 ),
        'freeShippingThreshold'  => (int) get_option( 'zayn_free_shipping_threshold', 0 ),
        'codEnabled'             => (bool) get_option( 'zayn_cod_enabled', true ),
        'features'               => [
            'invoicing'    => (bool) get_option( 'zayn_invoicing_enabled', false ),
            'videoReviews' => (bool) get_option( 'zayn_video_reviews_enabled', false ),
        ],
        'partialPaymentConfig'   => json_decode( get_option( 'zayn_partial_payment_config', 'null' ), true ),
        'promoStrip'             => get_option( 'zayn_promo_strip', null ),
        'announcement'           => get_option( 'zayn_announcement', null ),
    ]);
}

/* ────────────────────────────────────────────────
 * 3. EXCHANGE RATES — /wp-json/zayn/v1/exchange-rates
 * ──────────────────────────────────────────────── */
add_action( 'rest_api_init', function () {
    register_rest_route( 'zayn/v1', '/exchange-rates', [
        'methods'             => 'GET',
        'callback'            => 'zayn_get_exchange_rates',
        'permission_callback' => '__return_true',
    ]);
});

function zayn_get_exchange_rates() {
    // Cache rates for 6 hours
    $cached = get_transient( 'zayn_exchange_rates' );
    if ( $cached ) {
        return rest_ensure_response([ 'success' => true, 'rates' => $cached ]);
    }

    $response = wp_remote_get( 'https://api.exchangerate-api.com/v4/latest/INR' );
    if ( is_wp_error( $response ) ) {
        return rest_ensure_response([ 'success' => true, 'rates' => [ 'USD' => 0, 'GBP' => 0, 'CAD' => 0 ] ]);
    }

    $body  = json_decode( wp_remote_retrieve_body( $response ), true );
    $rates = [
        'USD' => $body['rates']['USD'] ?? 0,
        'GBP' => $body['rates']['GBP'] ?? 0,
        'CAD' => $body['rates']['CAD'] ?? 0,
    ];

    set_transient( 'zayn_exchange_rates', $rates, 6 * HOUR_IN_SECONDS );

    return rest_ensure_response([ 'success' => true, 'rates' => $rates ]);
}

/* ────────────────────────────────────────────────
 * 4. WISHLIST (fallback) — /wp-json/zayn/v1/wishlist
 *    Uses WordPress user meta if YITH plugin isn't installed
 * ──────────────────────────────────────────────── */
add_action( 'rest_api_init', function () {
    register_rest_route( 'zayn/v1', '/wishlist', [
        'methods'             => 'GET',
        'callback'            => 'zayn_get_wishlist',
        'permission_callback' => 'is_user_logged_in',
    ]);

    register_rest_route( 'zayn/v1', '/wishlist/add', [
        'methods'             => 'POST',
        'callback'            => 'zayn_add_to_wishlist',
        'permission_callback' => 'is_user_logged_in',
    ]);

    register_rest_route( 'zayn/v1', '/wishlist/remove', [
        'methods'             => 'POST',
        'callback'            => 'zayn_remove_from_wishlist',
        'permission_callback' => 'is_user_logged_in',
    ]);
});

function zayn_get_wishlist( $request ) {
    $user_id  = get_current_user_id();
    $wishlist = get_user_meta( $user_id, 'zayn_wishlist', true );
    if ( ! is_array( $wishlist ) ) $wishlist = [];
    return rest_ensure_response([ 'success' => true, 'wishlist' => $wishlist ]);
}

function zayn_add_to_wishlist( $request ) {
    $user_id    = get_current_user_id();
    $product_id = $request->get_param( 'productId' );
    $wishlist   = get_user_meta( $user_id, 'zayn_wishlist', true );
    if ( ! is_array( $wishlist ) ) $wishlist = [];

    if ( ! in_array( $product_id, $wishlist ) ) {
        $wishlist[] = $product_id;
        update_user_meta( $user_id, 'zayn_wishlist', $wishlist );
    }

    return rest_ensure_response([ 'success' => true, 'wishlist' => $wishlist ]);
}

function zayn_remove_from_wishlist( $request ) {
    $user_id    = get_current_user_id();
    $product_id = $request->get_param( 'productId' );
    $wishlist   = get_user_meta( $user_id, 'zayn_wishlist', true );
    if ( ! is_array( $wishlist ) ) $wishlist = [];

    $wishlist = array_values( array_filter( $wishlist, fn( $id ) => $id !== $product_id ) );
    update_user_meta( $user_id, 'zayn_wishlist', $wishlist );

    return rest_ensure_response([ 'success' => true, 'wishlist' => $wishlist ]);
}

/* ────────────────────────────────────────────────
 * 5. PASSWORD RESET — /wp-json/zayn/v1/forgot-password
 * ──────────────────────────────────────────────── */
add_action( 'rest_api_init', function () {
    register_rest_route( 'zayn/v1', '/forgot-password', [
        'methods'             => 'POST',
        'callback'            => 'zayn_forgot_password',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route( 'zayn/v1', '/reset-password', [
        'methods'             => 'POST',
        'callback'            => 'zayn_reset_password',
        'permission_callback' => '__return_true',
    ]);
});

function zayn_forgot_password( $request ) {
    $email = sanitize_email( $request->get_param( 'email' ) );
    $user  = get_user_by( 'email', $email );

    if ( ! $user ) {
        return new WP_Error( 'user_not_found', 'No account found with this email', [ 'status' => 404 ] );
    }

    $key = get_password_reset_key( $user );
    if ( is_wp_error( $key ) ) {
        return new WP_Error( 'reset_failed', 'Could not generate reset link', [ 'status' => 500 ] );
    }

    // Send reset email — link points at React storefront
    $frontend = rtrim( get_option( 'zayn_frontend_url', 'https://zaynleather.com' ), '/' );
    $reset_url = $frontend . '/reset-password/' . rawurlencode( $key ) . '?email=' . rawurlencode( $email );
    $subject   = 'Reset Password — Zayn Leathers';
    $message   = "Hi {$user->display_name},\n\nClick the link below to reset your password:\n\n$reset_url\n\nThis link expires in 24 hours.\n\n— Zayn Leathers";

    wp_mail( $email, $subject, $message );

    return rest_ensure_response([ 'success' => true, 'message' => 'Password reset email sent' ]);
}

function zayn_reset_password( $request ) {
    $key      = $request->get_param( 'token' );
    $email    = sanitize_email( $request->get_param( 'email' ) ?? '' );
    $password = $request->get_param( 'password' );

    $user = get_user_by( 'email', $email );
    if ( ! $user ) {
        return new WP_Error( 'invalid_request', 'Invalid reset request', [ 'status' => 400 ] );
    }

    $check = check_password_reset_key( $key, $user->user_login );
    if ( is_wp_error( $check ) ) {
        return new WP_Error( 'invalid_key', 'Reset link is invalid or expired', [ 'status' => 400 ] );
    }

    reset_password( $user, $password );

    return rest_ensure_response([ 'success' => true, 'message' => 'Password reset successfully' ]);
}

/* ────────────────────────────────────────────────
 * 6. SHIPPING SERVICEABILITY — /wp-json/zayn/v1/shipping/serviceability
 *    Placeholder — connect to Shiprocket / Delhivery as needed
 * ──────────────────────────────────────────────── */
add_action( 'rest_api_init', function () {
    register_rest_route( 'zayn/v1', '/shipping/serviceability', [
        'methods'             => 'GET',
        'callback'            => 'zayn_check_serviceability',
        'permission_callback' => '__return_true',
    ]);
});

function zayn_check_serviceability( $request ) {
    $pincode = sanitize_text_field( $request->get_param( 'pincode' ) );
    $cod     = $request->get_param( 'cod' ) === '1';

    // TODO: Replace with actual Shiprocket / Delhivery API call
    // For now, all pincodes are serviceable
    return rest_ensure_response([
        'success'       => true,
        'serviceable'   => true,
        'estimatedDays' => '5-7 days',
        'deliveryFee'   => (int) get_option( 'zayn_delivery_fee', 41 ),
        'dynamicRates'  => false,
    ]);
}

/* ────────────────────────────────────────────────
 * 7. HERO BANNERS — /wp-json/zayn/v1/hero-banners
 * ──────────────────────────────────────────────── */
add_action( 'rest_api_init', function () {
    register_rest_route( 'zayn/v1', '/hero-banners', [
        'methods'             => 'GET',
        'callback'            => 'zayn_get_hero_banners',
        'permission_callback' => '__return_true',
    ]);
});

function zayn_get_hero_banners() {
    $banners = get_option( 'zayn_hero_banners', null );
    if ( $banners ) {
        $banners = json_decode( $banners, true );
    }
    return rest_ensure_response([ 'banners' => $banners ?: [] ]);
}

/* ────────────────────────────────────────────────
 * 8. RAZORPAY ENDPOINTS — /wp-json/zayn/v1/razorpay/*
 *    Handles order creation and payment verification
 * ──────────────────────────────────────────────── */

// Razorpay credentials (set in wp-config.php or WordPress options)
if ( ! defined( 'ZAYN_RAZORPAY_KEY_ID' ) ) {
    define( 'ZAYN_RAZORPAY_KEY_ID', get_option( 'zayn_razorpay_key_id', '' ) );
}
if ( ! defined( 'ZAYN_RAZORPAY_KEY_SECRET' ) ) {
    define( 'ZAYN_RAZORPAY_KEY_SECRET', get_option( 'zayn_razorpay_key_secret', '' ) );
}

add_action( 'rest_api_init', function () {
    register_rest_route( 'zayn/v1', '/razorpay/create-order', [
        'methods'             => 'POST',
        'callback'            => 'zayn_razorpay_create_order',
        'permission_callback' => 'is_user_logged_in',
    ]);

    register_rest_route( 'zayn/v1', '/razorpay/verify', [
        'methods'             => 'POST',
        'callback'            => 'zayn_razorpay_verify',
        'permission_callback' => 'is_user_logged_in',
    ]);
});

function zayn_razorpay_create_order( $request ) {
    $amount   = (int) ( $request->get_param( 'amount' ) * 100 ); // Razorpay uses paise
    $currency = 'INR';

    $response = wp_remote_post( 'https://api.razorpay.com/v1/orders', [
        'headers' => [
            'Content-Type'  => 'application/json',
            'Authorization' => 'Basic ' . base64_encode( ZAYN_RAZORPAY_KEY_ID . ':' . ZAYN_RAZORPAY_KEY_SECRET ),
        ],
        'body' => wp_json_encode([
            'amount'   => $amount,
            'currency' => $currency,
        ]),
    ]);

    if ( is_wp_error( $response ) ) {
        return new WP_Error( 'razorpay_error', 'Failed to create Razorpay order', [ 'status' => 500 ] );
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );

    return rest_ensure_response([
        'success' => true,
        'order'   => [
            'id'       => $body['id'],
            'amount'   => $body['amount'],
            'currency' => $body['currency'],
        ],
    ]);
}

function zayn_razorpay_verify( $request ) {
    $razorpay_order_id   = sanitize_text_field( $request->get_param( 'razorpay_order_id' ) );
    $razorpay_payment_id = sanitize_text_field( $request->get_param( 'razorpay_payment_id' ) );
    $razorpay_signature  = sanitize_text_field( $request->get_param( 'razorpay_signature' ) );

    // Verify signature
    $expected = hash_hmac( 'sha256', $razorpay_order_id . '|' . $razorpay_payment_id, ZAYN_RAZORPAY_KEY_SECRET );

    if ( $expected !== $razorpay_signature ) {
        return new WP_Error( 'payment_failed', 'Payment verification failed', [ 'status' => 400 ] );
    }

    // Payment is verified — create WooCommerce order
    // The order details are passed from the frontend
    $items     = $request->get_param( 'items' );
    $address   = $request->get_param( 'address' );
    $amount    = $request->get_param( 'amount' );

    $order = wc_create_order([
        'customer_id' => get_current_user_id(),
        'status'      => 'processing',
    ]);

    if ( is_wp_error( $order ) ) {
        return new WP_Error( 'order_failed', 'Failed to create order', [ 'status' => 500 ] );
    }

    // Add line items
    foreach ( $items as $item ) {
        $product = wc_get_product( $item['_id'] );
        if ( $product ) {
            $order->add_product( $product, $item['quantity'] );
        }
    }

    // Set addresses
    if ( $address ) {
        $order->set_billing_first_name( $address['firstName'] ?? '' );
        $order->set_billing_last_name( $address['lastName'] ?? '' );
        $order->set_billing_address_1( $address['street'] ?? '' );
        $order->set_billing_address_2( $address['apartment'] ?? '' );
        $order->set_billing_city( $address['city'] ?? '' );
        $order->set_billing_state( $address['state'] ?? '' );
        $order->set_billing_postcode( $address['zipcode'] ?? '' );
        $order->set_billing_country( 'IN' );
        $order->set_billing_email( $address['email'] ?? '' );
        $order->set_billing_phone( $address['phone'] ?? '' );

        $order->set_shipping_first_name( $address['firstName'] ?? '' );
        $order->set_shipping_last_name( $address['lastName'] ?? '' );
        $order->set_shipping_address_1( $address['street'] ?? '' );
        $order->set_shipping_address_2( $address['apartment'] ?? '' );
        $order->set_shipping_city( $address['city'] ?? '' );
        $order->set_shipping_state( $address['state'] ?? '' );
        $order->set_shipping_postcode( $address['zipcode'] ?? '' );
        $order->set_shipping_country( 'IN' );
    }

    $order->set_payment_method( 'razorpay' );
    $order->set_payment_method_title( 'Razorpay' );
    $order->set_total( $amount );
    $order->payment_complete( $razorpay_payment_id );
    $order->save();

    return rest_ensure_response([
        'success' => true,
        'orderId' => $order->get_id(),
        'message' => 'Payment verified and order placed',
    ]);
}

/* ────────────────────────────────────────────────
 * 9. ADMIN SETTINGS PAGE (optional)
 * ──────────────────────────────────────────────── */
add_action( 'admin_menu', function () {
    add_options_page(
        'Zayn Leathers Settings',
        'Zayn Leathers',
        'manage_options',
        'zayn-settings',
        'zayn_settings_page'
    );
});

function zayn_settings_page() {
    if ( isset( $_POST['zayn_save_settings'] ) ) {
        check_admin_referer( 'zayn_settings_nonce' );
        update_option( 'zayn_delivery_fee', intval( $_POST['zayn_delivery_fee'] ?? 41 ) );
        update_option( 'zayn_free_shipping_threshold', intval( $_POST['zayn_free_shipping_threshold'] ?? 0 ) );
        update_option( 'zayn_cod_enabled', isset( $_POST['zayn_cod_enabled'] ) ? '1' : '' );
        update_option( 'zayn_razorpay_key_id', sanitize_text_field( $_POST['zayn_razorpay_key_id'] ?? '' ) );
        update_option( 'zayn_razorpay_key_secret', sanitize_text_field( $_POST['zayn_razorpay_key_secret'] ?? '' ) );
        update_option( 'zayn_frontend_url', esc_url_raw( $_POST['zayn_frontend_url'] ?? 'https://zaynleather.com' ) );
        echo '<div class="notice notice-success"><p>Settings saved.</p></div>';
    }

    $delivery_fee      = get_option( 'zayn_delivery_fee', 41 );
    $free_threshold    = get_option( 'zayn_free_shipping_threshold', 0 );
    $cod_enabled       = get_option( 'zayn_cod_enabled', '1' );
    $rzp_key           = get_option( 'zayn_razorpay_key_id', '' );
    $rzp_secret        = get_option( 'zayn_razorpay_key_secret', '' );
    $frontend_url      = get_option( 'zayn_frontend_url', 'https://zaynleather.com' );

    ?>
    <div class="wrap">
        <h1>Zayn Leathers Settings</h1>
        <form method="post">
            <?php wp_nonce_field( 'zayn_settings_nonce' ); ?>
            <table class="form-table">
                <tr>
                    <th>Delivery Fee (₹)</th>
                    <td><input type="number" name="zayn_delivery_fee" value="<?php echo esc_attr( $delivery_fee ); ?>" /></td>
                </tr>
                <tr>
                    <th>Free Shipping Threshold (₹)</th>
                    <td><input type="number" name="zayn_free_shipping_threshold" value="<?php echo esc_attr( $free_threshold ); ?>" /></td>
                </tr>
                <tr>
                    <th>COD Enabled</th>
                    <td><input type="checkbox" name="zayn_cod_enabled" <?php checked( $cod_enabled, '1' ); ?> /></td>
                </tr>
                <tr>
                    <th>Razorpay Key ID</th>
                    <td><input type="text" name="zayn_razorpay_key_id" value="<?php echo esc_attr( $rzp_key ); ?>" class="regular-text" /></td>
                </tr>
                <tr>
                    <th>Razorpay Key Secret</th>
                    <td><input type="password" name="zayn_razorpay_key_secret" value="<?php echo esc_attr( $rzp_secret ); ?>" class="regular-text" /></td>
                </tr>
                <tr>
                    <th>React Frontend URL</th>
                    <td><input type="url" name="zayn_frontend_url" value="<?php echo esc_attr( $frontend_url ); ?>" class="regular-text" placeholder="https://zaynleather.com" /></td>
                </tr>
            </table>
            <input type="submit" name="zayn_save_settings" value="Save Settings" class="button-primary" />
        </form>
    </div>
    <?php
}

/* ────────────────────────────────────────────────
 * 10. CONTACT FORM — /wp-json/zayn/v1/contact
 * ──────────────────────────────────────────────── */
add_action( 'rest_api_init', function () {
    register_rest_route( 'zayn/v1', '/contact', [
        'methods'             => 'POST',
        'callback'            => 'zayn_submit_contact',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route( 'zayn/v1', '/instagram-promos', [
        'methods'             => 'GET',
        'callback'            => 'zayn_get_instagram_promos',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route( 'zayn/v1', '/change-password', [
        'methods'             => 'POST',
        'callback'            => 'zayn_change_password',
        'permission_callback' => 'is_user_logged_in',
    ]);

    register_rest_route( 'zayn/v1', '/addresses', [
        'methods'             => [ 'POST', 'PUT', 'DELETE' ],
        'callback'            => 'zayn_manage_addresses',
        'permission_callback' => 'is_user_logged_in',
    ]);

    register_rest_route( 'zayn/v1', '/addresses/default', [
        'methods'             => 'POST',
        'callback'            => 'zayn_set_default_address',
        'permission_callback' => 'is_user_logged_in',
    ]);
});

function zayn_submit_contact( $request ) {
    $name    = sanitize_text_field( $request->get_param( 'name' ) );
    $email   = sanitize_email( $request->get_param( 'email' ) );
    $phone   = sanitize_text_field( $request->get_param( 'phone' ) );
    $message = sanitize_textarea_field( $request->get_param( 'message' ) );

    if ( ! $name || ! $email || ! $message ) {
        return new WP_Error( 'invalid', 'Name, email and message are required', [ 'status' => 400 ] );
    }

    $to      = get_option( 'admin_email' );
    $subject = "Contact form — Zayn Leathers — $name";
    $body    = "Name: $name\nEmail: $email\nPhone: $phone\n\n$message";
    $headers = [ "Reply-To: $name <$email>" ];

    $sent = wp_mail( $to, $subject, $body, $headers );

    // Also store as a private post for admin inbox
    wp_insert_post([
        'post_type'    => 'zayn_contact',
        'post_title'   => $name . ' — ' . $email,
        'post_content' => $body,
        'post_status'  => 'private',
    ]);

    if ( ! $sent ) {
        return rest_ensure_response([
            'success' => true,
            'message' => 'Message received. We will get back to you soon.',
        ]);
    }

    return rest_ensure_response([
        'success' => true,
        'message' => 'Message sent successfully! We will reply soon.',
    ]);
}

function zayn_get_instagram_promos() {
    $promos = get_option( 'zayn_instagram_promos', null );
    if ( $promos ) {
        $promos = json_decode( $promos, true );
    }
    return rest_ensure_response([ 'promos' => is_array( $promos ) ? $promos : [] ]);
}

function zayn_change_password( $request ) {
    $user_id          = get_current_user_id();
    $current_password = $request->get_param( 'currentPassword' );
    $new_password     = $request->get_param( 'newPassword' );

    $user = get_userdata( $user_id );
    if ( ! $user || ! wp_check_password( $current_password, $user->user_pass, $user_id ) ) {
        return new WP_Error( 'bad_password', 'Current password is incorrect', [ 'status' => 400 ] );
    }

    if ( strlen( $new_password ) < 8 ) {
        return new WP_Error( 'weak_password', 'Password must be at least 8 characters', [ 'status' => 400 ] );
    }

    wp_set_password( $new_password, $user_id );

    return rest_ensure_response([ 'success' => true, 'message' => 'Password updated' ]);
}

function zayn_manage_addresses( $request ) {
    if ( ! function_exists( 'WC' ) ) {
        return new WP_Error( 'woo_missing', 'WooCommerce is required', [ 'status' => 500 ] );
    }

    $user_id    = get_current_user_id();
    $customer   = new WC_Customer( $user_id );
    $method     = $request->get_method();
    $address_id = $request->get_param( 'addressId' ) ?: 'billing';
    $slot       = ( $address_id === 'shipping' ) ? 'shipping' : 'billing';

    if ( $method === 'DELETE' ) {
        if ( $slot === 'billing' ) {
            $customer->set_billing_address_1( '' );
            $customer->set_billing_address_2( '' );
            $customer->set_billing_city( '' );
            $customer->set_billing_state( '' );
            $customer->set_billing_postcode( '' );
        } else {
            $customer->set_shipping_address_1( '' );
            $customer->set_shipping_address_2( '' );
            $customer->set_shipping_city( '' );
            $customer->set_shipping_state( '' );
            $customer->set_shipping_postcode( '' );
        }
        $customer->save();
        return rest_ensure_response([ 'success' => true, 'message' => 'Address removed' ]);
    }

    $first = sanitize_text_field( $request->get_param( 'firstName' ) );
    $last  = sanitize_text_field( $request->get_param( 'lastName' ) );
    $street = sanitize_text_field( $request->get_param( 'street' ) );
    $apt   = sanitize_text_field( $request->get_param( 'apartment' ) );
    $city  = sanitize_text_field( $request->get_param( 'city' ) );
    $state = sanitize_text_field( $request->get_param( 'state' ) );
    $zip   = sanitize_text_field( $request->get_param( 'zipcode' ) );
    $phone = sanitize_text_field( $request->get_param( 'phone' ) );
    $email = sanitize_email( $request->get_param( 'email' ) );

    if ( $slot === 'billing' ) {
        $customer->set_billing_first_name( $first );
        $customer->set_billing_last_name( $last );
        $customer->set_billing_address_1( $street );
        $customer->set_billing_address_2( $apt );
        $customer->set_billing_city( $city );
        $customer->set_billing_state( $state );
        $customer->set_billing_postcode( $zip );
        $customer->set_billing_country( 'IN' );
        $customer->set_billing_phone( $phone );
        if ( $email ) $customer->set_billing_email( $email );
    } else {
        $customer->set_shipping_first_name( $first );
        $customer->set_shipping_last_name( $last );
        $customer->set_shipping_address_1( $street );
        $customer->set_shipping_address_2( $apt );
        $customer->set_shipping_city( $city );
        $customer->set_shipping_state( $state );
        $customer->set_shipping_postcode( $zip );
        $customer->set_shipping_country( 'IN' );
        $customer->set_shipping_phone( $phone );
    }

    // Also update display name fields
    if ( $first ) $customer->set_first_name( $first );
    if ( $last ) $customer->set_last_name( $last );
    $customer->save();

    return rest_ensure_response([ 'success' => true, 'message' => 'Address saved' ]);
}

function zayn_set_default_address( $request ) {
    // Woo has billing as primary; shipping is secondary — acknowledge only
    return rest_ensure_response([ 'success' => true, 'message' => 'Default address updated' ]);
}

add_action( 'init', function () {
    register_post_type( 'zayn_contact', [
        'labels'       => [ 'name' => 'Contact Messages', 'singular_name' => 'Contact Message' ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'supports'     => [ 'title', 'editor' ],
        'menu_icon'    => 'dashicons-email',
    ]);
});
