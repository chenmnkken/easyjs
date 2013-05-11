// ---------------------------------------------
// ---------------@module attr------------------
// ---------------------------------------------
 
define([ 'node' ], function(){

'use strict';

var hasAttribute = document.documentElement.hasAttribute,
    noButtonValue = !E.support.buttonValue,
    
    rBoolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
    rFocusable = /^(?:button|input|object|select|textarea)$/i,
    rClickable = /^a(?:rea)?$/i,
    
    attrHooks = {},
    propHooks = {},
    boolHooks = {},
    valHooks = {},
    
    attrFix = {
        'for' : 'htmlFor',
        'class' : 'className'
    },
    
    propFix = {
        enctype : 'encoding'
    };

// IE6-7中button元素的value和innerText纠缠不清    
valHooks.button = {
    get : function( elem ){
        if( noButtonValue && elem.tagName === 'BUTTON' ){
            return elem.getAttributeNode( 'value' ).nodeValue || '';        
        }
        return 'value' in elem ?
            elem.value :
            '';
    },
    set : function( elem, val ){
        if( noButtonValue && elem.tagName === 'BUTTON' ){
            elem.getAttributeNode( 'value' ).nodeValue = val;
        }
        else{
            elem.value = val;
        }
    }
};

attrHooks.value = {
    get : function( elem ){
        var val = valHooks.button.get( elem );
        val = val === '' ? null : val;
        return val;
    }    
};

attrHooks.value.set = valHooks.button.set;

// get tabindex在各浏览器中有一系列的兼容问题
attrHooks.tabindex = {
    get : function( elem ){
        var attrNode = elem.getAttributeNode( 'tabindex' ),
            tagName = elem.tagName;
            
        return attrNode && attrNode.specified ?
            attrNode.value :
            rFocusable.test( tagName ) || rClickable.test( tagName ) && elem.href ?
                0 :
                null;                    
    }
};

propHooks.tabIndex = {
    get : function( elem ){
        var index = attrHooks.tabindex.get( elem );
        index = index === null ? -1 : index;
        return parseInt( index, 10 );
    }
};

// IE6-7 set tabindex时有问题
if( !E.support.attrTabindex ){
    attrHooks.tabindex.set = function( elem, val ){
        elem.getAttributeNode( 'tabindex' ).nodeValue = val;
    };
}

// 使用elem.getAttribute( name, 2 )确保这些属性的返回值在IE6/7下和其他浏览器保持一致
[ 'action', 'cite', 'codebase', 'href', 'longdesc', 'lowsrc', 'src', 'usemap' ].forEach(function( name ){
    attrHooks[ name ] = {
        get : function( elem ){
            return elem.getAttribute( name, 2 );
        }
    };
});

// 处理boolean attributes的兼容问题
boolHooks = {
    // 如果存在该attribute，返回同名值( checked="checked" )
    get : function( elem, name ){
        var attrNode,
            property = easyAttr.prop( elem, name );

        return property === true || !E.isBoolean( property ) && ( attrNode = elem.getAttributeNode(name) ) && attrNode.nodeValue !== false ?
            name.toLowerCase() :
            undefined;
    },
    set : function( elem, val, name ){
        // 如果val为false，移除该attribute
        if( val === false ){
            E( elem ).removeAttr( name );
        }
        // 如果val不为false，设置同名值( checked="checked" )
        else{
            if( name in elem ){
                elem[ name ] = true;
            }
            elem.setAttribute( name, name.toLowerCase() );
        }
    }
};

valHooks.option = {
    get : function( elem ){
        var val = elem.attributes.value;
        return !val || val.specified ? elem.value : elem.text;
    }
};

valHooks.select = {
    get : function( elem ){
        var index = elem.selectedIndex,
            // 单选框的type属性为select-one
            // 多选框的type属性为select-multiple
            one = elem.type === 'select-one',    
            options = elem.options,
            vals = [],
            val, max, option, i;
        
        if( index < 0 ){
            return '';
        }
        // 单选框返回的是单个val字符串
        // 复选框返回的是多个val数组
        i = one ? index : 0;
        max = one ? index + 1 : options.length;
        for( ; i < max; i++ ){
            option = options[i];
            // 遍历option元素的时候需要过滤掉disabled的元素
            if ( option.selected && (E.support.optDisabled ? !option.disabled : option.getAttribute('disabled') === null) &&
                    (!option.parentNode.disabled || option.parentNode.tagNmae !== 'OPTGROUP' ) ) {
                
                val = E( option ).val();
                
                if( one ){
                    return val;
                }
                
                vals.push( val );
            }
        }
        
        if ( one && !vals.length && options.length ) {
            return E( options[ index ] ).val();
        }

        return vals;
    }
};

// 让所有浏览器都默认返回checkbox和radio的value为'on'
if( !E.support.checkOn ){
    [ 'checkbox', 'radio' ].forEach(function( name ){
        valHooks[ name ] = {
            get : function( elem ){
                var val = elem.value;
                return val === '' ? 'on' : val;
            }
        };
    });
}

var easyAttr = {

    // get/set attribute
    attr : function( elem, name, val ){
        var nodeType = elem ? elem.nodeType : undefined,
            hooks;
            
        if( !nodeType || nodeType === 3 || nodeType === 8 || nodeType === 2 ){
            return '';
        }    
        
        // IE6-7把property当arrtibute用，需要进行修复
        if( !hasAttribute ){
            name = attrFix[ name ] || name;
        }
        
        hooks = rBoolean.test( name ) ? boolHooks : attrHooks[ name ];
        // getAttribute
        if( val === undefined ){
            if( hooks && hooks.get ){
                return hooks.get( elem, name );
            }
            val = elem.getAttribute( name );
            return val;
        }
        // setAttribute
        else{
            if( hooks && hooks.set ){
                hooks.set( elem, val, name );
            }
            else{
                elem.setAttribute( name, val );
            }
        }
    },

    // get/set property
    prop : function( elem, name, val ){
        var nodeType = elem ? elem.nodeType : undefined,
            hooks;
            
        if( !nodeType || nodeType === 3 || nodeType === 8 || nodeType === 2 ){
            return;
        }    
            
        if( !hasAttribute ){
            name = propFix[ name ] || name;
        }        
        hooks = propHooks[ name ];
        // getProperty
        if( val === undefined ){
            if( hooks && hooks.get ){
                return hooks.get( elem, name );
            }
            return elem[ name ];
        }
        // setProperty
        else{
            if( hooks && hooks.set ){
                hooks.set( elem, val, name );
            }
            else{
                elem[ name ] = val;
            }
        }    
    }

};

E.mix( E.prototype, {
        
    hasClass : function( name ){        
        var len = this.length,
            i = 0,
            elem, className;
            
        for( ; i < len; i++ ){
            elem = this[i];
            
            if( elem.nodeType === 1 ){
                className = elem.className;
                if( className && ~(' ' + className + ' ').indexOf(' ' + name + ' ') ){
                    return true;
                }
            }  
        }
        
        return false;
    },
    
    addClass : function( name ){
        name += '';
        var arr = name.split( ' ' ),
            len = arr.length;
            
        return this.forEach(function(){
            if( this.nodeType === 1 ){
                var className = this.className,
                    newClassName = className,
                    i = 0,
                    result;
                    
                if( !className ){
                    this.className = name;
                }
                else{
                    className = ' ' + className + ' ';
                    for( ; i < len; i++ ){
                        result = arr[i];
                        // 检测当前元素是否已存在该className，确保不重复添加
                        if( !~className.indexOf(' ' + result + ' ') ){
                            newClassName += ' ' + result;
                        }
                    }
                    
                    this.className = newClassName;
                }
            }
        });
    },
    
    removeClass : function( name ){        
        var arr, len, removeAll;
        
        if( E.isString(name) ){
            arr = name.split( ' ' );
            len = arr.length;
        }
        else{
            removeAll = true;
        }
        
        return this.forEach(function(){
            if( this.nodeType === 1 ){
                var className = this.className,
                    i = 0;
                if( className ){
                    if( removeAll ){
                        this.className = '';
                    }
                    else{
                        className = ' ' + className + ' ';
                        for( ; i < len; i++ ){
                            // 替换成空格是防止替换后2个相邻的className粘在一起
                            className = className.replace( ' ' + arr[i] + ' ', ' ' );
                        }
                        
                        this.className = className.trim();                    
                    }
                }
            }
        });    
    },
    
    replaceClass : function( source, target ){
        if( E.isString(source) && E.isString(target) ){
            source = ' ' + source + ' ';
            target = ' ' + target + ' ';
            
            return this.forEach(function(){
                if( this.nodeType === 1 ){
                    var className = ' ' + this.className + ' ';
                    // 确保当前元素没有目标className，避免重复
                    if( !~className.indexOf(target) ){
                        className = className.replace( source, target );
                        this.className = className.trim();
                    }
                }                
            });    
        }
    },
    
    toggleClass : function( name ){
        name += '';
        var arr = name.split( ' ' ),
            len = arr.length;
            
        return this.forEach(function(){
            if( this.nodeType === 1 ){
                var className = this.className,
                    i = 0,
                    result;
                    
                if( !className ){
                    this.className = name;
                }
                else{
                    className = ' ' + className + ' '
                    for( ; i < len; i++ ){
                        result = arr[i];
                        // 替换成和后置空格是防止替换后2个相邻的className粘在一起
                        className = ~className.indexOf( result ) ? 
                            className.replace( ' ' + result + ' ', ' ' ) :
                            className + result + ' ';
                    }
                    this.className = className.trim();
                }
            }
        });
    },
    
    removeAttr : function( name ){
        var arr = name.split( ' ' ),
            len = arr.length;
        
        return this.forEach(function(){
            if( this.nodeType === 1 ){
                var i = 0,
                    result;

                for( ; i < len; i++ ){
                    result = arr[i];
                    this.removeAttribute( result );
                    // attributes值为boolean类型时需要将值设置成false
                    if( rBoolean.test(result) && result in this ){
                        this[ result ] = false;
                    }
                }
            }
        });
    },
    
    removeProp : function( name ){
        var arr = name.split( ' ' ),
            len = arr.length;
            
        return this.forEach(function(){
            if( this.nodeType === 1 ){
                var i = 0,
                    result;
                    
                for( ; i < len; i++ ){
                    result = arr[i];
                    
                    try{
                        delete this[ result ];
                    }
                    catch( _ ){
                        this.removeAttribute( result );
                    };
                }
            }
        });
    },
    
    val : function( value ){
        var elem, hooks, tagName, type;
        // getValue
        if( value === undefined ){
            elem = this[0];
            tagName = elem.tagName.toLowerCase();
            type = elem.type;
            hooks = valHooks[ tagName ] || valHooks[ type ];
                
            if( hooks && hooks.get ){
                return hooks.get( elem );
            }
            value = elem.value;
            return E.isString( value ) ?
                value.replace( /\r/g, '' ) :    // 替换换行符
                value === null ?
                    '' :
                    value;
        }
        
        // setValue       
        return this.forEach(function( i ){
            elem = E( this );
                
            if( this.nodeType !== 1 ){
                return;
            }
            // value需要转换成字符串
            value = value == null ?
                '' :
                E.isNumber( value ) ?
                value + '' :
                value;
            
            tagName = this.tagName.toLowerCase();
            type = this.type;
            hooks = valHooks[ tagName ] || valHooks[ type ];

            if( hooks && hooks.set ){                
                hooks.set( this, value );
            }
            else{
                this.value = value;
            }
        });
    }

});

[ 'attr', 'prop' ].forEach(function( methodName ){    
    E.prototype[ methodName ] = function( name, val ){
        if( E.isString(name) ){
            // get
            if( val === undefined ){
                return easyAttr[ methodName ]( this[0], name );
            }
            
            var isFunction = E.isFunction( val );
            // set        
            return this.forEach(function( i ){
                val = isFunction ?
                    val.call(this, i, E(this)[methodName](name)) :
                    val;
                    
                easyAttr[ methodName ]( this, name, val );
            });
        }
        
        if( E.isPlainObject(name) ){
            E.each( name, function( name, val ){
                this[ methodName ]( name, val );
            }, this );
            return this;
        }        
    };    
});

});