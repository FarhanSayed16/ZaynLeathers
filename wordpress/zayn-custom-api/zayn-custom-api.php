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
 *    Must also run on rest_pre_serve_request so Woo
 *    Store API responses include Allow-Origin (www).
 * ──────────────────────────────────────────────── */
function zayn_allowed_origins() {
    $allowed = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://zaynleather.com',
        'https://www.zaynleather.com',
    ];

    $frontend = rtrim( (string) get_option( 'zayn_frontend_url', '' ), '/' );
    if ( $frontend ) {
        $allowed[] = $frontend;
        // Also allow www / apex twin of the configured frontend URL
        if ( str_starts_with( $frontend, 'https://www.' ) ) {
            $allowed[] = 'https://' . substr( $frontend, strlen( 'https://www.' ) );
        } elseif ( str_starts_with( $frontend, 'https://' ) ) {
            $allowed[] = 'https://www.' . substr( $frontend, strlen( 'https://' ) );
        }
    }

    $extra = get_option( 'zayn_cors_origins', '' );
    if ( is_string( $extra ) && $extra !== '' ) {
        foreach ( array_filter( array_map( 'trim', explode( ',', $extra ) ) ) as $origin_extra ) {
            $allowed[] = rtrim( $origin_extra, '/' );
        }
    }

    return array_values( array_unique( $allowed ) );
}

function zayn_request_origin() {
    return isset( $_SERVER['HTTP_ORIGIN'] ) ? rtrim( (string) $_SERVER['HTTP_ORIGIN'], '/' ) : '';
}

function zayn_origin_is_allowed( $origin ) {
    if ( ! $origin ) {
        return false;
    }
    return in_array( $origin, zayn_allowed_origins(), true )
        || (bool) preg_match( '#^https://[a-z0-9-]+\.vercel\.app$#i', $origin );
}

function zayn_send_cors_headers() {
    $origin = zayn_request_origin();
    if ( ! zayn_origin_is_allowed( $origin ) ) {
        return false;
    }

    // Never let LiteSpeed / CDN cache REST responses with a sticky CORS origin.
    // A cached Allow-Origin from a Vercel preview breaks www.zaynleather.com.
    if ( function_exists( 'header_remove' ) ) {
        header_remove( 'Access-Control-Allow-Origin' );
    }
    header( "Access-Control-Allow-Origin: $origin" );
    header( 'Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS' );
    header( 'Access-Control-Allow-Headers: Content-Type, Authorization, Cart-Token, Nonce, X-WC-Store-API-Nonce, X-WP-Nonce' );
    header( 'Access-Control-Expose-Headers: Cart-Token, Nonce, X-WC-Store-API-Nonce, X-WP-Total, X-WP-TotalPages, Link' );
    header( 'Access-Control-Allow-Credentials: true' );
    header( 'Vary: Origin', false );
    header( 'Cache-Control: no-store, no-cache, must-revalidate, max-age=0' );
    header( 'Pragma: no-cache' );
    header( 'X-LiteSpeed-Cache-Control: no-cache' );
    if ( function_exists( 'do_action' ) ) {
        do_action( 'litespeed_control_set_nocache', 'zayn cors api' );
    }
    return true;
}

add_action( 'init', function () {
    if ( ! zayn_send_cors_headers() ) {
        return;
    }
    if ( ( $_SERVER['REQUEST_METHOD'] ?? '' ) === 'OPTIONS' ) {
        status_header( 200 );
        exit;
    }
}, 0 );

// Force CORS + no-cache on every REST response (including custom zayn routes).
add_filter( 'rest_pre_serve_request', function ( $served ) {
    zayn_send_cors_headers();
    return $served;
}, 15 );

// Mark all /wp-json/ traffic uncacheable when an Origin is present (headless shop).
add_action( 'rest_api_init', function () {
    if ( zayn_request_origin() ) {
        if ( ! defined( 'DONOTCACHEPAGE' ) ) {
            define( 'DONOTCACHEPAGE', true );
        }
        if ( ! defined( 'LSCACHE_NO_CACHE' ) ) {
            define( 'LSCACHE_NO_CACHE', true );
        }
        do_action( 'litespeed_control_set_nocache', 'zayn rest origin' );
    }
}, 0 );

/*
 * WooCommerce Store API only adds Access-Control-Allow-Origin when the
 * Origin passes is_allowed_http_origin() OR a valid Cart-Token is sent.
 * Register the React shop origins so www.zaynleather.com is allowed.
 */
add_filter( 'allowed_http_origins', function ( $origins ) {
    return array_values( array_unique( array_merge( (array) $origins, zayn_allowed_origins() ) ) );
} );

add_filter( 'allowed_http_origin', function ( $allowed, $origin ) {
    $origin = rtrim( (string) $origin, '/' );
    return $allowed || zayn_origin_is_allowed( $origin );
}, 10, 2 );

// Prefer Cart-Token over Nonce for headless; keep nonce check off as fallback.
add_filter( 'woocommerce_store_api_disable_nonce_check', '__return_true' );

/* ────────────────────────────────────────────────
 * 1b. CLEAN ORDER NUMBERS (#1001, #1002, …)
 *     Woo uses the shared WP post ID (products already
 *     consumed ~23k IDs). We store a separate shop number.
 * ──────────────────────────────────────────────── */
add_action( 'init', function () {
    if ( false === get_option( 'zayn_next_order_number', false ) ) {
        update_option( 'zayn_next_order_number', 1001 );
    }
} );

/**
 * Assign the next clean shop order number once per order.
 *
 * @param int|WC_Order $order_id Order id or object.
 */
function zayn_assign_order_number( $order_id ) {
    $order = $order_id instanceof WC_Order ? $order_id : wc_get_order( $order_id );
    if ( ! $order ) {
        return;
    }
    if ( $order->get_meta( '_zayn_order_number' ) ) {
        return;
    }

    $next = (int) get_option( 'zayn_next_order_number', 1001 );
    if ( $next < 1 ) {
        $next = 1001;
    }

    $order->update_meta_data( '_zayn_order_number', (string) $next );
    $order->save();
    update_option( 'zayn_next_order_number', $next + 1 );
}

add_action( 'woocommerce_new_order', 'zayn_assign_order_number', 20 );
add_action( 'woocommerce_checkout_order_processed', 'zayn_assign_order_number', 20 );

add_filter( 'woocommerce_order_number', function ( $order_number, $order ) {
    $custom = $order ? $order->get_meta( '_zayn_order_number' ) : '';
    return $custom !== '' && $custom !== null ? (string) $custom : $order_number;
}, 10, 2 );

/**
 * One-time: give existing orders clean numbers (oldest first).
 */
function zayn_backfill_order_numbers() {
    if ( ! function_exists( 'wc_get_orders' ) ) {
        return 0;
    }
    $orders = wc_get_orders([
        'limit'   => -1,
        'orderby' => 'date',
        'order'   => 'ASC',
        'return'  => 'objects',
    ]);
    $count = 0;
    $next  = 1001;
    foreach ( $orders as $order ) {
        $order->update_meta_data( '_zayn_order_number', (string) $next );
        $order->save();
        $next++;
        $count++;
    }
    update_option( 'zayn_next_order_number', $next );
    return $count;
}

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

function zayn_default_heroes() {
    return [
        [
            'image'     => '/brand/heroes/banner-1-men.png',
            'title'     => 'Leather jackets',
            'highlight' => 'For him',
            'subtitle'  => 'Built for the road and the city.',
            'ctaLabel'  => 'Shop men',
            'ctaLink'   => '/shop?department=men',
            'isActive'  => true,
        ],
        [
            'image'     => '/brand/heroes/banner-2-women.png',
            'title'     => 'For her',
            'highlight' => 'Suede & leather',
            'subtitle'  => 'Biker silhouettes in real leather.',
            'ctaLabel'  => 'Shop women',
            'ctaLink'   => '/shop?department=women',
            'isActive'  => true,
        ],
        [
            'image'     => '/brand/heroes/banner-3-accessories.png',
            'title'     => 'Leather bags',
            'highlight' => 'Everyday carry',
            'subtitle'  => 'Totes, belts, and leather essentials.',
            'ctaLabel'  => 'Shop accessories',
            'ctaLink'   => '/shop?department=accessories',
            'isActive'  => true,
        ],
        [
            'image'     => '/brand/heroes/banner-4-collection.png',
            'title'     => 'The collection',
            'highlight' => 'Made to last',
            'subtitle'  => 'Jackets cut to be worn often and kept longer.',
            'ctaLabel'  => 'Shop all',
            'ctaLink'   => '/shop',
            'isActive'  => true,
        ],
    ];
}

function zayn_default_category_tiles() {
    return [
        [ 'label' => 'Men', 'image' => '/brand/categories/men.png', 'link' => '/shop?department=men', 'order' => 0 ],
        [ 'label' => 'Women', 'image' => '/brand/categories/women.png', 'link' => '/shop?department=women', 'order' => 1 ],
        [ 'label' => 'Accessories', 'image' => '/brand/categories/accessories.png', 'link' => '/shop?department=accessories', 'order' => 2 ],
        [ 'label' => 'Kids', 'image' => '/brand/categories/kids.png', 'link' => '/shop?department=kids', 'order' => 3 ],
    ];
}

function zayn_saved_list( $option, $defaults ) {
    $raw = get_option( $option, '' );
    $list = is_string( $raw ) && $raw !== '' ? json_decode( $raw, true ) : null;
    if ( ! is_array( $list ) || ! count( $list ) ) {
        return $defaults;
    }
    return $list;
}

function zayn_get_settings() {
    $promo_raw = get_option( 'zayn_promo_strip', '' );
    $promo     = null;
    if ( is_string( $promo_raw ) && $promo_raw !== '' ) {
        $decoded = json_decode( $promo_raw, true );
        if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
            $promo = $decoded;
        } else {
            $promo = [
                'isActive' => true,
                'message'  => $promo_raw,
                'link'     => '',
            ];
        }
    } elseif ( is_array( $promo_raw ) ) {
        $promo = $promo_raw;
    }

    $home_raw = get_option( 'zayn_home_config', '{}' );
    $home     = json_decode( is_string( $home_raw ) ? $home_raw : '{}', true );
    if ( ! is_array( $home ) ) {
        $home = [];
    }

    return rest_ensure_response([
        'deliveryFee'            => (int) get_option( 'zayn_delivery_fee', 41 ),
        'freeShippingThreshold'  => (int) get_option( 'zayn_free_shipping_threshold', 2999 ),
        'codEnabled'             => (bool) get_option( 'zayn_cod_enabled', true ),
        'features'               => [
            'invoicing'    => (bool) get_option( 'zayn_invoicing_enabled', false ),
            'videoReviews' => (bool) get_option( 'zayn_video_reviews_enabled', false ),
        ],
        'partialPaymentConfig'   => json_decode( get_option( 'zayn_partial_payment_config', 'null' ), true ),
        'promoStrip'             => $promo,
        'announcement'           => get_option( 'zayn_announcement', null ),
        'homeConfig'             => [
            'featuredProductIds'   => array_map( 'strval', $home['featuredProductIds'] ?? [] ),
            'newArrivalProductIds' => array_map( 'strval', $home['newArrivalProductIds'] ?? [] ),
            'bestsellerProductIds' => array_map( 'strval', $home['bestsellerProductIds'] ?? [] ),
        ],
        'categoryTiles'          => zayn_saved_list( 'zayn_category_tiles', zayn_default_category_tiles() ),
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
    return rest_ensure_response([
        'banners' => zayn_saved_list( 'zayn_hero_banners', zayn_default_heroes() ),
    ]);
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
    $amount   = (int) round( (float) $request->get_param( 'amount' ) * 100 ); // paise
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
    zayn_assign_order_number( $order );

    return rest_ensure_response([
        'success' => true,
        'orderId' => $order->get_id(),
        'orderNumber' => $order->get_order_number(),
        'message' => 'Payment verified and order placed',
    ]);
}

/* ────────────────────────────────────────────────
 * 9. ADMIN — client-friendly “Zayn Shop” hub
 * ──────────────────────────────────────────────── */
add_action( 'admin_menu', function () {
    add_menu_page(
        'Zayn Shop',
        'Zayn Shop',
        'manage_woocommerce',
        'zayn-settings',
        'zayn_settings_page',
        'dashicons-store',
        56
    );
    add_submenu_page(
        'zayn-settings',
        'Shop settings',
        'Shop settings',
        'manage_woocommerce',
        'zayn-settings',
        'zayn_settings_page'
    );
    // Keep old Settings → Zayn Leathers URL working.
    add_options_page(
        'Zayn Leathers Settings',
        'Zayn Leathers',
        'manage_options',
        'zayn-settings-legacy',
        function () {
            wp_safe_redirect( admin_url( 'admin.php?page=zayn-settings' ) );
            exit;
        }
    );
});

add_action( 'admin_bar_menu', function ( $bar ) {
    if ( ! current_user_can( 'manage_woocommerce' ) ) {
        return;
    }
    $shop = rtrim( (string) get_option( 'zayn_frontend_url', 'https://zaynleather.com' ), '/' );
    $bar->add_node([
        'id'    => 'zayn-view-shop',
        'title' => 'View live shop',
        'href'  => $shop ?: 'https://zaynleather.com',
        'meta'  => [ 'target' => '_blank' ],
    ]);
    $bar->add_node([
        'id'    => 'zayn-shop-settings',
        'title' => 'Zayn Shop settings',
        'href'  => admin_url( 'admin.php?page=zayn-settings' ),
    ]);
}, 80 );

add_action( 'wp_dashboard_setup', function () {
    if ( ! current_user_can( 'manage_woocommerce' ) ) {
        return;
    }
    wp_add_dashboard_widget( 'zayn_shop_help', 'Zayn Shop — quick help', 'zayn_dashboard_widget' );
});

function zayn_dashboard_widget() {
    $shop = esc_url( rtrim( (string) get_option( 'zayn_frontend_url', 'https://zaynleather.com' ), '/' ) );
    $processing = function_exists( 'wc_orders_count' ) ? (int) wc_orders_count( 'processing' ) : 0;
    $on_hold    = function_exists( 'wc_orders_count' ) ? (int) wc_orders_count( 'on-hold' ) : 0;
    echo '<p><strong>Orders needing attention:</strong> '
        . (int) $processing . ' processing · '
        . (int) $on_hold . ' on hold</p>';
    echo '<p>';
    echo '<a class="button button-primary" href="' . esc_url( admin_url( 'admin.php?page=wc-orders' ) ) . '">Orders</a> ';
    echo '<a class="button" href="' . esc_url( admin_url( 'edit.php?post_type=product' ) ) . '">Products</a> ';
    echo '<a class="button" href="' . esc_url( admin_url( 'upload.php' ) ) . '">Media / photos</a> ';
    echo '<a class="button" href="' . esc_url( admin_url( 'admin.php?page=zayn-settings' ) ) . '">Shop settings</a> ';
    echo '<a class="button" href="' . $shop . '" target="_blank" rel="noopener">Open live site</a>';
    echo '</p>';
    echo '<p class="description">To feature a product on the homepage: edit the product → check <strong>Featured</strong>, or add tag <code>new-arrival</code> / <code>bestseller</code>.</p>';
}

add_action( 'admin_enqueue_scripts', function ( $hook ) {
    if ( $hook !== 'toplevel_page_zayn-settings' && $hook !== 'zayn-shop_page_zayn-settings' ) {
        return;
    }
    wp_enqueue_media();
    wp_enqueue_script( 'jquery' );
} );

/**
 * Allow absolute media URLs or site-relative paths like /brand/...
 */
function zayn_sanitize_media_ref( $value ) {
    $value = trim( (string) wp_unslash( $value ) );
    if ( $value === '' ) {
        return '';
    }
    if ( preg_match( '#^https?://#i', $value ) ) {
        return esc_url_raw( $value );
    }
    return sanitize_text_field( $value );
}

/**
 * Image field with WordPress Media Library upload button + preview.
 */
function zayn_render_media_field( $name, $value, $label = 'Image', $hint = '' ) {
    $value   = (string) $value;
    $is_http = ( strpos( $value, 'http' ) === 0 || strpos( $value, '//' ) === 0 );
    ?>
    <div class="zayn-media-field" style="margin-bottom:14px;padding:12px;background:#fff;border:1px solid #dcdcde;border-radius:4px;max-width:520px;">
        <label style="display:block;margin-bottom:6px;"><strong><?php echo esc_html( $label ); ?></strong></label>
        <?php if ( $hint ) : ?>
            <p class="description" style="margin-top:0;"><?php echo esc_html( $hint ); ?></p>
        <?php endif; ?>
        <div class="zayn-media-preview-wrap" style="min-height:24px;">
            <?php if ( $value !== '' && $is_http ) : ?>
                <img class="zayn-media-preview" src="<?php echo esc_url( $value ); ?>" alt="" style="display:block;max-width:100%;height:auto;max-height:140px;margin:8px 0;object-fit:cover;border:1px solid #c3c4c7;background:#f0f0f1;" />
            <?php elseif ( $value !== '' ) : ?>
                <p class="description" style="margin:8px 0;">Using the default shop image. Click <strong>Upload / Select image</strong> to replace it with your own photo.</p>
            <?php else : ?>
                <p class="description" style="margin:8px 0;">No image yet.</p>
            <?php endif; ?>
        </div>
        <p style="margin:8px 0;">
            <button type="button" class="button button-primary zayn-media-upload">Upload / Select image</button>
            <button type="button" class="button zayn-media-clear" <?php disabled( $value === '' ); ?>>Clear</button>
        </p>
        <details style="margin-top:6px;">
            <summary style="cursor:pointer;color:#646970;">Show image link (advanced)</summary>
            <input type="text" class="large-text zayn-media-url" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $value ); ?>" style="margin-top:6px;" />
        </details>
    </div>
    <?php
}

function zayn_settings_page() {
    if ( isset( $_POST['zayn_backfill_order_numbers'] ) ) {
        check_admin_referer( 'zayn_settings_nonce' );
        $n = zayn_backfill_order_numbers();
        echo '<div class="notice notice-success"><p>Renumbered ' . (int) $n . ' orders starting at #1001. Next new order will continue from there.</p></div>';
    }

    if ( isset( $_POST['zayn_save_settings'] ) ) {
        check_admin_referer( 'zayn_settings_nonce' );
        update_option( 'zayn_delivery_fee', intval( $_POST['zayn_delivery_fee'] ?? 41 ) );
        update_option( 'zayn_free_shipping_threshold', intval( $_POST['zayn_free_shipping_threshold'] ?? 2999 ) );
        update_option( 'zayn_cod_enabled', isset( $_POST['zayn_cod_enabled'] ) ? '1' : '' );
        update_option( 'zayn_razorpay_key_id', sanitize_text_field( $_POST['zayn_razorpay_key_id'] ?? '' ) );
        update_option( 'zayn_razorpay_key_secret', sanitize_text_field( $_POST['zayn_razorpay_key_secret'] ?? '' ) );
        update_option( 'zayn_frontend_url', esc_url_raw( $_POST['zayn_frontend_url'] ?? 'https://zaynleather.com' ) );
        update_option( 'zayn_cors_origins', sanitize_text_field( $_POST['zayn_cors_origins'] ?? '' ) );
        $next_ord = max( 1, intval( $_POST['zayn_next_order_number'] ?? 1001 ) );
        update_option( 'zayn_next_order_number', $next_ord );

        $promo = [
            'isActive' => isset( $_POST['zayn_promo_active'] ),
            'message'  => sanitize_text_field( $_POST['zayn_promo_message'] ?? '' ),
            'link'     => esc_url_raw( $_POST['zayn_promo_link'] ?? '' ),
        ];
        update_option( 'zayn_promo_strip', wp_json_encode( $promo ) );

        $home = [
            'newArrivalProductIds' => array_values( array_filter( array_map( 'trim', explode( ',', sanitize_text_field( $_POST['zayn_new_arrival_ids'] ?? '' ) ) ) ) ),
            'bestsellerProductIds' => array_values( array_filter( array_map( 'trim', explode( ',', sanitize_text_field( $_POST['zayn_bestseller_ids'] ?? '' ) ) ) ) ),
            'featuredProductIds'   => array_values( array_filter( array_map( 'trim', explode( ',', sanitize_text_field( $_POST['zayn_featured_ids'] ?? '' ) ) ) ) ),
        ];
        update_option( 'zayn_home_config', wp_json_encode( $home ) );

        $hero_defaults = zayn_default_heroes();
        $heroes        = [];
        for ( $i = 0; $i < 4; $i++ ) {
            $fallback = $hero_defaults[ $i ];
            $image    = zayn_sanitize_media_ref( $_POST[ "zayn_hero_image_$i" ] ?? '' );
            $heroes[] = [
                'image'     => $image !== '' ? $image : $fallback['image'],
                'title'     => sanitize_text_field( wp_unslash( $_POST[ "zayn_hero_title_$i" ] ?? $fallback['title'] ) ),
                'highlight' => sanitize_text_field( wp_unslash( $_POST[ "zayn_hero_highlight_$i" ] ?? '' ) ),
                'subtitle'  => sanitize_text_field( wp_unslash( $_POST[ "zayn_hero_subtitle_$i" ] ?? '' ) ),
                'ctaLabel'  => sanitize_text_field( wp_unslash( $_POST[ "zayn_hero_cta_$i" ] ?? '' ) ),
                'ctaLink'   => sanitize_text_field( wp_unslash( $_POST[ "zayn_hero_link_$i" ] ?? $fallback['ctaLink'] ) ),
                'isActive'  => isset( $_POST[ "zayn_hero_active_$i" ] ),
            ];
        }
        update_option( 'zayn_hero_banners', wp_json_encode( $heroes ) );

        $tile_defaults = zayn_default_category_tiles();
        $tiles         = [];
        for ( $i = 0; $i < 4; $i++ ) {
            $fallback = $tile_defaults[ $i ];
            $image    = zayn_sanitize_media_ref( $_POST[ "zayn_tile_image_$i" ] ?? '' );
            $tiles[]  = [
                'label' => sanitize_text_field( wp_unslash( $_POST[ "zayn_tile_label_$i" ] ?? $fallback['label'] ) ),
                'image' => $image !== '' ? $image : $fallback['image'],
                'link'  => sanitize_text_field( wp_unslash( $_POST[ "zayn_tile_link_$i" ] ?? $fallback['link'] ) ),
                'order' => $i,
            ];
        }
        update_option( 'zayn_category_tiles', wp_json_encode( $tiles ) );

        $reels = [];
        for ( $i = 0; $i < 6; $i++ ) {
            $reels[] = [
                'instagramLink' => esc_url_raw( wp_unslash( $_POST[ "zayn_reel_url_$i" ] ?? '' ) ),
                'image'         => zayn_sanitize_media_ref( $_POST[ "zayn_reel_image_$i" ] ?? '' ),
                'caption'       => sanitize_text_field( wp_unslash( $_POST[ "zayn_reel_caption_$i" ] ?? '' ) ),
                'productLink'   => sanitize_text_field( wp_unslash( $_POST[ "zayn_reel_product_$i" ] ?? '' ) ),
            ];
        }
        update_option( 'zayn_instagram_promos', wp_json_encode( $reels ) );

        echo '<div class="notice notice-success"><p>Settings saved.</p></div>';
    }

    $delivery_fee      = get_option( 'zayn_delivery_fee', 41 );
    $free_threshold    = get_option( 'zayn_free_shipping_threshold', 2999 );
    $cod_enabled       = get_option( 'zayn_cod_enabled', '1' );
    $rzp_key           = get_option( 'zayn_razorpay_key_id', '' );
    $rzp_secret        = get_option( 'zayn_razorpay_key_secret', '' );
    $frontend_url      = get_option( 'zayn_frontend_url', 'https://zaynleather.com' );
    $cors_origins      = get_option( 'zayn_cors_origins', '' );
    $next_order_num    = (int) get_option( 'zayn_next_order_number', 1001 );

    $promo_raw = get_option( 'zayn_promo_strip', '' );
    $promo     = json_decode( is_string( $promo_raw ) ? $promo_raw : '', true );
    if ( ! is_array( $promo ) ) {
        $promo = [ 'isActive' => true, 'message' => is_string( $promo_raw ) ? $promo_raw : '', 'link' => '' ];
    }

    $home = json_decode( (string) get_option( 'zayn_home_config', '{}' ), true );
    if ( ! is_array( $home ) ) {
        $home = [];
    }

    $heroes = zayn_saved_list( 'zayn_hero_banners', zayn_default_heroes() );
    $tiles  = zayn_saved_list( 'zayn_category_tiles', zayn_default_category_tiles() );
    $reels  = json_decode( (string) get_option( 'zayn_instagram_promos', '[]' ), true );
    if ( ! is_array( $reels ) ) {
        $reels = [];
    }

    $shop_url = esc_url( rtrim( (string) $frontend_url, '/' ) ?: 'https://zaynleather.com' );
    $tab      = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'everyday';
    if ( ! in_array( $tab, [ 'everyday', 'homepage', 'orders', 'advanced' ], true ) ) {
        $tab = 'everyday';
    }
    $base = admin_url( 'admin.php?page=zayn-settings' );
    ?>
    <div class="wrap zayn-shop-wrap">
        <h1>Zayn Shop</h1>
        <p style="font-size:14px;max-width:720px;">Use this page to run the live storefront. Products and orders stay in the normal WooCommerce menus — shortcuts are below.</p>

        <div style="display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 20px;">
            <a class="button button-primary" href="<?php echo esc_url( admin_url( 'admin.php?page=wc-orders' ) ); ?>">Orders</a>
            <a class="button" href="<?php echo esc_url( admin_url( 'edit.php?post_type=product' ) ); ?>">Products</a>
            <a class="button" href="<?php echo esc_url( admin_url( 'post-new.php?post_type=product' ) ); ?>">Add product</a>
            <a class="button" href="<?php echo esc_url( admin_url( 'upload.php' ) ); ?>">Photos (Media)</a>
            <a class="button" href="<?php echo esc_url( admin_url( 'edit.php?post_type=shop_coupon' ) ); ?>">Coupons</a>
            <a class="button" href="<?php echo esc_url( admin_url( 'admin.php?page=wc-settings&tab=shipping' ) ); ?>">Shipping zones</a>
            <a class="button" href="<?php echo $shop_url; ?>" target="_blank" rel="noopener">Open live shop ↗</a>
        </div>

        <nav class="nav-tab-wrapper" style="margin-bottom:16px;">
            <a href="<?php echo esc_url( $base . '&tab=everyday' ); ?>" class="nav-tab <?php echo $tab === 'everyday' ? 'nav-tab-active' : ''; ?>">Everyday</a>
            <a href="<?php echo esc_url( $base . '&tab=homepage' ); ?>" class="nav-tab <?php echo $tab === 'homepage' ? 'nav-tab-active' : ''; ?>">Homepage</a>
            <a href="<?php echo esc_url( $base . '&tab=orders' ); ?>" class="nav-tab <?php echo $tab === 'orders' ? 'nav-tab-active' : ''; ?>">Order numbers</a>
            <a href="<?php echo esc_url( $base . '&tab=advanced' ); ?>" class="nav-tab <?php echo $tab === 'advanced' ? 'nav-tab-active' : ''; ?>">Advanced</a>
        </nav>

        <form method="post" action="<?php echo esc_url( $base . '&tab=' . $tab ); ?>">
            <?php wp_nonce_field( 'zayn_settings_nonce' ); ?>
            <input type="hidden" name="zayn_active_tab" value="<?php echo esc_attr( $tab ); ?>" />

            <?php /* Preserve fields from other tabs when saving one tab */ ?>
            <?php if ( $tab !== 'everyday' ) : ?>
                <input type="hidden" name="zayn_delivery_fee" value="<?php echo esc_attr( $delivery_fee ); ?>" />
                <input type="hidden" name="zayn_free_shipping_threshold" value="<?php echo esc_attr( $free_threshold ); ?>" />
                <?php if ( $cod_enabled ) : ?><input type="hidden" name="zayn_cod_enabled" value="1" /><?php endif; ?>
                <?php if ( ! empty( $promo['isActive'] ) ) : ?><input type="hidden" name="zayn_promo_active" value="1" /><?php endif; ?>
                <input type="hidden" name="zayn_promo_message" value="<?php echo esc_attr( $promo['message'] ?? '' ); ?>" />
                <input type="hidden" name="zayn_promo_link" value="<?php echo esc_attr( $promo['link'] ?? '' ); ?>" />
            <?php endif; ?>
            <?php if ( $tab !== 'homepage' ) : ?>
                <input type="hidden" name="zayn_new_arrival_ids" value="<?php echo esc_attr( implode( ',', $home['newArrivalProductIds'] ?? [] ) ); ?>" />
                <input type="hidden" name="zayn_bestseller_ids" value="<?php echo esc_attr( implode( ',', $home['bestsellerProductIds'] ?? [] ) ); ?>" />
                <input type="hidden" name="zayn_featured_ids" value="<?php echo esc_attr( implode( ',', $home['featuredProductIds'] ?? [] ) ); ?>" />
                <?php for ( $i = 0; $i < 4; $i++ ) :
                    $hero = wp_parse_args( $heroes[ $i ] ?? [], zayn_default_heroes()[ $i ] ); ?>
                    <input type="hidden" name="zayn_hero_image_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $hero['image'] ); ?>" />
                    <input type="hidden" name="zayn_hero_title_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $hero['title'] ); ?>" />
                    <input type="hidden" name="zayn_hero_highlight_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $hero['highlight'] ?? '' ); ?>" />
                    <input type="hidden" name="zayn_hero_subtitle_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $hero['subtitle'] ?? '' ); ?>" />
                    <input type="hidden" name="zayn_hero_cta_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $hero['ctaLabel'] ?? '' ); ?>" />
                    <input type="hidden" name="zayn_hero_link_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $hero['ctaLink'] ?? '' ); ?>" />
                    <?php if ( ! isset( $hero['isActive'] ) || $hero['isActive'] ) : ?>
                        <input type="hidden" name="zayn_hero_active_<?php echo (int) $i; ?>" value="1" />
                    <?php endif; ?>
                <?php endfor; ?>
                <?php for ( $i = 0; $i < 4; $i++ ) :
                    $tile = wp_parse_args( $tiles[ $i ] ?? [], zayn_default_category_tiles()[ $i ] ); ?>
                    <input type="hidden" name="zayn_tile_label_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $tile['label'] ); ?>" />
                    <input type="hidden" name="zayn_tile_image_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $tile['image'] ); ?>" />
                    <input type="hidden" name="zayn_tile_link_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $tile['link'] ); ?>" />
                <?php endfor; ?>
                <?php for ( $i = 0; $i < 6; $i++ ) :
                    $reel = $reels[ $i ] ?? []; ?>
                    <input type="hidden" name="zayn_reel_url_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $reel['instagramLink'] ?? '' ); ?>" />
                    <input type="hidden" name="zayn_reel_image_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $reel['image'] ?? '' ); ?>" />
                    <input type="hidden" name="zayn_reel_caption_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $reel['caption'] ?? '' ); ?>" />
                    <input type="hidden" name="zayn_reel_product_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $reel['productLink'] ?? '' ); ?>" />
                <?php endfor; ?>
            <?php endif; ?>
            <?php if ( $tab !== 'advanced' ) : ?>
                <input type="hidden" name="zayn_razorpay_key_id" value="<?php echo esc_attr( $rzp_key ); ?>" />
                <input type="hidden" name="zayn_razorpay_key_secret" value="<?php echo esc_attr( $rzp_secret ); ?>" />
                <input type="hidden" name="zayn_frontend_url" value="<?php echo esc_attr( $frontend_url ); ?>" />
                <input type="hidden" name="zayn_cors_origins" value="<?php echo esc_attr( $cors_origins ); ?>" />
            <?php endif; ?>
            <?php if ( $tab !== 'orders' && $tab !== 'advanced' ) : ?>
                <input type="hidden" name="zayn_next_order_number" value="<?php echo esc_attr( $next_order_num ); ?>" />
            <?php endif; ?>

            <?php if ( $tab === 'everyday' ) : ?>
                <div class="card" style="max-width:820px;padding:16px 20px;margin:0 0 16px;">
                    <h2 style="margin-top:0;">How the client should work day to day</h2>
                    <ol style="margin-left:1.2em;line-height:1.6;">
                        <li><strong>New order?</strong> Open <a href="<?php echo esc_url( admin_url( 'admin.php?page=wc-orders' ) ); ?>">Orders</a> → change status (Processing → Completed) when packed/shipped.</li>
                        <li><strong>Add / edit a jacket?</strong> <a href="<?php echo esc_url( admin_url( 'edit.php?post_type=product' ) ); ?>">Products</a> → edit price, photos, stock. Put photos in the product gallery.</li>
                        <li><strong>Show on homepage as new / bestseller?</strong> Edit product → check <strong>Featured</strong>, or add tag <code>new-arrival</code> or <code>bestseller</code>.</li>
                        <li><strong>Change homepage banner / promo text?</strong> Use the <em>Homepage</em> tab on this page (upload photos with the button — no file paths needed).</li>
                        <li><strong>Discount code?</strong> <a href="<?php echo esc_url( admin_url( 'edit.php?post_type=shop_coupon' ) ); ?>">Coupons</a>.</li>
                    </ol>
                </div>

                <h2>Shipping &amp; payments (simple)</h2>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row">Delivery fee (₹)</th>
                        <td>
                            <input type="number" name="zayn_delivery_fee" value="<?php echo esc_attr( $delivery_fee ); ?>" />
                            <p class="description">Charged when the order is below free-shipping.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Free shipping from (₹)</th>
                        <td>
                            <input type="number" name="zayn_free_shipping_threshold" value="<?php echo esc_attr( $free_threshold ); ?>" />
                            <p class="description">Cart total at or above this gets free delivery. Shop can still show USD / GBP / CAD to customers.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Cash on delivery</th>
                        <td>
                            <label><input type="checkbox" name="zayn_cod_enabled" <?php checked( $cod_enabled, '1' ); ?> /> Allow pay-on-delivery orders</label>
                        </td>
                    </tr>
                </table>

                <h2>Top black promo bar</h2>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row">Show promo bar</th>
                        <td><label><input type="checkbox" name="zayn_promo_active" <?php checked( ! empty( $promo['isActive'] ) ); ?> /> Visible on the live shop</label></td>
                    </tr>
                    <tr>
                        <th scope="row">Message</th>
                        <td><input type="text" name="zayn_promo_message" value="<?php echo esc_attr( $promo['message'] ?? '' ); ?>" class="large-text" placeholder="Free expedited shipping worldwide · Handcrafted leather" /></td>
                    </tr>
                    <tr>
                        <th scope="row">Link (optional)</th>
                        <td><input type="url" name="zayn_promo_link" value="<?php echo esc_attr( $promo['link'] ?? '' ); ?>" class="regular-text" placeholder="<?php echo esc_attr( $shop_url . '/shop' ); ?>" /></td>
                    </tr>
                </table>
            <?php endif; ?>

            <?php if ( $tab === 'homepage' ) : ?>
                <p class="description" style="max-width:720px;">Upload photos with <strong>Upload / Select image</strong>. Recommended: banners ~1800×900px, category tiles square or portrait, leave space on the left of banners for text.</p>

                <h2>Homepage banners</h2>
                <table class="form-table">
                    <?php for ( $i = 0; $i < 4; $i++ ) :
                        $hero = wp_parse_args( $heroes[ $i ] ?? [], zayn_default_heroes()[ $i ] ); ?>
                    <tr>
                        <th>Banner <?php echo (int) $i + 1; ?></th>
                        <td>
                            <?php zayn_render_media_field( 'zayn_hero_image_' . $i, $hero['image'], 'Banner photo', 'Wide photo. Keep the left side fairly clear for the title.' ); ?>
                            <label>Title<br><input type="text" class="regular-text" name="zayn_hero_title_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $hero['title'] ); ?>" /></label>
                            <label style="margin-left:12px">Italic line<br><input type="text" class="regular-text" name="zayn_hero_highlight_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $hero['highlight'] ?? '' ); ?>" /></label><br><br>
                            <label>Subtitle<br><input type="text" class="large-text" name="zayn_hero_subtitle_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $hero['subtitle'] ?? '' ); ?>" /></label><br><br>
                            <label>Button text<br><input type="text" class="regular-text" name="zayn_hero_cta_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $hero['ctaLabel'] ?? '' ); ?>" /></label>
                            <label style="margin-left:12px">Button link<br><input type="text" class="regular-text" name="zayn_hero_link_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $hero['ctaLink'] ?? '' ); ?>" placeholder="/shop?department=men" /></label><br><br>
                            <label><input type="checkbox" name="zayn_hero_active_<?php echo (int) $i; ?>" <?php checked( ! isset( $hero['isActive'] ) || $hero['isActive'] ); ?> /> Show this banner</label>
                        </td>
                    </tr>
                    <?php endfor; ?>
                </table>

                <h2>Shop-by-category tiles</h2>
                <table class="form-table">
                    <?php for ( $i = 0; $i < 4; $i++ ) :
                        $tile = wp_parse_args( $tiles[ $i ] ?? [], zayn_default_category_tiles()[ $i ] ); ?>
                    <tr>
                        <th>Tile <?php echo (int) $i + 1; ?></th>
                        <td>
                            <label>Name<br><input type="text" class="regular-text" name="zayn_tile_label_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $tile['label'] ); ?>" /></label><br><br>
                            <?php zayn_render_media_field( 'zayn_tile_image_' . $i, $tile['image'], 'Tile photo', 'No text on the photo — the name is drawn on top.' ); ?>
                            <label>Link<br><input type="text" class="regular-text" name="zayn_tile_link_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $tile['link'] ); ?>" /></label>
                        </td>
                    </tr>
                    <?php endfor; ?>
                </table>

                <h2>Instagram / community reels</h2>
                <p class="description">Paste an Instagram link. Upload an optional cover image. Leave a row empty to hide it.</p>
                <table class="form-table">
                    <?php for ( $i = 0; $i < 6; $i++ ) :
                        $reel = $reels[ $i ] ?? []; ?>
                    <tr>
                        <th>Reel <?php echo (int) $i + 1; ?></th>
                        <td>
                            <label>Instagram URL<br><input type="url" class="large-text" name="zayn_reel_url_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $reel['instagramLink'] ?? '' ); ?>" placeholder="https://www.instagram.com/reel/..." /></label><br><br>
                            <?php zayn_render_media_field( 'zayn_reel_image_' . $i, $reel['image'] ?? '', 'Cover image' ); ?>
                            <label>Caption<br><input type="text" class="large-text" name="zayn_reel_caption_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $reel['caption'] ?? '' ); ?>" /></label><br><br>
                            <label>Product link (optional)<br><input type="text" class="regular-text" name="zayn_reel_product_<?php echo (int) $i; ?>" value="<?php echo esc_attr( $reel['productLink'] ?? '' ); ?>" placeholder="/product/123" /></label>
                        </td>
                    </tr>
                    <?php endfor; ?>
                </table>

                <details style="margin:20px 0;max-width:720px;">
                    <summary style="cursor:pointer;font-weight:600;">Optional: pin specific product IDs (usually not needed)</summary>
                    <p class="description">Easier way: edit a product and mark it Featured, or add tags <code>new-arrival</code> / <code>bestseller</code>. Only use IDs if you need an exact list.</p>
                    <table class="form-table">
                        <tr>
                            <th>New arrival IDs</th>
                            <td><input type="text" name="zayn_new_arrival_ids" value="<?php echo esc_attr( implode( ',', $home['newArrivalProductIds'] ?? [] ) ); ?>" class="large-text" placeholder="12,45,78" /></td>
                        </tr>
                        <tr>
                            <th>Bestseller IDs</th>
                            <td><input type="text" name="zayn_bestseller_ids" value="<?php echo esc_attr( implode( ',', $home['bestsellerProductIds'] ?? [] ) ); ?>" class="large-text" placeholder="3,9,21" /></td>
                        </tr>
                        <tr>
                            <th>Featured IDs</th>
                            <td><input type="text" name="zayn_featured_ids" value="<?php echo esc_attr( implode( ',', $home['featuredProductIds'] ?? [] ) ); ?>" class="large-text" /></td>
                        </tr>
                    </table>
                </details>
            <?php endif; ?>

            <?php if ( $tab === 'orders' ) : ?>
                <h2>Customer-facing order numbers</h2>
                <p style="max-width:720px;">WooCommerce keeps a large internal ID (shared with products). Customers see a clean shop number instead (e.g. #1001).</p>
                <table class="form-table">
                    <tr>
                        <th>Next shop order #</th>
                        <td>
                            <input type="number" min="1" name="zayn_next_order_number" value="<?php echo esc_attr( $next_order_num ); ?>" />
                            <p class="description">The next new order will use this number, then count up automatically.</p>
                        </td>
                    </tr>
                </table>
                <p>
                    <button type="submit" name="zayn_backfill_order_numbers" value="1" class="button" onclick="return confirm('Renumber ALL existing orders starting at #1001? Only do this for test orders.');">
                        Renumber existing (test) orders from #1001
                    </button>
                </p>
            <?php endif; ?>

            <?php if ( $tab === 'advanced' ) : ?>
                <div class="notice notice-info inline"><p>These fields are for your developer. The shop owner usually does not need this tab.</p></div>
                <table class="form-table">
                    <tr>
                        <th>Live shop URL</th>
                        <td><input type="url" name="zayn_frontend_url" value="<?php echo esc_attr( $frontend_url ); ?>" class="regular-text" placeholder="https://zaynleather.com" />
                        <p class="description">Used for CORS and “View live shop” links.</p></td>
                    </tr>
                    <tr>
                        <th>Extra CORS origins</th>
                        <td><input type="text" name="zayn_cors_origins" value="<?php echo esc_attr( $cors_origins ); ?>" class="large-text" placeholder="https://staging.example.com" />
                        <p class="description">Comma-separated. <code>*.vercel.app</code> previews are allowed automatically.</p></td>
                    </tr>
                    <tr>
                        <th>Razorpay Key ID</th>
                        <td><input type="text" name="zayn_razorpay_key_id" value="<?php echo esc_attr( $rzp_key ); ?>" class="regular-text" /></td>
                    </tr>
                    <tr>
                        <th>Razorpay Key Secret</th>
                        <td><input type="password" name="zayn_razorpay_key_secret" value="<?php echo esc_attr( $rzp_secret ); ?>" class="regular-text" autocomplete="new-password" /></td>
                    </tr>
                    <tr>
                        <th>Next shop order #</th>
                        <td><input type="number" min="1" name="zayn_next_order_number" value="<?php echo esc_attr( $next_order_num ); ?>" /></td>
                    </tr>
                </table>
            <?php endif; ?>

            <?php if ( $tab === 'orders' ) : ?>
                <p class="submit">
                    <button type="submit" name="zayn_save_settings" value="1" class="button button-primary">Save order number setting</button>
                </p>
            <?php else : ?>
                <p class="submit" style="position:sticky;bottom:0;background:#f0f0f1;padding:12px 0;margin:24px 0 0;border-top:1px solid #c3c4c7;">
                    <button type="submit" name="zayn_save_settings" value="1" class="button button-primary button-hero">Save changes</button>
                    <a class="button button-hero" style="margin-left:8px;" href="<?php echo $shop_url; ?>" target="_blank" rel="noopener">Preview live shop</a>
                </p>
            <?php endif; ?>
        </form>

        <script>
        (function ($) {
          function setPreview($field, url) {
            var $box = $field.find('.zayn-media-preview-wrap');
            if (!url) {
              $box.html('<p class="description" style="margin:8px 0;">No image yet.</p>');
              return;
            }
            if (url.indexOf('http') === 0 || url.indexOf('//') === 0) {
              $box.html('<img class="zayn-media-preview" src="' + String(url).replace(/"/g, '&quot;') + '" alt="" style="display:block;max-width:100%;height:auto;max-height:140px;margin:8px 0;object-fit:cover;border:1px solid #c3c4c7;background:#f0f0f1;" />');
            } else {
              $box.html('<p class="description" style="margin:8px 0;">Using the default shop image. Click <strong>Upload / Select image</strong> to replace it.</p>');
            }
          }

          $(document).on('click', '.zayn-media-upload', function (e) {
            e.preventDefault();
            var $field = $(this).closest('.zayn-media-field');
            var $input = $field.find('.zayn-media-url');
            var frame = wp.media({
              title: 'Select or upload image',
              button: { text: 'Use this image' },
              multiple: false,
              library: { type: 'image' }
            });
            frame.on('select', function () {
              var attachment = frame.state().get('selection').first().toJSON();
              var url = attachment.url || '';
              $input.val(url);
              $field.find('.zayn-media-clear').prop('disabled', !url);
              setPreview($field, url);
            });
            frame.open();
          });

          $(document).on('click', '.zayn-media-clear', function (e) {
            e.preventDefault();
            var $field = $(this).closest('.zayn-media-field');
            $field.find('.zayn-media-url').val('');
            $(this).prop('disabled', true);
            setPreview($field, '');
          });
        })(jQuery);
        </script>
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

    register_rest_route( 'zayn/v1', '/newsletter', [
        'methods'             => 'POST',
        'callback'            => 'zayn_subscribe_newsletter',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route( 'zayn/v1', '/custom-jacket', [
        'methods'             => 'POST',
        'callback'            => 'zayn_submit_custom_jacket',
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

function zayn_subscribe_newsletter( $request ) {
    $email  = sanitize_email( $request->get_param( 'email' ) );
    $gender = sanitize_text_field( $request->get_param( 'gender' ) );

    if ( ! $email || ! is_email( $email ) ) {
        return new WP_Error( 'invalid_email', 'A valid email is required', [ 'status' => 400 ] );
    }

    $list = get_option( 'zayn_newsletter_list', [] );
    if ( ! is_array( $list ) ) $list = [];

    $exists = false;
    foreach ( $list as $row ) {
        if ( isset( $row['email'] ) && strtolower( $row['email'] ) === strtolower( $email ) ) {
            $exists = true;
            break;
        }
    }

    if ( ! $exists ) {
        $list[] = [
            'email'      => $email,
            'gender'     => $gender,
            'source'     => 'welcome_popup',
            'subscribed' => current_time( 'mysql' ),
        ];
        update_option( 'zayn_newsletter_list', $list );
    }

    // Store as private post for admin visibility
    wp_insert_post([
        'post_type'    => 'zayn_newsletter',
        'post_title'   => $email,
        'post_content' => "Gender: $gender\nSource: welcome_popup",
        'post_status'  => 'private',
    ]);

    $admin = get_option( 'admin_email' );
    wp_mail(
        $admin,
        'New newsletter signup — Zayn Leathers',
        "Email: $email\nGender: $gender\nSource: welcome popup"
    );

    return rest_ensure_response([
        'success' => true,
        'message' => $exists
            ? 'You are already subscribed. Check your inbox for offers.'
            : 'Subscribed successfully. Watch your inbox for your offer.',
    ]);
}

function zayn_submit_custom_jacket( $request ) {
    $name        = sanitize_text_field( $request->get_param( 'name' ) );
    $email       = sanitize_email( $request->get_param( 'email' ) );
    $phone       = sanitize_text_field( $request->get_param( 'phone' ) );
    $company     = sanitize_text_field( $request->get_param( 'company' ) );
    $quantity    = max( 1, intval( $request->get_param( 'quantity' ) ?: 1 ) );
    $gender      = sanitize_text_field( $request->get_param( 'gender' ) );
    $country     = sanitize_text_field( $request->get_param( 'country' ) );
    $description = sanitize_textarea_field( $request->get_param( 'description' ) );
    $styles_raw  = $request->get_param( 'styles' );

    if ( is_string( $styles_raw ) ) {
        $decoded = json_decode( $styles_raw, true );
        $styles  = is_array( $decoded ) ? $decoded : [];
    } elseif ( is_array( $styles_raw ) ) {
        $styles = $styles_raw;
    } else {
        $styles = [];
    }
    $styles = array_map( 'sanitize_text_field', $styles );

    if ( ! $name || ! $email || ! is_email( $email ) || ! $description ) {
        return new WP_Error( 'invalid', 'Name, email and description are required', [ 'status' => 400 ] );
    }

    $attachment_id = 0;
    $files = $request->get_file_params();
    if ( ! empty( $files['file'] ) && ! empty( $files['file']['tmp_name'] ) ) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $upload = wp_handle_upload( $files['file'], [ 'test_form' => false ] );
        if ( ! isset( $upload['error'] ) && ! empty( $upload['file'] ) ) {
            $filetype = wp_check_filetype( basename( $upload['file'] ), null );
            $attachment = [
                'post_mime_type' => $filetype['type'],
                'post_title'     => sanitize_file_name( basename( $upload['file'] ) ),
                'post_content'   => '',
                'post_status'    => 'inherit',
            ];
            $attachment_id = wp_insert_attachment( $attachment, $upload['file'] );
            if ( ! is_wp_error( $attachment_id ) ) {
                $meta = wp_generate_attachment_metadata( $attachment_id, $upload['file'] );
                wp_update_attachment_metadata( $attachment_id, $meta );
            } else {
                $attachment_id = 0;
            }
        }
    }

    $body = "Name: $name\nEmail: $email\nPhone: $phone\nCompany: $company\nQuantity: $quantity\nGender: $gender\nCountry: $country\nStyles: " . implode( ', ', $styles ) . "\n\n$description";

    $post_id = wp_insert_post([
        'post_type'    => 'zayn_custom_request',
        'post_title'   => $name . ' — custom jacket ×' . $quantity,
        'post_content' => $body,
        'post_status'  => 'private',
        'meta_input'   => [
            '_zayn_email'    => $email,
            '_zayn_phone'    => $phone,
            '_zayn_quantity' => $quantity,
            '_zayn_file_id'  => $attachment_id,
        ],
    ]);

    if ( $attachment_id && $post_id && ! is_wp_error( $post_id ) ) {
        wp_update_post([ 'ID' => $attachment_id, 'post_parent' => $post_id ]);
    }

    $admin = get_option( 'admin_email' );
    $headers = [ "Reply-To: $name <$email>" ];
    wp_mail( $admin, "Custom jacket request — $name", $body, $headers );

    return rest_ensure_response([
        'success' => true,
        'message' => 'Request received. We will reply within 24–48 hours.',
        'id'      => $post_id,
    ]);
}
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

    register_post_type( 'zayn_newsletter', [
        'labels'       => [ 'name' => 'Newsletter Signups', 'singular_name' => 'Newsletter Signup' ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'supports'     => [ 'title', 'editor' ],
        'menu_icon'    => 'dashicons-email-alt',
    ]);

    register_post_type( 'zayn_custom_request', [
        'labels'       => [ 'name' => 'Custom Jacket Requests', 'singular_name' => 'Custom Jacket Request' ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'supports'     => [ 'title', 'editor' ],
        'menu_icon'    => 'dashicons-admin-customizer',
    ]);
});
