// ---------------------------------------------
// ---------------@module lang------------------
// ---------------------------------------------
 
define( Array.isArray ? null : [ 'lang-patch' ], function(){

'use strict';
    
var rValidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,    
    rValidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,    
    rValidbraces = /(?:^|:|,)(?:\s*\[)+/g,
    rSelectForm = /^(?:select|form)$/i,
    rValidchars = /^[\],:{}\s]*$/,    
    
    toString = Object.prototype.toString;

E.type = function( obj ){
    return obj === null ? 'null' :
        obj === undefined ? 'undefined' :
        toString.call( obj ).slice( 8, -1 ).toLowerCase();
};

//-----------------------------
//-----------类型判断----------
//-----------------------------

[ 'Array', 'Function', 'Object', 'RegExp' ].forEach(function( type ){
    E[ 'is' + type ] = function( obj ){
        return obj && toString.call( obj ) === '[object ' + type + ']';
    };
});

[ 'Boolean', 'Number', 'String' ].forEach(function( type ){
    E[ 'is' + type ] = function( obj ){
        return typeof obj === type.toLowerCase();
    };
});

// 标准浏览器使用原生的判断方法
if( Array.isArray ){
    E.isArray = Array.isArray;
}

E.mix( E, {

    // 判断是否为空对象
    isEmptyObject : function( obj ){
        var name;
        for( name in obj ){
            return false;
        }
        return true;
    },
    
    // 判断是否为纯粹的对象
    isPlainObject : function( obj ){
        if( !obj || !E.isObject(obj) ){
            return false;
        }
        var name,
            hasOwnProperty = Object.prototype.hasOwnProperty;
        
        try{
            for( name in obj ){
                if( !hasOwnProperty.call(obj,name) ){
                    return false;
                }
            }
        }
        catch( _ ){
          return false;
        }
          
        return true;
    },
    
    isWindow: function( obj ) {
        return obj && typeof obj === 'object' && 'setInterval' in obj;
    },

    /*
     * 遍历对象并执行回调
     * @param { Object/Array } 对象
     * @param { Function } 回调函数(如果回调函数的返回值为false将退出循环)
     * @param { Object } 上下文
     * @return { Object } 
     */
    each : function( obj, fn, context ){        
        var isObj = obj.length === undefined || typeof obj === 'function',
            i;            
        
        if( isObj ){
            for( i in obj ){
                if( fn.call(context, i, obj[i]) === false ){
                    break;
                }
            }
        }
        
        return obj;
    },
    
    /*
     * 将对象转换成真实数组
     * 常用于将arguments, NodeList等array-like对象转换成真实数组
     * @param { Anything } 任意类型的数据
     * @param { Array } 目标数组
     * @return { Array } 真实的数组
     */
    makeArray : function( source, target ){
        target = target || [];
        var i = 0,
            len = source.length;

        if( source !== null && source !== undefined ){
            if( E.isArray(source) && E.isArray(target) && !target.length ){
                return source;
            }    
            
            if( typeof len !== 'number' || 
                typeof source === 'string' || 
                E.isFunction(source) || 
                E.isRegExp(source) || 
                source === window ||
                // select元素有length属性，select[0]将直接返回第一个option
                // form元素也有length属性
                source.tagName && rSelectForm.test(source.tagName) ){
                    target[ target.length++ ] = source;
            }
            else{
                for( ; i < len; i++ ){
                    target[ target.length++ ] = source[i];
                }
            }
        }
        
        return target;
    },

    parseXML : function( data ) {
        var xml, tmp;
        try {
            // 标准浏览器
            if ( window.DOMParser ) { 
                tmp = new DOMParser();
                xml = tmp.parseFromString( data , 'text/xml' );
            }
            // IE6/7/8
            else{
                xml = new ActiveXObject( 'Microsoft.XMLDOM' );
                xml.async = 'false';
                xml.loadXML( data );
            }
        } catch( e ) {
            xml = undefined;
        }
        
        return xml;
    },
    
    parseJSON : function( data ) {
        if ( !data || !E.isString(data) ){
            return null;
        }

        data = data.trim();
        
        // 标准浏览器可以直接使用原生的方法
        if( window.JSON && window.JSON.parse ){
            return window.JSON.parse( data );
        }
        
        if ( rValidchars.test( data.replace( rValidescape, '@' )
            .replace( rValidtokens, ']' )
            .replace( rValidbraces, '')) ) {

            return (new Function( 'return ' + data ))();
        }
    },
    
    /*
     * 首字母大写转换
     * @param { String } 要转换的字符串
     * @return { String } 转换后的字符串 top => Top
     */    
    capitalize : function( str ){
        var firstStr = str.charAt(0);
        return firstStr.toUpperCase() + str.replace( firstStr, '' );
    },
    
    // 对数组进行去重
    distinct : function( arr ){
        var len = arr.length,
            newArr = [],
            obj = {},
            i = 0,            
            item, newItem;

        for( ; i < len; i++ ){
            // 利用object的key不相等来对数组进行去重
            item = arr[i];
            // key带上相应的数据类型来确保对字符串1和数字1的精确去重
            newItem = item + ( typeof item );
            
            if( obj[newItem] !== item ){
                newArr[ newArr.length++ ] = item;
                obj[ newItem ] = item;
            }
        }
        
        return newArr;
    },
    
    noop : function(){}
    
});

});
