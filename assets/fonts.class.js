
(function($) {
    $.fn.MG_FontSelect = function(options) {

        var __bind = function(fn, me) {
            return function() {
                return fn.apply(me, arguments);
            };
        };

        
        var fonts = [];

        var settings = {
            style: 'MG-font-select',
            placeholder: 'Select a font',
            lookahead: 2,
            api: '//fonts.googleapis.com/css?family='
        };

        var Fontselect = (function() {

            function Fontselect(original, o) {
                
                

                this.$original = $(original);
                this.options = o;
                this.active = false;
                this.updateFonts();
                this.setupHtml();
                this.getVisibleFonts();
                this.bindEvents();

                var font = this.$original.val();

                if (font) {
                    this.updateSelected();
                    this.addFontLink(font);
                }
            }

            Fontselect.prototype.updateFonts = function() {
              var new_fonts = this.$original.data('fonts');
              fonts = $.parseJSON( new_fonts );
            }

            Fontselect.prototype.bindEvents = function() {
                var self = this;
                $('li', this.$results)
                    .click(__bind(this.selectFont, this))
                    .mouseenter(__bind(this.activateFont, this))
                    .mouseleave(__bind(this.deactivateFont, this));

                $('span', this.$select).click(__bind(this.toggleDrop, this));
                this.$arrow.click(__bind(this.toggleDrop, this));

                this.$original.on('change_font',function() {
                    self.updateSelected();
                });
            };

            Fontselect.prototype.toggleDrop = function(ev) {

                if (this.active) {
                    this.$element.removeClass('MG-font-select-active');
                    this.$drop.hide();
                    clearInterval(this.visibleInterval);

                } else {
                    this.$element.addClass('MG-font-select-active');
                    this.$drop.show();
                    this.moveToSelected();
                    this.visibleInterval = setInterval(__bind(this.getVisibleFonts, this), 500);
                }

                this.active = !this.active;
            };

            Fontselect.prototype.selectFont = function() {

                var font = $('li.active', this.$results).data('value');
                this.$original.val(font).change();
                this.updateSelected();
                this.toggleDrop();
            };

            Fontselect.prototype.moveToSelected = function() {

                var $li, font = this.$original.val();

                if (font) {
                    $li = $("li[data-value='" + font + "']", this.$results);
                } else {
                    $li = $("li", this.$results).first();
                }

                if( $li.length > 0 ){
                    this.$results.scrollTop($li.addClass('active').position().top);
                }
            };

            Fontselect.prototype.activateFont = function(ev) {
                $('li.active', this.$results).removeClass('active');
                $(ev.currentTarget).addClass('active');
            };

            Fontselect.prototype.deactivateFont = function(ev) {

                $(ev.currentTarget).removeClass('active');
            };

            Fontselect.prototype.updateSelected = function() {

                var font = this.$original.val();
                $('span', this.$element).text(this.toReadable(font)).css(this.toStyle(font));
            };

            Fontselect.prototype.setupHtml = function() {

                this.$original.empty().hide();
                this.$element = $('<div>', {
                    'class': this.options.style
                });
                this.$arrow = $('<div><b></b></div>');
                this.$select = $('<a href="#"><span>' + this.options.placeholder + '</span></a>');
                this.$drop = $('<div>', {
                    'class': 'fs-drop'
                });
                this.$results = $('<ul>', {
                    'class': 'fs-results'
                });
                
                this.$original.after(this.$element.append(this.$select.append(this.$arrow)).append(this.$drop));
                this.$drop.append(this.$results.append(this.fontsAsHtml())).hide();
            };

            Fontselect.prototype.fontsAsHtml = function() {

                var l = fonts.length;
                var r, s, h = '';

                for (var i = 0; i < mg_safe_fonts.length; i++) {
                    r = this.toReadable(mg_safe_fonts[i]);
                    r = r.split(",");
                    r = r[0];
                    s = this.toStyle(mg_safe_fonts[i]);
                    h += '<li data-type="system" data-value="' + mg_safe_fonts[i] + '" style="font-family: ' + s['font-family'] + '; font-weight: ' + s['font-weight'] + '">' + r + '</li>';
                }

                for (var i = 0; i < l; i++) {
                    r = this.toReadable(fonts[i]);
                    s = this.toStyle(fonts[i]);
                    h += '<li data-type="google" data-value="' + fonts[i] + '" style="font-family: ' + s['font-family'] + '; font-weight: ' + s['font-weight'] + '">' + r + '</li>';
                }

                return h;
            };

            Fontselect.prototype.toReadable = function(font) {
                return font.replace(/[\+|:]/g, ' ');
            };

            Fontselect.prototype.toStyle = function(font) {
                var t = font.split(':');
                return {
                    'font-family': this.toReadable(t[0]),
                    'font-weight': (t[1] || 400)
                };
            };

            Fontselect.prototype.getVisibleFonts = function() {
                if (this.$results.is(':hidden')) return;

                var fs = this;
                var top = this.$results.scrollTop();
                var bottom = top + this.$results.height();

                if (this.options.lookahead) {
                    var li = $('li', this.$results).first().height();
                    bottom += li * this.options.lookahead;
                }

                $('li', this.$results).each(function() {

                    var ft = $(this).position().top + top;
                    var fb = ft + $(this).height();

                    if ((fb >= top) && (ft <= bottom)) {
                        var font = $(this).data('value');

                        if( $(this).data('type') == 'google' ){
                          fs.addFontLink(font);
                        }
                    }

                });
            };

            Fontselect.prototype.addFontLink = function(font) {

                var link = this.options.api + font;
               
                var need_link_load = false;
                $.each( fonts, function(key, value) {
                    if( value == font ){
                        need_link_load = true;
                        return false;
                    }   
                });

                if( need_link_load == true ){
                    if ($("link[href*='" + font + "']").length === 0) {
                        $('link:last').after('<link href="' + link + '" rel="stylesheet" type="text/css">');
                    }
                }
            };

            return Fontselect;
        })();

        return this.each(function(options) {
            // If options exist, lets merge them
            if (options) $.extend(settings, options);

            return new Fontselect(this, settings);
        });

    };
})(jQuery);