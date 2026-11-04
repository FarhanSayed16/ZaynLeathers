<?php
/**
 * ONE-TIME admin password reset for wp.zaynleather.com
 *
 * HOW TO USE (Hostinger File Manager — no wp-admin needed):
 * 1. Hostinger → Websites → Manage site for **wp.zaynleather.com**
 * 2. Files → File Manager → open the WordPress root (folder with wp-config.php)
 * 3. Upload THIS file into that same folder as: emergency-reset-admin.php
 * 4. In the browser open:
 *    https://wp.zaynleather.com/emergency-reset-admin.php?key=ZaynReset2026
 * 5. Copy the username + password shown
 * 6. DELETE this file from File Manager immediately
 * 7. Login at https://wp.zaynleather.com/wp-admin
 *
 * Security: refuses to run without ?key=ZaynReset2026
 */

if ( ! isset( $_GET['key'] ) || $_GET['key'] !== 'ZaynReset2026' ) {
	status_header( 403 );
	exit( 'Forbidden' );
}

require __DIR__ . '/wp-load.php';

if ( ! function_exists( 'wp_update_user' ) ) {
	exit( 'WordPress failed to load. Upload this file next to wp-config.php.' );
}

$username = 'zaynadmin';
$password = 'ZaynAdmin#' . wp_generate_password( 10, false, false );
$email    = 'zaynleather@gmail.com';

$user = get_user_by( 'login', $username );

if ( ! $user ) {
	$user_id = wp_create_user( $username, $password, $email );
	if ( is_wp_error( $user_id ) ) {
		// Email may already belong to another login — attach a unique email.
		$email   = 'zaynadmin+' . time() . '@zaynleather.com';
		$user_id = wp_create_user( $username, $password, $email );
		if ( is_wp_error( $user_id ) ) {
			exit( 'Could not create user: ' . esc_html( $user_id->get_error_message() ) );
		}
	}
	$user = get_user_by( 'id', $user_id );
} else {
	wp_set_password( $password, $user->ID );
}

$user->set_role( 'administrator' );

header( 'Content-Type: text/html; charset=utf-8' );
header( 'Cache-Control: no-store' );
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8" />
	<title>Admin reset</title>
	<style>
		body { font-family: system-ui, sans-serif; max-width: 560px; margin: 40px auto; padding: 0 16px; }
		code { background: #f3f3f3; padding: 2px 6px; }
		.box { border: 1px solid #ddd; padding: 16px; border-radius: 8px; background: #fff; }
		.warn { color: #b45309; margin-top: 16px; font-weight: 600; }
	</style>
</head>
<body>
	<h1>Admin ready</h1>
	<div class="box">
		<p><strong>Login URL:</strong><br /><code>https://wp.zaynleather.com/wp-admin</code></p>
		<p><strong>Username:</strong><br /><code><?php echo esc_html( $username ); ?></code></p>
		<p><strong>Password:</strong><br /><code><?php echo esc_html( $password ); ?></code></p>
		<p><strong>Email:</strong><br /><code><?php echo esc_html( $user->user_email ); ?></code></p>
	</div>
	<p class="warn">DELETE emergency-reset-admin.php from File Manager now.</p>
</body>
</html>
