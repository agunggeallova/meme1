/*
Author :  AA-Team - http://themeforest.net/user/AA-Team
*/

// Initialization and events code for the app
MG_frontend = (function ($) {
    "use strict";

    var ajaxurl = MG_ajaxurl,
        maincontainer = null,
        MG_opt = {},
        max_replacements = 0, // (global) max replacements - for all keywords
        max_kwc = {}, // max replaments - per keyword
        kwc = {}; // keyword replacements number counter
    
    // init function, autoload
    (function init() {
    
        // load the triggers
        $(document).ready(function(){
            maincontainer = $(".MG-the-content");
 
            MG_opt = maincontainer.first().find('.MG-options').html();
            MG_opt = JSON && JSON.parse(MG_opt) || $.parseJSON(MG_opt);
            MG_opt = $.extend(MG_opt, {});
            maincontainer.find('.MG-options').remove();
            //console.log( MG_opt ); return false;
            //localStorage.setItem('MG_opt', JSON.stringify( MG_opt ));
            //JSON.parse( localStorage.getItem('MG_opt') );
            
            triggers();
        });
    })();
    
    function MG_find_replace(searchText, replacement, searchNode) 
    {
        // max allowed replacements
        //if ( max_replacements && kwc > max_replacements ) return;
    
        if (!searchText || typeof replacement === 'undefined') {
            // Throw error here if you want...
            return;
        }

        var word_boundary = '\\b', //'[\\s\\.\\(\\)\\[\\],]'
            _regex = new RegExp(searchText, 'gmi');
        if ( MG_opt.find_distinct_words == 'yes' ) {
            _regex = new RegExp('(?:^|' + word_boundary + ')(' + searchText + ')(?=$|' + word_boundary + ')', 'gmi')
        }

        var regex = typeof searchText === 'string' ? _regex : searchText,
            childNodes = (searchNode || document.body).childNodes,
            cnLength = childNodes.length,
            contor = cnLength,
            excludes = 'style,title,link,meta,script,object,iframe,img';

        var currentNode = null;
        while ( contor-- ) {
            // max allowed replacements
            //if ( max_replacements && kwc >= max_replacements ) return;
        
            currentNode = childNodes[contor];
            if ( typeof currentNode === 'undefined' ) continue;

            var _rule = (
                currentNode.nodeType === 1
                && (excludes + ',').indexOf(currentNode.nodeName.toLowerCase() + ',') === -1
                && ( currentNode.nodeName.toLowerCase() != 'div'
                    || ( currentNode.nodeName.toLowerCase() == 'div' && !misc.hasClass(currentNode, 'MG-tooltip') )
                )
            );
            if ( _rule ) {
                MG_find_replace(searchText, replacement, currentNode); // arguments.callee
            }
            if (currentNode.nodeType !== 3 || !regex.test(currentNode.data) ) {
                continue;
            }
            var parent = currentNode.parentNode,
                frag = (function(){
                    var html = currentNode.data.replace(regex, replacement),
                        wrap = document.createElement('div'),
                        frag = document.createDocumentFragment();
                    wrap.innerHTML = html;
                    while (wrap.firstChild) {
                        frag.appendChild(wrap.firstChild);
                    }
                    //kwc[searchText]++;
                    return frag;
                })();
            parent.insertBefore(frag, currentNode);
            parent.removeChild(currentNode);
        }
    }
    
    function MG_max_replacements()
    {
        var kwc = {}; // keyword replacements number counter
        $('.MG-tooltip').each(function() {
            var that = $(this),
                keyword = that.data('keyword');

            if ( !misc.hasOwnProperty(kwc, keyword) ) {
                kwc[keyword] = 0;
            }
            kwc[keyword]++;
            
            // max allowed replacements
            var mr = max_replacements;
            if ( misc.hasOwnProperty(max_kwc, keyword) ) {
                mr = parseInt( max_kwc[keyword] );
            }
            if ( mr && kwc[keyword] > mr ) {
                // mark as to be removed tooltip
                that.addClass('MG-keyword-remove');
            }
        });
        //console.log( kwc );
        
        // rollback to original keywords text
        misc.removeTagKeepContent( 'MG-tooltip MG-keyword-remove', 'class' );
        
        //mrdebug();
        
        return kwc;
    }
    
    function MG_save_hits( keywords ) {
        //keywords = JSON.stringify( keywords ); 
        var data = {
            action      : 'MG_save_hits',
            keywords    : keywords
        };
        
        // turn the result into a query string
        //data = $.param( data );
  
        $.ajax({
            url: ajaxurl,
            dataType: "json",
            method: 'post',
            data: data,
            // Handle the successful result
            success: function( response ) {
            }
        });
    }
    
    function mrdebug() {
        // debug!
        var kwc = {}; // keyword replacements number counter
        $('.MG-tooltip').each(function() {
            var that = $(this),
                keyword = that.data('keyword');

            if ( !misc.hasOwnProperty(kwc, keyword) ) {
                kwc[keyword] = 0;
            }
            kwc[keyword]++;
        });
        console.log( kwc );
    }

    function create_tooltip( that )
    {
        // get country
        var country = null;
        if ( misc.hasOwnProperty(MG_opt, 'country') ) {
            country = JSON.parse(MG_opt.country) || $.parseJSON(MG_opt.country);
        }
        
        var $html                = new Array(),
            $rows                = that.data('items'),
            link_target          = MG_opt.link_target,
            tooltip_max_height   = MG_opt.tooltip_max_height;
 
        var __lt = link_target != '' && link_target != 'no' ? ' target="' + link_target + '"' : ' ';

        $html.push( '<div class="MG-tooltip-container"' + ( tooltip_max_height > 0 ? ' style="max-height: ' + tooltip_max_height + 'px;"' : '' ) + '>' );

        $.each($rows, function(){
            var $row = $(this).first().get(0);

            $row.d = $row.d.replace(/(.*amazon)([a-zA-Z\.]*)(.*&tag=)([a-zA-Z0-9-_]*)(.*)/gim, '$1' + ( country.website ) + '$3' + ( country.affID ) + '$5');
            $html.push('<div class="MG-product-item">');
            $html.push(     '<span class="MG-product-image"><a href="' + ( $row.d ) + '"' + __lt + '><img src="' + ( $row.s ) + '" /></a></span>');
            $html.push(     '<div class="MG-product-details">');
            $html.push(         '<div class="MG-product-title"><a href="' + ( $row.d ) + '"' + __lt + '>' + ( $row.t ) + '</a></div>');
            $html.push(         '<span class="MG-product-brand">by <span>' + ( $row.b ) + '</span></span>');
            $html.push(         '<span class="MG-product-price">');
            $html.push(             '<ins>' + ( $row.o ) + '</ins>');
            $html.push(             '<del>' + ( $row.l ) + '</del>');
            $html.push(         '</span>');
            
            $html.push(         '<a href="' + ( $row.d ) + '" class="MG-product-button"' + __lt + '>Buy now</a>');
            $html.push(     '</div>');
            $html.push( '</div>');
        });
        
        $html.push( '</div>' );
        return $html.join("\n");
    }
    
    function moreBtnList(tbl) {
        var toolbar = tbl;
 
        function build_position( moreBtn ) {
            var winW = $(window).width(), winH = $(window).height(),
            winLeft = $(window).scrollLeft(), winTop = $(window).scrollTop(),
            tbW = toolbar.outerWidth(), tbH = toolbar.outerHeight(),
            moreBtnW = moreBtn.outerWidth(true),
            moreBtnOffset = moreBtn.offset(),
            moreBtnPos = moreBtn.position(),
            moreBtnWinTop = parseInt( moreBtnOffset.top - winTop ),
            moreBtnWinLeft = parseInt( moreBtnOffset.left - winLeft ),
            mTb = moreBtn.find('.MG-tooltip-container'), mTbW = mTb.outerWidth(), mTbH = mTb.outerHeight(),
            mTbMargin = { top: MG_opt.tooltip_margin_top, left: MG_opt.tooltip_margin_left };

            var css = { 
                'position'      : 'absolute',
                'top'           : '',
                'left'          : '',
                'bottom'        : '',
                'right'         : '',
                'height'        : '',
                'overflow-y'    : ''
            };

            mTbMargin.top = parseInt( mTbMargin.top );
            mTbMargin.left = parseInt( mTbMargin.left );

            // fix vertical
            var spaceFreeTop = parseInt( winH - moreBtnWinTop - mTbMargin.top );
            if ( spaceFreeTop < mTbH ) {
                css.bottom = 0 + mTbMargin.top;
            } else {
                css.top = 0 + mTbMargin.top; //parseInt( moreBtnPos.top );
            }

            // fix horizontal
            var spaceFreeLeft = parseInt( winW - moreBtnWinLeft - mTbMargin.left );
            if ( spaceFreeLeft < mTbW ) {
                css.right = moreBtnW + mTbMargin.left;
            } else {
                css.left = moreBtnW + mTbMargin.left; //parseInt( moreBtnPos.left + moreBtnW );
            }

            // open more list
            for (var i in css) {
                if ( $.inArray(i, ['top', 'left', 'bottom', 'right', 'height']) != -1 && css[i] != '' ) {
                    css[i] = parseInt( css[i] ) + 'px';
                }
            }

            var $moreList = mTb;
            $moreList.css( css ).stop().css({'display': 'block'});
        }

        function triggers() {
            // more button
            toolbar.find('.MG-tooltip')
            .mouseenter(function(e) {
                e.stopPropagation();
                var $this = $(this), $moreList = $this.find('.MG-tooltip-container');
        
                build_position( $this );
            })
            .mouseleave(function(e) {
                e.stopPropagation();
                var $this = $(this), $moreList = $this.find('.MG-tooltip-container');
        
                // close more list with delay timer to obtain time to hover over more list
                var moreTimeout = setTimeout(function () {
                    $moreList.stop(true, false).css({'display': 'none'});
                }, 250);
                $this.data('moreTimeout', moreTimeout);
            });
        
            // more list of buttons!
            toolbar.find('.MG-tooltip .MG-tooltip-container')
            .mouseenter(function(e) {
                e.stopPropagation();
                var $this = $(this)
                    parent = $this.parent();
         
                // reset delay timer
                if ( parent.data('moreTimeout') ) clearTimeout( parent.data('moreTimeout') );
            })
            .mouseleave(function(e) {
                e.stopPropagation();
                var $this = $(this);
         
                // close more list
                $this.stop().css({'display': 'none'});
            });
        }
        triggers();
    }
    
    function triggers()
    {
        // build keyword & products tooltips for content
        $(".MG-the-content").each(function(){
            var that                  = $(this),
                that_doc              = that.get(0),
                keywords              = null, //that.data('keywords')
                link_color            = MG_opt.link_color;
                
            keywords = that.find('.MG-keywords').html();
            keywords = JSON && JSON.parse(keywords) || $.parseJSON(keywords);
            keywords = $.extend(keywords, {});
            that.find('.MG-keywords').remove();
            //console.log( keywords ); return false;  

            max_replacements = parseInt( MG_opt.link_maxreplace );
 
            // debug - no replacements are made!
            if (max_replacements === -999) return;
 
            // loop through keywords
            $.each( keywords, function(){
                
                var $row        = $(this),
                    products    = $row,
                    keyword     = '',
                    mr          = '',
                    items       = new Array;
                
                //delete product[0]['keyword'];
                
                $.each( $row.first().get(0), function(key, item){
                    keyword = item['keyword'];
                    mr      = item['mr'];
                    items.push( item );
                });
                //console.log( keyword );

                if ( !misc.hasOwnProperty(max_kwc, keyword) ) {
                    max_kwc[keyword] = parseInt( mr != '' ? mr : max_replacements );
                }
                //if ( !misc.hasOwnProperty(kwc, keyword) ) {
                //    kwc[keyword] = 0;
                //}
                //MG_find_replace( '\b' + keyword + '\b', function(term){
                MG_find_replace( keyword, function(term){
                    var link = $( '<div class="MG-tooltip" data-keyword="' + keyword + '" />' );
 
                    link.css( 'background-color', link_color );
                    //link.data( 'keyword', keyword );
                    link.data( 'items', items );
                    
                    link.html( term + " " + create_tooltip( link ) );
                    return link[0].outerHTML;
                    
                }, that_doc );
            });
            //console.log( kwc );
            
            // keep replacements based on maximum allowed
            var kwc = MG_max_replacements();
            //console.log( kwc );

            // save keyword hits
            MG_save_hits( kwc );
            
            moreBtnList( that );
        });
    }

    function check_available( asin, countries )
    {
        
    }
    
    var misc = {
        hasOwnProperty: function(obj, prop) {
            var proto = obj.__proto__ || obj.constructor.prototype;
            return (prop in obj) &&
            (!(prop in proto) || proto[prop] !== obj[prop]);
        },
        
        hasClass: function(el, cls) {
            return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') > -1;
            //return el.className && new RegExp("(\\s|^)" + cls + "(\\s|$)").test(el.className);
        },
        
        // type: class | id | tag
        removeTagKeepContent: function(id, type, keep_first_only, use_native) {
            var keep_first_only = keep_first_only || true,
                use_native = use_native || true;
            
            // native | vanilla js - faster
            if ( use_native ) {
                var el = null;
                switch (type) {
                    case 'class':
                        el = document.getElementsByClassName(id);
                        break;
                    case 'tag':
                        el = document.getElementsByTagName(id);
                        break;
                    case 'id':
                        el = document.getElementById(id);
                        break;
                }
                
                while (el.length) {
                    var parent = el[ 0 ].parentNode;
                    var cc = 0;
                    while( el[ 0 ].firstChild && ( !keep_first_only || ( keep_first_only && !cc ) ) ) {
                        parent.insertBefore(  el[ 0 ].firstChild, el[ 0 ] );
                        cc++;
                    }
                    parent.removeChild( el[ 0 ] );
                }
                return;
            }

            // jquery version - slower than the vanilla js
            //$( id ).contents().unwrap();
            // OR
            $( id ).replaceWith(function() { return $(this).contents(); });
            return;
        }
    };

    // external usage
    return {
    }
})(jQuery);