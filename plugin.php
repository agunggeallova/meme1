<?php
/*
Plugin Name: Premium Meme Generator / Maker Wordpress Plugin
Plugin URI: http://www.aa-team.com
Description: Premium Meme Generator is what every Wordpress Blog needs. Everybody loves a good laugh and funny memes (funny shareable images). Using our plugin you have the possibility to give your users just that.
Version: 1.0.
Author: AA-Team
Author URI: http://www.aa-team.com
*/

// don't load directly
if ( ! defined( 'ABSPATH' ) ) {
	die( '-1' );
}
/**
 * Current MG version
 */
if ( ! defined( 'MG_VERSION' ) ) {
	/**
	 *
	 */
	define( 'MG_VERSION', '1.0' );
}

/**
 * MG starts here. Manager sets mode, adds required wp hooks and loads required object of structure
 *
 * Manager controls and access to all modules and classes of MG.
 * 
 * @package ' . ( $this->plugin_name ) . '
 * @since   1.0
 */
class MG {
	/**
	 * Set status/mode for MG.
	 *
	 * It depends on what functionality is required from MG to work with current page/part of WP.
	 *
	 * Possible values:
	 *  none - current status is unknown, default mode;
	 *  page - simple wp page;
	 *  admin_page - wp dashboard;
	 *  admin_frontend_editor - MG front end editor version;
	 *  admin_settings_page - settings page
	 *  page_editable - inline version for iframe in front end editor;
	 *
	 * @since 1.0
	 * @var string
	 */
	private $mode = 'none';
	
	/**
	 * Enables MG to act as the theme plugin.
	 *
	 * @since 1.0
	 * @var bool
	 */
	 
	private $is_as_theme = false;
	/**
	 * MG is network plugin or not.
	 * @since 1.0
	 * @var bool
	 */
	private $is_network_plugin = null;
	
	/**
	 * List of paths.
	 *
	 * @since 1.0
	 * @var array
	 */
	private $paths = array();

	/**
	 * Set updater mode
	 * @since 1.0
	 * @var bool
	 */
	private $disable_updater = false;
	
	/**
	 * Modules and objects instances list
	 * @since 1.0
	 * @var array
	 */
	private $factory = array();
	
	/**
	 * File name for components manifest file.
	 *
	 * @since 4.4
	 * @var string
	 */
	private $components_manifest = 'components.json';
	
	/**
	 * @var string
	 */
	public $plugin_name = 'Meme Generator';
    public $localizationName = 'MG';
    public $alias = 'MG'; 
	public $updater_dev = null; 
	
	/**
	 * The keywords object
	 */
	public $autofind = null;
	
	/**
	 * The config object
	 */
	public $config = null;
	
	/**
	 * The about object
	 */
	public $about = null;
	
	/**
	 * The search object
	 */
	public $search = null;

	/**
	 * The dashboard object
	 */
	public $dashboard = null;
	
	/**
	 * The wp_filesystem object
	 */
	public $wp_filesystem = null;
	
	/**
	 * The wpbd object
	 */
	public $db = null;

	/**
	 * The template object
	 */
	public $template = null;

	public $settings = array();
	

	/**
	 * Constructor loads API functions, defines paths and adds required wp actions
	 *
	 * @since  1.0
	 */
	public function __construct() 
	{
		$dir = dirname( __FILE__ );
		$upload_dir = wp_upload_dir();

		$this->settings = get_option( 'MG_Import_Settings', true );

		if( defined('UPDATER_DEV') ) {
			$this->updater_dev = (string) UPDATER_DEV;
		}
		
		/**
		 * Define path settings for MG.
		 */
		$this->setPaths( array(
			'APP_ROOT' 				=> $dir,
			'WP_ROOT' 				=> preg_replace( '/$\//', '', ABSPATH ),
			'APP_DIR' 				=> basename( $dir ),
			'CONFIG_DIR' 			=> $dir . '/config',
			'ASSETS_DIR' 			=> $dir . '/assets',
			'ASSETS_DIR_NAME' 		=> 'assets',
			'TEMPLATES_DIR_NAME' 	=> 'templates',
			'APP_URL'  				=> plugin_dir_url( __FILE__ ),
			'TEMPLATES_URL'  		=> plugin_dir_url( __FILE__ ) . 'templates/',
			'HELPERS_DIR' 			=> $dir . '/include/helpers',
			'AUTO_FIND_DIR' 		=> $dir . '/include/auto-find',
			'MG_DIR' 				=> $dir . '/include/tmdb',
			'MG_WS_DIR' 			=> $dir . '/include/tmdb-ws',
			'DASHBOARD_DIR' 		=> $dir . '/include/dashboard',
			'ABOUT_DIR' 			=> $dir . '/include/about',
			'CONFIG_DIR' 			=> $dir . '/include/config',
			'SEARCH_DIR' 			=> $dir . '/include/search',
			'INCLUDE_DIR' 			=> $dir . '/include',
			'TEMPLATES_DIR' 		=> $dir . '/templates',
			'INCLUDE_DIR_NAME' 		=> 'include',
			'PARAMS_DIR' 			=> $dir . '/include/params',
			'VENDORS_DIR' 			=> $dir . '/include/classes/vendors',
			'UPLOAD_BASE_DIR'  		=> $upload_dir['basedir'],
			'UPLOAD_BASE_URL'  		=> $upload_dir['baseurl'],
		) );

		// Load API
		require_once $this->path( 'HELPERS_DIR', 'helpers.php' );
		require_once $this->path( 'HELPERS_DIR', 'social.class.php' );
		require_once $this->path( 'HELPERS_DIR', 'settings.class.php' );
		
		require_once $this->path( 'HELPERS_DIR', 'template.class.php' );
		$this->template = new MG_Template( $this );
		
		// Add hooks
		add_action( 'plugins_loaded', array( &$this, 'pluginsLoaded' ), 9 );
		add_action( 'init', array( &$this, 'init' ), 9 );
		
		// load WP_Filesystem 
		include_once ABSPATH . 'wp-admin/includes/file.php';
	   	WP_Filesystem();
		global $wp_filesystem;
		$this->wp_filesystem = $wp_filesystem;
		
		register_activation_hook( __FILE__, array( $this, 'install' ) );

		// create AJAX request
		add_action('wp_ajax_MG_register', array(
            $this,
            'ajax_register'
        ));

        add_action( 'init', array($this, 'init_session') );

        add_action( 'wp_ajax_MG_action', array( $this, 'ajax_request' ) );
        add_action( 'wp_ajax_nopriv_MG_action', array( $this, 'ajax_request' ) );
         // product updater
		add_action( 'admin_init', array($this, 'product_updater') );

		// Include the TGM_Plugin_Activation class
		require_once($this->path( 'ASSETS_DIR', 'class-tgm-plugin-activation.php') );
		add_action( 'tgmpa_register', array( $this, 'register_required_plugins') );
	}

	 /**
	 * Gets updater instance.
	 *
	 * @return AATeam_Product_Updater
	 */
	public function product_updater() {
		require_once( 'assets/class-updater.php' );
		
		if( class_exists('Meme_AATeam_Product_Updater') ){
			$product_data = get_plugin_data( __FILE__, false ); 
			new Meme_AATeam_Product_Updater( $this, $product_data['Version'], 'premium-meme-generator', 'premium-meme-generator/plugin.php' );
		}
	}

	/**
	 * Callback function WP plugin_loaded action hook. Loads locale
	 *
	 * @since  1.0
	 * @access public
	 */
	public function pluginsLoaded() 
	{
		// Setup locale
		do_action( 'MG_plugins_loaded' );
		load_plugin_textdomain( 'aa-backup-manager', false, $this->path( 'APP_DIR', 'locale' ) );
	}

	public function init_session()
	{
		 if( !session_id() ) {
	        session_start();
	    }
	}

	public function register_required_plugins() 
	{
		/**
		 * Array of plugin arrays. Required keys are name and slug.
		 * If the source is NOT from the .org repo, then source is also required.
		 */

		$plugins = array(

			array(
				'name'     				=> 'Customizer Site Beautify',
				'slug'     				=> 'customizer-site-beautify',
				'source'   				=>  plugin_dir_path(__FILE__) . 'plugins/customizer-site-beautify.zip',
				'required' 				=> false,
				'version' 				=> '0.1', 
				'force_activation' 		=> false,
				'force_deactivation' 	=> false,
				'external_url' 			=> '', 
			),
			
			array(
				'name'     				=> 'AA Backup Manager', 
				'slug'     				=> 'aa-backup-manager',
				'source'   				=>  plugin_dir_path(__FILE__) .  '/plugins/aa-backup-manager.zip',
				'required' 				=> false,
				'version' 				=> '1.0', 
				'force_activation' 		=> false,
				'force_deactivation' 	=> false,
				'external_url' 			=> '',
			),
			
			 
				
		);

 
		// Change this to your theme text domain, used for internationalising strings
				$plugin_text_domain = 'MG';
			
		/**
		 * Array of configuration settings. Amend each line as needed.
		 * If you want the default strings to be available under your own theme domain,
		 * leave the strings uncommented.
		 * Some of the strings are added into a sprintf, so see the comments at the
		 * end of each line for what each argument will be.
		 */
		$config = array(
			'domain'       		=> $plugin_text_domain,         	// Text domain - likely want to be the same as your theme.
			'default_path' 		=> '',                         	// Default absolute path to pre-packaged plugins
			'menu'         		=> 'install-required-plugins', 	// Menu slug
			'has_notices'      	=> true,                       	// Show admin notices or not
			'is_automatic'    	=> false,					   	// Automatically activate plugins after installation or not
			'message' 			=> ''							// Message to output right before the plugins table
		);
	
		tgmpa( $plugins, $config );
	
	}

	/**
	 * Callback function for WP init action hook. Sets MG mode and loads required objects.
	 *
	 * @since  1.0
	 * @access public
	 *
	 * @return void
	 */
	public function init() 
	{
		do_action( 'MG_before_init' );
		
        $this->update_developer();

		global $wpdb;
		$this->db = $wpdb;

		// Set current mode
		$this->setMode();
		
		// Load the admin menu hook
		$this->adminInterface();
 
		/**
		 * if is admin and not frontend.
		 */
		if( $this->mode === 'admin' ) {

            // If the user can manage options, let the fun begin!
            if ( current_user_can( 'manage_options' ) ) {
                // Adds actions to hook in the required css and javascript
                add_action( "admin_print_styles", array( &$this, 'admin_load_styles') );
                add_action( "admin_print_scripts", array( &$this, 'admin_load_scripts') );
            }

			// redirect on install to settings page
			$redirect_url = get_option( 'MG_redirect_to' );
			if( $redirect_url ){
				delete_option( 'MG_redirect_to' );
				wp_redirect( $redirect_url, 301 ); exit;
			}
			
			// load config interface
			require_once $this->path( 'CONFIG_DIR', 'config.class.php' );
			$this->config = new MG_config( $this );
			
			// load about interface
			require_once $this->path( 'ABOUT_DIR', 'about.class.php' );
			$this->about = new MG_about( $this );

			// load about interface
			require_once $this->path( 'DASHBOARD_DIR', 'dashboard.class.php' );
			$this->dashboard = new MG_dashboard( $this );
		}

		$this->load_custom_post_types();
		
		do_action( 'MG_after_init' );
	}


	private function load_custom_post_types()
	{
		foreach( glob( $this->path( 'APP_ROOT', "/post-types/*/init.class.php" ) ) as $pt_init ){
			$this->cfg['CURRENT_PT_PATH'] = $pt_init;
			$this->cfg['CURRENT_PT_URL'] = plugin_dir_url( $this->cfg['CURRENT_PT_PATH'] );

			$GLOBALS['MG'] = $this;
			require_once $pt_init;
		}  
	}

	public function install()
	{
		global $wpdb;

		// check for install movies pages 
		$default_pages = array( 
			'MEME Generator' => '[meme_generator_page]',
			'Meme Archive Page' => '[meme_generator_archive per_page="12" orderby="date" order="DESC" column_count="4" column_gap="30px" thumb_size="thumbnail"][/meme_generator_archive]',
		);
		$list_of_replaced_pages = array();

		foreach ( $default_pages as $page => $page_content ) {
			$id_ofpost_name = (int) $wpdb->get_var("SELECT ID FROM $wpdb->posts WHERE post_title = '$page'");

			if( $id_ofpost_name == 0 ){
				$my_post = array(
				  'post_title'    => $page,
				  'post_type'     => 'page',
				  'post_content'  => $page_content,
				  'post_status'   => 'publish',
				  'post_author'   => 1
				);

				// Insert the post into the database
				$id_ofpost_name = wp_insert_post( $my_post );
			}

			$list_of_replaced_pages[$id_ofpost_name] = "%$page%";
		} 

		// install default options
		foreach( glob( $this->path( 'APP_ROOT', "/include/*/options.php" ) ) as $options_file ){
			ob_start();
			require_once $options_file;
			
			$content = ob_get_contents();
			ob_clean();
 
			if( trim($content) != "" ){
				$options = json_decode( $content, true );

				if( $options && isset($options['elements']) && isset($options['option_name']) ){

					$defaults = array();
					foreach ($options['elements'] as $element_key => $element_value) {

						$std = isset($element_value['std']) ? $element_value['std'] : '';
						if( trim($std) != "" ){
							if( count($list_of_replaced_pages) > 0 ){
								foreach ($list_of_replaced_pages as $page_id => $page_replace) {
									
									if( $page_replace == $std ){
										$std = $page_id;
										unset( $list_of_replaced_pages[$page_id] );
									}
								}
							}

							$defaults[$element_key] = $std;
						}
					}

					//if( !get_option( $options['option_name'] ) ){ 
					update_option( $options['option_name'], $defaults );
					//}
				}
			}
		}
		

		// install db
		// check if table exist, if not create table
		$table_name = $wpdb->prefix . "movie_keywords";
		if ($wpdb->get_var( "show tables like '$table_name'" ) != $table_name) {

			$sql = "
				CREATE TABLE IF NOT EXISTS " . $table_name . " (
				  	`id` INT(10) NOT NULL,
					`name` VARCHAR(50) NOT NULL,
					PRIMARY KEY (`id`)
				);
				";

			require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
			dbDelta($sql);
		}

		$has_rows = $wpdb->get_var( "SELECT id from `$table_name` where 1=1 limit 1" );
		if( (int)$has_rows == 0 ){
			$keywords_sql = $this->wp_filesystem->get_contents( $this->path( 'HELPERS_DIR', 'keywords.sql' ) );

			if( $keywords_sql && trim($keywords_sql) != "" ){
				$keywords_sql = explode( ");", $keywords_sql );
				if( count($keywords_sql) > 0 ){
					foreach ($keywords_sql as $query) {
						
						if( trim($query) != "" ){
							$query = $query . ");";
							$wpdb->query( $query );
						}
					}
				}
			}
		}

		// redirect to the plugin	
		update_option( 'MG_redirect_to', admin_url('admin.php?page=MG') );
	}
	
    public function update_developer() 
    {
        //return true;
        if ( in_array($_SERVER['REMOTE_ADDR'], array('86.124.69.217', '86.124.76.250')) ) {
            $this->dev = 'andrei';
        } else {
            $this->dev = 'gimi';
        }
    }

	/**
	 * Load required logic for operating in Wp Admin dashboard.
	 *
	 * @since  1.0
	 * @access protected
	 *
	 * @return void
	 */
	public function adminInterface() 
	{
		// Settings page. Adds menu page in admin panel.
		$this->addMenuPageHooks();
		
	}
	
	public function addMenuPageHooks() 
	{
		if ( current_user_can( 'manage_options' ) ) {
			add_action( 'admin_menu', array( &$this, 'addMenuPage' ) );
		}
	}
	
	public function addMenuPage() 
	{
		$page = add_menu_page( "Wordpress Meme Generator",
			"Meme Generator",
			'manage_options',
			'MG',
			array( &$this, 'render' ),
			MG_asset_url( 'images/icon.png' ) 
		);
	}
	
	/**
	 * Set up the enqueue for the CSS & JavaScript files.
	 *
	 */
	public function adminLoad()
	{ 
	}
	

	private function output_menu_section( $menu_arr=array() )
	{
		$html = array();
		if( count($menu_arr) > 0 ){

			$app_root = admin_url( 'admin.php?page=MG' );
			foreach ($menu_arr as $menu_key => $value) {
				$html[] = '<div class="MG_iw-menu-section">';
				if( isset($value['label']) ) {
					$html[] = 	'<h2><span>' . ( ucfirst( $value['label'] ) ) . '</span><hr /></h2>';
				}

				if( count($value['links']) > 0 ){
					foreach ($value['links'] as $link_key => $link_value) {
						$link_value['url'] = str_replace( '%app_root%', $app_root, $link_value['url'] );
						$html[] = '<a href="' . ( $link_value['url'] ) . '" ' . ( MG_action() == $link_key ? 'class="on"' : '' ) . '><i class="fa ' . ( $link_value['icon'] ) . '"></i> ' . ( ucfirst( $link_value['label'] ) ) . '</a>';
					}
				}
				$html[] = '';
				$html[] = '</div>';
			} 
		}

		return implode( "\n", $html );
	}

	/**
	 * Create Render points.
	 *
	 * Loaded interface depends on which page is requested by client from server and request parameters like MG_action.
	 *
	 * @since  1.0
	 * @access protected
	 *
	 * @return void
	 */
	public function render()
	{

		$html[] = '
			<div class="MG_iw">
				<div class="MG_iw-loader"><ul class="MG_iw-preloader"><li></li><li></li><li></li><li></li><li></li></ul><span></span></div>';
			
		$html[] = '<aside>';
		$html[] = 	'<a id="MG_iw-logo" href="' . ( admin_url( 'admin.php?page=MG' ) ) . '"><img src="' . ( $this->assetUrl('images/logo.png') ) . '"/></a>';

		$html[] = 	$this->output_menu_section(
			array(

				'dashboard' => array(
					'links'		=> array(
						'dashboard' 	=> array(
							'url' 	=> '%app_root%',
							'label'	=> 'dashboard',
							'icon'	=> 'fa-tachometer'
						)
					)
				),

				'import' => array(
					'label' 	=> 'Utilities',
					'links'		=> array(
						'config' 	=> array(
							'url' 	=> '%app_root%&MG_action=config',
							'label'	=> 'Template Setup',
							'icon'	=> 'fa-cog'
						)
					)
				),
				'plugin' => array(
					'label' 	=> 'Plugin Status',
					'links'		=> array(
						'about' 	=> array(
							'url' 	=> '%app_root%&MG_action=about',
							'label'	=> 'About the Plugin',
							'icon'	=> 'fa-info-circle'
						)
					)
				)
			)
		);
		
		
		$html[] = '<span id="MG-version">Version: ' . ( MG_VERSION ) . ' by <a href="http://www.aa-team.com">AA-Team</a></span>';
		
		$html[] = '</aside>';
		
		$html[] = '<section>';
		
		if( MG_action() == 'config' ){

			$html[] = 	'
				<div class="MG_iw-header">
					<h3>Settings</h3>
				</div>';
				
			$html[] = $this->config->print_interface();
		}
		
		else if( MG_action() == 'about' ){
			$html[] = 	'
				<div class="MG_iw-header">
					<h3>About</h3>
				</div>';
			
			$html[] = $this->about->print_interface();
		}

		else if( MG_action() == 'dashboard' ){
			$html[] = 	'
				<div class="MG_iw-header">
					<h3>Dashboard</h3>
				</div>';
			
			$html[] = $this->dashboard->print_interface();
		}

		else if( MG_action() == 'search' ){
			$html[] = 	'
				<div class="MG_iw-header">
					<h3>Search</h3>
				</div>';
			
			$html[] = $this->search->print_interface();
		}
		
		$html[] = '</section>';	
			
		$html[] = '</div>';
		
		echo implode( "\n", $html );
	}
	
	/**
	 * Print MG interface
	 *
	*/
	public function print_interface()
	{
		$html = array();
		
	}
	
	/**
	 * Set MG mode.
	 *
	 * Mode depends on which page is requested by client from server and request parameters like MG_action.
	 *
	 * @since  1.0
	 * @access protected
	 *
	 * @return void
	 */
	protected function setMode() 
	{
		if ( is_admin() ) {
			$this->mode = 'admin';
		} else {
			$this->mode = 'frontend';
		}
	}

	/**
	 * Sets version of the MG in DB as option `MG_VERSION`
	 *
	 * @since 1.0
	 * @access protected
	 *
	 * @return void
	 */
	protected function setVersion() 
	{
		$version = get_option( 'MG_VERSION' );
		if ( ! is_string( $version ) || version_compare( $version, MG_VERSION ) !== 0 ) {
			add_action( 'MG_after_init', array( MG_settings(), 'rebuild' ) );
			update_option( 'MG_VERSION', MG_VERSION );
		}
	}

	/**
	 * Get current mode for MG.
	 *
	 * @since  1.0
	 * @access public
	 *
	 * @return string
	 */
	public function mode() {
		return $this->mode;
	}

	/**
	 * Setter for paths
	 *
	 * @since  1.0
	 * @access protected
	 *
	 * @param $paths
	 */
	protected function setPaths( $paths ) {
		$this->paths = $paths;
	}

	/**
	 * Gets absolute path for file/directory in filesystem.
	 *
	 * @since  1.0
	 * @access public
	 *
	 * @param $name - name of path dir
	 * @param string $file - file name or directory inside path
	 *
	 * @return string
	 */
	public function path( $name, $file = '' ) {
		$path = $this->paths[ $name ] . ( strlen( $file ) > 0 ? '/' . preg_replace( '/^\//', '', $file ) : '' );

		return apply_filters( 'MG_path_filter', $path );
	}

	/**
	 * Set default post types. MG editors are enabled for such kind of posts.
	 *
	 * @param array $type - list of default post types.
	 */
	public function setEditorDefaultPostTypes( array $type ) {
		$this->editor_default_post_types = $type;
	}

	/**
	 * Returns list of default post types where user can use MG editors.
	 *
	 * @since  1.0
	 * @access public
	 *
	 * @return array
	 */
	public function editorDefaultPostTypes() {
		return $this->editor_default_post_types;
	}

	/**
	 * Get post types where MG editors are enabled.
	 *
	 * @since  1.0
	 * @access public
	 *
	 * @return array
	 */
	public function editorPostTypes() 
	{
		if ( ! isset( $this->editor_post_types ) ) {
			$pt_array = MG_settings()->get( 'content_types' );
			$this->editor_post_types = $pt_array ? $pt_array : $this->editorDefaultPostTypes();
		}

		return $this->editor_post_types;
	}

	/**
	 * Setter for as network plugin for MultiWP.
	 *
	 * @since  1.0
	 * @access public
	 *
	 * @param bool $value
	 */
	public function setAsNetworkPlugin( $value = true ) 
	{
		$this->is_network_plugin = $value;
	}

	/**
	 * Directory name where template files will be stored.
	 *
	 * @since  1.0
	 * @access public
	 *
	 * @return string
	 */
	public function uploadDir() 
	{
		return 'aa-backup-manager';
	}

	/**
	 * Getter for plugin name variable.
	 * @since 1.0
	 *
	 * @return string
	 */
	public function pluginName() 
	{
		return $this->plugin_name;
	}
	
	/**
	 * Get absolute url for MG asset file.
	 *
	 * Assets are css, javascript, less files and images.
	 *
	 * @since 4.2
	 *
	 * @param $file
	 *
	 * @return string
	 */
	public function includeUrl( $file ) 
	{
		return preg_replace( '/\s/', '%20', plugins_url( $this->path( 'INCLUDE_DIR_NAME', $file ), __FILE__  ) );
	}
	
	/**
	 * Get absolute url for MG asset file.
	 *
	 * Assets are css, javascript, less files and images.
	 *
	 * @since 4.2
	 *
	 * @param $file
	 *
	 * @return string
	 */
	public function assetUrl( $file ) 
	{
		return preg_replace( '/\s/', '%20', plugins_url( $this->path( 'ASSETS_DIR_NAME', $file ), __FILE__ ) );
	}

	/**
	 * Get absolute url for MG asset file.
	 *
	 * Assets are css, javascript, less files and images.
	 *
	 * @since 4.2
	 *
	 * @param $file
	 *
	 * @return string
	 */
	public function templatesUrl( $file ) 
	{
		return preg_replace( '/\s/', '%20', plugins_url( $this->path( 'TEMPLATES_DIR_NAME', $file ), __FILE__ ) );
	}
	
	public function mb_unserialize($serial_str) 
	{
        static $adds_slashes = -1;
        if ($adds_slashes === -1) // Check if preg replace adds slashes
            $adds_slashes = (false !== strpos( preg_replace('!s:(\d+):"(.*?)";!se', "'s:'.strlen('$2').':\"$2\";'", 's:1:""";'), '\"' ));

        $result = @unserialize( preg_replace('!s:(\d+):"(.*?)";!se', "'s:'.strlen('$2').':\"$2\";'", $serial_str) );
        return ( $adds_slashes ? stripslashes_deep( $result ) : $result );
    }
	
	public function print_filters_for( $hook = '' ) 
	{
	    global $wp_filter;
	    if( empty( $hook ) || !isset( $wp_filter[$hook] ) )
	        return;
	}
    
    
    public function admin_load_styles()
    {
        // admin notices - css styles
        wp_enqueue_style( 'MG-admin-notices-style', MG_asset_url( 'admin_notices.css' ), array(), MG_VERSION );

        // admin notices - html box
        add_action( 'admin_notices', array( $this, 'admin_install_notice' ) );

        wp_enqueue_style( 'MG-core', MG_asset_url( 'style.css' ), array() );
		wp_enqueue_style( 'MG-settings', MG_asset_url( 'settings.css' ), array() );
		wp_enqueue_style( 'MG-icons', MG_asset_url( 'mg-icons.css' ), array(), '4.3.0' );  
		wp_enqueue_style( 'MG-font-awesome', MG_asset_url( 'font-awesome.min.css' ), array(), '4.3.0' );  
		
		wp_enqueue_script( 'MG-font-selector', MG_asset_url( 'fonts.class.js' ), array(), '1.0.0' );
		wp_enqueue_script( 'MG-script', MG_asset_url( 'admin.js' ), array(), '1.0.0' );
		wp_enqueue_style( 'wp-color-picker');
		wp_enqueue_script( 'wp-color-picker');
		wp_enqueue_script( 'jquery-ui-core' );
		wp_enqueue_script( 'jquery-ui-slider' );
		wp_enqueue_style( 'jquery-style', 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.2/themes/smoothness/jquery-ui.css' );

		wp_enqueue_media();
    }
    
    public function admin_load_scripts() {
    }

    public function admin_install_notice()
    {
    ?>
        <div id="MG-admin-mainnotices" class="updated MGFrm-message_activate wc-connect" style="display: none;">
            <div class="options" style="display: none;">
                <?php 
                    //echo htmlentities(json_encode( array(
                    //    'fake_ads_path'      => preg_replace( '/\s/', '%20', plugins_url( $this->path( 'ASSETS_DIR_NAME', 'fake_ads.js' ), __FILE__ ) ),
                    //) ));
                ?>
            </div>
            <div class="squeezer">
                <h4><?php _e( '<strong>WooZone Contextual</strong> &#8211; Notices: ', $this->localizationName ); ?></h4>
                <p class="adblock" style="display: none;">Adblock is blocking ads on this page</p>
            </div>
        </div>
    <?php   
    }
    
    public function prepareForInList($v) {
        return "'".$v."'";
    }

    public function template_path()
    {
    	 return apply_filters( 'MG_template_path', 'templates/' );
    }
	
	public function get_pages()
	{
		$_pages = array();
		$pages = get_pages();
		if( $pages && count($pages) > 0 ){
	  		foreach ( $pages as $page ) {
	  			$_pages[$page->ID] = $page->post_title;
	  		}
	  	}

	  	return $_pages;
	}

	public function ajax_register()
	{
		parse_str( $_REQUEST['params'], $params );

		$ipc = isset($params['MG_iw-validation-token']) ? $params['MG_iw-validation-token'] : '';
		$email = isset($params['MG_iw-validation-email']) ? $params['MG_iw-validation-email'] : '';
		
		$link = "http://cc.aa-team.com/validation/validate.php?ipc=%s&email=%s&app=" . $this->alias;
		$aa_server_response = wp_remote_retrieve_body( wp_remote_get( sprintf( $link, $ipc,$email, $email ) ) );
		if( $aa_server_response ){
			$aa_server_response = json_decode( $aa_server_response, true );
			if( $aa_server_response ){

				if( $aa_server_response['status'] == 'valid' ){
					if( isset($aa_server_response['html']) ){
						update_option( "_" . $this->alias . "_register_html", $aa_server_response['html'] );

						die( json_encode( array( 'status' => 'valid' ) ));
					}
				}
			}
		}
	}

	public function getAllGfonts( $what='all' ) 
	{
		$file = $this->path( 'ASSETS_DIR', 'fonts/google-webfonts.json' );
		$fonts = json_decode( $this->wp_filesystem->get_contents( $file ), true);
 
		$ret_fonts = array();
		//$ret_fonts['none'] = 'Theme default font';
		if(count($fonts) > 0 ){ 
			foreach ( $fonts as $font ) {
				$ret_fonts[] = $font;
			}
		}
		
		if( $what == 'all' ){ 
			return $ret_fonts;
		}
	}

	public function get_install_site_name()
	{
		$url = home_url();
		$parse = parse_url($url);

		return $parse['host'];
	}
}

/**
 * Main MG manager.
 * @var MG $MG - instance of composer management.
 * @since 1.0
 */
global $MG;
$MG = new MG();