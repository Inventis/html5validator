/*!
 * HTML5validator
 */
;(function ( $, window, document, undefined ) {

    // Create the defaults once
    var pluginName = 'html5validator',
        defaults = {
            disableBrowserValidation: true,
            disableAutoValidation: false,
            messages: {
                required: 'This field is required',
                requiredCheckbox: 'This field is required',
                minlength: 'The minimum length of this field is not met',
                maxlength: 'The content of this field is too long',
                email: 'This is not an email address'
            },
            customValidators: {},
            fieldParentSelector: '.entry'
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;

        this.options = $.extend( {}, defaults, options );
        if ( options && options.messages ) {
            this.options.messages = $.extend( {}, defaults.messages, options.messages );
        }

        this._defaults = defaults;
        this._name = pluginName;
        
        this.isValid = false;
        this.validationErrors = [];
        this.errorElements = [];
        
        this.validators = $.extend( {}, this.validators, this.options.customValidators );

        this.init();
    }

    Plugin.prototype.init = function () {
        // Browser validation
        if ( this.options.disableBrowserValidation ) {
            this.element.noValidate = true;
        }
        
        // Bind submit event
        $(this.element).submit($.proxy( this.onFormSubmit, this ));
        // $('button').click($.proxy( this.onFormSubmit, this ));
    };
    
    Plugin.prototype.onFormSubmit = function() {
        this.isValid = false;
        this.visibleErrors = [];
        this.validationErrors = [];
        this.hideErrors();
        
        // default validation
        if ( !this.options.disableAutoValidation ) {
            this.validate( 'required', $('input[type!=checkbox][required], textarea[required]', this.element) );
            this.validate( 'requiredCheckbox', $('input[type=checkbox][required]', this.element) );
            this.validate( 'minlength', $('input[data-minlength]', this.element) );
            this.validate( 'maxlength', $('input[data-maxlength]', this.element) );
            this.validate( 'email', $('input[type=email]', this.element) );
        }
        
        // validation rules set in the config
        if ( this.options.fields ) {
            for ( field in this.options.fields ) {
                // check if the field exists
                var fieldEl = $('[name=' + field + ']', this.element);
                if ( fieldEl ) {
                    // extract validator rules
                    var rules = this.options.fields[field].split('|');
                    for ( i in rules ) {
                        this.validate(rules[i], fieldEl);
                    }
                }
            }
        }
        
        if ( this.validationErrors.length > 0) {
            $(this.validationErrors).each( $.proxy( this.showError, this ) );
            $(this.element).trigger('failed');
            this.validationErrors[0].element.focus();
            return false;
        }
        
        if ( typeof( this.options.success ) == 'function' ) {
            return this.options.success();
        }
        
        return true;
    };
    
    Plugin.prototype.validate = function( rule, elements ) {
        if (elements.length == 0 ) return false;
        
        validatorRule = rule.split(':')[0];
        
        // check if the validator exists
        if ( this.validators[rule] ) {
            elements.each( $.proxy( function(index, el) {
                if ( !this.validators[validatorRule]( el, rule.split(':') ) ) {
                    this.validationErrors.push({
                        element: $(el),
                        type: validatorRule
                    });
                }
            }, this ) );
        } else {
            console.log('validator "' + rules[i] + '" not found!');
        }
    }
    
    Plugin.prototype.validators = {
        required: function( el ) {
            if ( !$(el).val() ) {
                return false;
            }
            return true;
        },
        requiredCheckbox: function( el ) {
            if ( !el.checked ) {
                return false;
            }
            return true;
        },
        minlength: function( el, arguments ) {
            if ( arguments.length > 1  && arguments[1] <= $(el).val().length ) {
                return true;
            } else if ( $(el).data('minlength') <= $(el).val().length ) {
                return true;
            }
            
            return false;
        },
        maxlength: function( el, arguments ) {
            if ( arguments.length > 1  && arguments[1] > $(el).val().length ) {
                return true;
            } else if ( $(el).data('maxlength') > $(el).val().length ) {
                return true;
            }
            
            return false;
        },
        email: function( el ) {
            var regEx = /^([\w-\.\+]+@([\w-]+\.)+[\w-]{2,4})?$/;
            return regEx.test( $(el).val() );
        }
    };
    
    Plugin.prototype.showError = function(index, errorObject) {
        // we only show the first error per element
        if ( $.inArray( errorObject.element.attr('name'), this.visibleErrors ) != -1 ) {
            return false;
        }
        this.visibleErrors.push(errorObject.element.attr('name'));
        
        // default error message
        var message = this.options.messages[errorObject.type];
        
        // check for a custom error message on the element
        if ( errorObject.element.data( errorObject.type + '-error' ) ) {
            message = errorObject.element.data( errorObject.type + '-error' );
        }
        
        // check for a custom function to show the error
        if ( typeof( this.options.showError ) == 'function' ) {
            var errorElement =  this.options.showError( errorObject.element, errorObject.type, message );
        } else {
            // fallback to the default action
            errorObject.element.parents(this.options.fieldParentSelector).addClass('error');

            if ( message ) {
                var errorElement = $('<span />').addClass('error-inline').text(message);
                errorObject.element.parents(this.options.fieldParentSelector).append( errorElement );
            }
        }
        
        this.errorElements.push( errorElement );
    };
    
    Plugin.prototype.hideErrors = function() {
        $(this.errorElements).each(function( index, el ) { $(el).remove(); });
        this.errorElements = [];
        
        // check for a custom function to show the error
        if ( typeof( this.options.hideErrors ) == 'function' ) {
            this.options.hideErrors();
        } else {
            $('.error', this.element).removeClass('error');
        }
    }

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                new Plugin( this, options ));
            }
        });
    }

})( jQuery, window, document );