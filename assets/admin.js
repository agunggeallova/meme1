/*
Author     :  AA-Team - http://themeforest.net/user/AA-Team
*/
// Initialization and events code for the app
MG_admin = (function ($) {
    "use strict";

    // public
    var debug_level = 0,
        maincontainer = null,
        $action_status = null,
        notices_main = null,
        loading = null,
        file_frame = null,
        notices_opt = {};
    
	// init function, autoload
	(function init() {
		// load the triggers
		$(document).ready(function(){
			maincontainer = $(".MG_iw");
			$action_status = maincontainer.find(".MG-action-status.MG-message");

            notices_main = $("#MG-admin-mainnotices");

			triggers();

			loading = $(".MG_iw-loader");

			fix_content_width();
			typo();
		});

		$(window).resize(function(){

			if( !maincontainer.hasClass('wp-full-overlay-sidebar') ){
				fix_content_width();
			}
		});
	})();

	function typo()
	{
		function add_font( font ) {
			var google_font_url = "http://fonts.googleapis.com/css?family=" + font;
			
			if( $("#MG-fonts-" + font ).size() == 0 ){ 
				//console.log( 'write font'  );
				$("head").append("<link href='" + ( google_font_url ) + "' id='MG-fonts-" + ( font ) +  "' rel='stylesheet' type='text/css'>");
			}
		};

		maincontainer.find(".MG-typo-wrapper .MG-typo-row").each(function(){
			var that = $(this),
				preview = that.find(".MG-typo-font-preview");

			function refresh()
			{
				var family = that.find(".MG-typo-font-family select").val();
				var size = that.find(".MG-typo-font-size select").val();
				var color = that.find(".MG-typo-font-color input").val();

				if( family != "system" ){
					add_font( family );
				}

				preview.css({
					'font-family': family,
					'font-size': size + "px",
					'color': color
				});

				if( color == '#ffffff' ){
					preview.css('background-color', "#a997b2");
				}else{
					preview.css('background-color', "#fff");
				}
			}

			refresh();

			that.find('.MG-wp-color-picker-typo').wpColorPicker({
				change: function(event, ui){
					refresh();
				}
			});

			that.on('change', 'select', refresh );
		});
	}
	
	function update( data )
	{
		maincontainer.find(".MG_iw-loader").show();
		
		maincontainer.find(".MG_iw-loader").find('span').html('');
		$.ajax({
			url: ajaxurl,
			data: $.extend(
				{
					_ajax_custom_list_nonce: $('#_ajax_custom_list_nonce').val(),
					action: $("#ajaxid").val()
				},
				data
			),
			// Handle the successful result
			success: function( response ) {

				// WP_List_Table::ajax_response() returns json
				var response = $.parseJSON( response );

				// add the requested rows
				if ( response.rows.length )
					maincontainer.find('#the-list').html( response.rows );
					
				// update column headers for sorting
				if ( response.column_headers.length )
					maincontainer.find('thead tr, tfoot tr').html( response.column_headers );
					
				// update pagination for navigation
				if ( response.pagination.bottom.length )
					maincontainer.find('.tablenav.top .tablenav-pages').html( $(response.pagination.top).html() );
					
				if ( response.pagination.top.length )
					maincontainer.find('.tablenav.bottom .tablenav-pages').html( $(response.pagination.bottom).html() );

				// init back our event handlers
				triggers();
				
				// hide the loader
				maincontainer.find(".MG_iw-loader").fadeOut(250);
			}
		});
	}
	
	function __query( query, variable )
	{
		var vars = query.split("&");
		for ( var i = 0; i <vars.length; i++ ) {
			var pair = vars[ i ].split("=");
			if ( pair[0] == variable )
				return pair[1];
		}
		return false;
	}
	
	function fix_content_width()
	{
		maincontainer.css({
			'height': ( $("#wpwrap").height() - 70 )
		});
	}
	
	function launch_amazon_search( that, search_by )
	{
		maincontainer.find(".MG_iw-loader").show();
		
		var form = that.parents("form").eq(0),
			paged = that.data('paged');
		
		if( parseInt(paged) == 0 ){
			paged = 1;
		}
		
		$.ajax({
			url: ajaxurl,
			dataType: "json",
			method: 'post',
			data: {
				action: 'MG_launch_amz_search',
				search_by: search_by,
				keyword: form.find('input[name="keyword"]').val(),
				node: form.find('select[name="node"]').val(),
				asin: form.find('input[name="product[ASIN]"]').val(),
				paged: paged
			},
			// Handle the successful result
			success: function( response ) {
				
				if( response.status == 'valid' ) {

    				if( search_by != "asin" ){
    					$("#MG-dropdown-amazon-selector").html( response.html ).show();
    				}

    				else if ( search_by == "asin" ){
    					$(".MG-product-details").each(function(){
    						var form = $(this);
    						
    						form.find('input[name="product[Title]"]').val( response.product.Title );
    						form.find('input[name="product[Brand]"]').val( response.product.Brand );
    						form.find('input[name="product[DetailPageURL]"]').val( response.product.DetailPageURL );
    						form.find('input[name="product[SmallImage]"]').val( response.product.SmallImage );
    						form.find('input[name="product[Binding]"]').val( response.product.Binding );
    						form.find('input[name="product[ListPrice]"]').val( response.product.ListPrice );
    						form.find('input[name="product[OfferSummary]"]').val( response.product.OfferSummary );
    					});
    				}
				} else {
				    $action_status.html( response.html )
				        .removeClass('MG-success').addClass('MG-error')
				        .show();
				}
				
				// hide the loader
				maincontainer.find(".MG_iw-loader").fadeOut(250);
			}
		});
	}


    /* BEGIN aa-framework */
    function make_tabs()
    {
    	function show_tab_elements( link, form, that )
    	{
    		var link_name = link.find("a").attr("href").replace("#", "");

    		// hide all elements
    		form.find( ".MG-form-row:not(." + ( link_name ) + "), .MG-message:not(." + ( link_name ) + ")" ).hide();

    		var cc = 0;
    		form.find( ".MG-form-row." + link_name + ", .MG-message." + link_name ).each(function(){
    			var that = $(this);
    			
    			that.show();

    			if( cc % 2 == 0 ){
    				that.addClass("MG-even");
    			}

    			if( cc % 1 == 0 ){
    				that.addClass("MG-odd");
    			}

    			cc++;
    		});

    		that.find(".on").removeClass("on");
    		link.addClass("on");
    	}

		maincontainer.find(".MG-settings-tabs").each(function(){
			var that = $(this),
				form = that.parents("form").eq(0),
				link = that.find("li").eq(0);

			show_tab_elements( link, form, that );

			that.on('click', 'li a', function(e){
				e.preventDefault();
				var link = $(this).parent("li");
				
				show_tab_elements( link, form, that );
			});
       });
    }
    
    
    function saveOptions($btn)
    {
        var theForm         = $btn.parents('form').eq(0),
            value           = $btn.val(),
            statusBoxHtml   = theForm.find('div#MG-status-box');

        // replace the save button value with loading message
        $btn.val('saving setings ...').removeClass('green').addClass('gray');
        
        theForm.submit();
        
        // replace the save button value with default message
        $btn.val( value ).removeClass('gray').addClass('green');
    }
	
	function build_oauth_url( client_id )
	{
		var oauth_container = $(".MG-tmdb-auth-box"),
			btn 			= oauth_container.find('#MG-tmdb-auth-button'),
			redirect_url	= oauth_container.find("input[name='redirect-url']").val(),
			tmdb_url		= 'https://api.tmdb.com/authorization?response_type=code&client_id={client_id}&redirect_uri={redirect_url}';
		
		var oauth_url = tmdb_url.replace( "{client_id}", client_id );
			oauth_url = oauth_url.replace( "{redirect_url}", redirect_url );
		
		btn.attr("href", oauth_url); 
	}
	
	function same_height( $elms )
	{
		$elms.each(function(){
			var row 		= $(this),
				maxHeight 	= 0,
				childs 		= row.find(">div .MG_iw-dashboard-in-box-content");

			childs.each(function(){
				var that = $(this),
					height = that.height();

				if( maxHeight <= height ){
					maxHeight = height;
				}
			});
			childs.height( maxHeight );
		});
	}

	function font_preview() 
	{
		function change_font( preview_elm ) {
			var that = preview_elm,
				pair_element = that.parents('.MG-form-item:first').find('select'),
				pair_value = pair_element.val(),
				google_font_url = "http://fonts.googleapis.com/css?family=" + pair_value;
			
			// step 1, load into DOM the spreadsheet
			$("head").append("<link href='" + ( google_font_url ) + "' rel='stylesheet' type='text/css'>");
			
			// step 2, print the font name into preview with inline font-family
			that.html( "<span style='font-family: " + ( pair_value ) + "'>Grumpy wizards make toxic brew for the evil Queen and Jack.</span>" );
		};
		
		$(".MG-font-preview").each(function(){
			var that = $(this),
				pair_element = that.parents('.MG-form-item:first').find('select');

			change_font( that );

			pair_element.change(function(e) {
				var preview = $(this).parents('.MG-form-item:first').find('.MG-font-preview');
				change_font( preview );
			});
		});
	};

	function register_plugin( that )
	{
		var form = that.parents('form').eq(0);

		loading.show();
		var data = {
            'action'	: 'MG_register',
			'params'	: form.serialize()
       	};
       	
		$.post(ajaxurl, data, function (response) {
			
			if( response.status == 'valid' ){
				location.reload();
			}

			loading.hide();
			
        }, 'json');
	}

	function triggers()
	{
		same_height( maincontainer.find(".MG_iw-section-dashboard-row") );
        //make_tabs();
		
		
		$('body').on('click', 'button.MG-add-btn', function(e){
			e.preventDefault();
			add_product( $(this) );
		});

		// Pagination links, sortable link
		maincontainer.find('.tablenav-pages a, .manage-column.sortable a, .manage-column.sorted a').on('click', function(e) {
			e.preventDefault();
			
			// use the URL to extract our needed variables
			var query = this.search.substring( 1 );
			
			var data = {
				paged: __query( query, 'paged' ) || '1',
				order: __query( query, 'order' ) || 'desc',
				orderby: __query( query, 'orderby' ) || 'id'
			};
  
			update( data );
		});

		// page number input
		maincontainer.find('input[name=paged]').on('keyup', function(e) {

			// If user hit enter, we don't want to submit the form
			if ( 13 == e.which )
				e.preventDefault();

			// This time we fetch the variables in inputs
			var data = {
				paged: parseInt( maincontainer.find('input[name=paged]').val() ) || '1',
				order: maincontainer.find('input[name=order]').val() || 'desc',
				orderby: maincontainer.find('input[name=orderby]').val() || 'id',
				filter_by: maincontainer.find('input[name=filter_by]').val() || 'post',
			};
 
			update( data );
		});
		
		maincontainer.find('select[name=filter_by]').on('change', function(e) {
			var that = $(this),
				val = that.val();
			
			maincontainer.find('select[name=filter_by]').val( val ); 
		});
		
		// bulk actions - Apply
        maincontainer.find('input#doaction').on('click', function(e) {
            e.preventDefault();
            
            var that = $(this),
                form = that.parents('form').eq(0),
                _action = form.find('select#bulk-action-selector-top').val();
 
            // '_ajax_custom_list_nonce', 'ajaxid', 'order', 'orderby', '_wpnonce', '_wp_http_referer'
            var field_reset = ['_ajax_custom_list_nonce', 'ajaxid', 'order', 'orderby', '_wp_http_referer'];
            for (var i in field_reset) {
                $( 'input[name="'+field_reset[i]+'"]' ).remove();
            }
            if ( 'delete' == _action ) {
                $( 'input[name="paged"]' ).val(1);
            }
  
            form.submit();
        });
		
		$('.MG-wp-color-picker').wpColorPicker({
			change: function(event, ui) {
				$(this).trigger('MG_change_color');
			}
		});
		
        $('body').on('click', '.MG-saveOptions', function(e) {
            e.preventDefault();
            saveOptions( $(this) );
        });
        
        maincontainer.find('#MG-tmdb-auth-button').on('click', function(e) {
        	e.preventDefault();
        	
        	tmdb_auth( $(this) ); 
        });
        
        $('body').on('click', '.MG-show-all-options', function(e) {
            e.preventDefault();
            
            var that = $(this).parents('form').eq(0);
            
            that.find(".we-complex-options").removeClass('we-complex-options');
        });

        maincontainer.find('.MG_iw-register_plugin').on('click', '.MG_iw-dashboard-button', function(e) {
        	e.preventDefault();

        	register_plugin( $(this) );
        });

        maincontainer.on('click', '.MG_iw-require_register', function(e){
        	e.preventDefault();

        	$(".MG_iw-dashboard-input[name='MG_iw-validation-token']").focus();
        });

        maincontainer.find('.MG-select-wrapper').on('click', '.MG-select-item:not(.select-on)', function(e) {
        	e.preventDefault();

        	var that = $(this),
        		parent = that.parent();

        	parent.find(".select-on").removeClass('select-on');
        	parent.find("input").removeAttr("checked");

        	that.addClass('select-on');
        	that.find("input").attr('checked', true);
        });

        font_preview();

        $(".MG-slider-container").each(function(){

			var slider = $(this),
				parent = slider.parents('.MG-form-row').eq(0),
				input = parent.find("input");

			slider.slider({
				orientation: "horizontal",
				range: "min",
                min: slider.data("min"),
                max: slider.data("max"),
                value: slider.data("def"),
                step: slider.data("step") || 1,
				slide: function( event, ui ) {
			    	input.val( ui.value );
			    	input.trigger('change');
			    }
		    });

		    input.keyup(function(){
		    	var that = $(this),
		    		val = parseInt(that.val());

		    	slider.slider( "value", val );
		    })
		});

        $(".MG-font-selector").each(function(){
        	var that = $(this);
			
			that.MG_FontSelect();
		});

		maincontainer.on('click', ".MG-btn-upload-delete", function(e){
        	e.preventDefault();

        	if( confirm("Are you sure you want to delete this image?") ){
	        	var that = $(this),
	        		parent = that.parents(".MG-upload-box-wrapper").eq(0),
	        		parent_img = parent.find('.MG-upload-image img');

	        	parent_img.remove();
	        	parent.find("input").val('');
	        }
        });

        maincontainer.on('click', '.MG-selector-dom h2 a', function(e){
        	e.preventDefault();
        	maincontainer.find(".MG-selector-current").toggleClass("MG-hidden");
        });

		maincontainer.on('click', ".MG-btn-upload", function(e){
        	e.preventDefault();

        	var that = $(this),
        		parent = that.parents(".MG-upload-box-wrapper").eq(0),
        		parent_img = parent.find('.MG-upload-image');

			file_frame = wp.media.frames.file_frame = wp.media({
		        title: 'Insert a media',
                library: {type: 'image'},
                multiple: false,
                button: {text: 'Insert new image'}
		    });

		    file_frame.open();

		    file_frame.on( 'select', function() {
		    	// Get media attachment details from the frame state
      			var attachment = file_frame.state().get('selection').first().toJSON();

      			var img = $("<img />"),
				input = parent.find("input");

				if( parent.data('type') == 'image_preview' ){
					img.attr( 'src', attachment.sizes.thumbnail.url );
					input.val( attachment.id );
				}

				if( parent.data('type') == 'as_url' ){
					input.val( attachment.sizes.full.url);
					input.trigger('change');
				}

				parent_img.html( img );
			});
		});
	}

	function update_maincontainer( elm )
	{
		maincontainer = elm;
	}
	
    var misc = {
        is_chrome: function() {
            return window.chrome;
            //return navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
        }
    }

	// external usage
	return {
		'update_maincontainer'      : update_maincontainer,
		'triggers'                  : triggers,
        'make_tabs'                 : make_tabs
	}
})(jQuery);


var mg_safe_fonts = [];
mg_safe_fonts.push( "Arial, Helvetica, sans-serif" );
mg_safe_fonts.push( "Arial Black, Gadget, sans-serif" );
mg_safe_fonts.push( "Georgia, serif" );
mg_safe_fonts.push( "Helvetica Neue" );
mg_safe_fonts.push( "Impact, Charcoal, sans-serif" );
mg_safe_fonts.push( "Tahoma, Geneva, sans-serif" );
mg_safe_fonts.push( "Times New Roman, Times, serif" );
mg_safe_fonts.push( "Verdana, Geneva, sans-serif" );