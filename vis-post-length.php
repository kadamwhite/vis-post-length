<?php
/*
Plugin Name: Visualize Post Length on Archives
Description: Use D3 to render a small graph indicating relative post length
Version:     1.0
Author:      K. Adam White
Author URI:  https://wordpress.org/support/profile/kadamwhite
*/

add_action( 'wp_enqueue_scripts', function() {
	// Register the script
	wp_register_script(
		'vis-post-length',
		WPMU_PLUGIN_URL . '/vis-post-length/bundle.js',
		array(),
		false,
		true // Load in footer
	);
	wp_register_style(
		'vis-post-length',
		WPMU_PLUGIN_URL . '/vis-post-length/vis-post-length.css'
	);

	if ( is_home() || is_post_type_archive( 'post' ) ) {//is_post_type_archive( 'post' ) ) {
		// Localize the script with new data
		$archive_page = get_query_var( 'paged' ) ?
			intval( get_query_var( 'paged' ) ) :
			1;

		wp_localize_script( 'vis-post-length', 'ARCHIVE_INFO', array(
			'page' => $archive_page
		));

		// Enqueued script with localized data.
		wp_enqueue_script( 'vis-post-length' );
		wp_enqueue_style( 'vis-post-length' );

		// Create the footer element into which the vis will render
		add_action( 'loop_start', function() {
			echo '<div id="vis-container"></div>';
		});
	}
});
