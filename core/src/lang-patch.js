// ---------------------------------------------
// -------------@module lang-patch--------------
// ---------------------------------------------
 
define(function(){

'use strict';

var AP = Array.prototype,
    DP = Date.prototype,
    FP = Function.prototype,
    SP = String.prototype,
    
    hasOwnProperty = Object.prototype.hasOwnProperty;
    
if( !AP.indexOf ){
    /*
     * ECMAScript 5 15.4.4.14
     * 查找某数组元素在数组中的索引，不包含则返回-1
     * @param { Anything } 数组元素
     * @param { Number } 查找的起始索引，负数则是数组末尾的偏移量( -2 => len - 2 )
     * @return { String } 索引值
     */
    AP.indexOf = function( item, i ){
        var len = this.length;
            
        i = parseInt( i ) || 0;
            
        if( i < 0 ){
            i += len;
        }

        for( ; i < len; i++ ){
            if( this[i] === item ){
                return i;
            }
        }
        
        return -1;
    };
}

if( !AP.lastIndexOf ){
    // ECMAScript 5 15.4.4.15
    // lastIndexOf为indexOf的反转版，lastIndexOf是从右到左的查找顺序，indexOf是从左到右的查找顺序
    AP.lastIndexOf = function( item, i ){
        var len = this.length;
        
        i = parseInt( i ) || len - 1;
        
        if( i < 0 ){
            i += len;
        }
        
        for( ; i >= 0; i-- ){
            if( this[i] === item ){
                return i;
            }
        }
        
        return -1;
    };
}
    
if( !AP.every ){
    /*
     * ECMAScript 5 15.4.4.16
     * 遍历数组并执行回调，如果每个数组元素都满足回调函数的测试则返回true，否则返回false
     * @param { Function } 回调函数( argument : 数组元素, 数组索引, 数组 )
     * @param { Object } this的指向对象，默认为window
     * @return { Boolean } 每个数组元素是否通过回调的测试
     */
    AP.every = function( fn, context ){
        var len = this.length,
            i = 0;
    
        for( ; i < len; i++ ){
            if( !fn.call(context, this[i], i, this) ){
                return false;
            }
        }
        
        return true;
    };
}

if( !AP.some ){
    /*
     * ECMAScript 5 15.4.4.17
     * 遍历数组并执行回调，如果其中一个数组元素满足回调函数的测试则返回true，否则返回false
     * @param { Function } 回调函数( argument : 数组元素, 数组索引, 数组 )
     * @param { Object } this的指向对象，默认为window
     * @return { Boolean } 其中一个数组元素是否通过回调的测试
     */
    AP.some = function( fn, context ){
        var len = this.length,
            i = 0;
    
        for( ; i < len; i++ ){
            if( fn.call(context, this[i], i, this) ){
                return true;
            }
        }
        
        return false;
    };
}
    
if( !AP.forEach ){
    /*
     * ECMAScript 5 15.4.4.18     
     * 遍历数组并执行回调
     * @param { Function } 回调函数( argument : 数组元素, 数组索引, 数组 )
     * @param { Object } this的指向对象，默认为window
     */
    AP.forEach = function( fn, context ){        
        var len = this.length,
            i = 0;
            
        for( ; i < len; i++ ){
            fn.call( context, this[i], i, this );
        }
    };
}

if( !AP.map ){
    /*
     * ECMAScript 5 15.4.4.19
     * 遍历数组并执行回调，根据回调函数的返回值合并成一个新数组
     * @param { Function } 回调函数( argument : 数组元素, 数组索引, 数组 )
     * @param { Object } this的指向对象，默认为window
     * @return { Array } 新数组
     */
    AP.map = function( fn, context ){
        var len = this.length,
            arr = [],
            i = 0,
            j = 0;
        
        for( ; i < len; i++ ){
            arr[ j++ ] = fn.call( context, this[i], i, this );
        }
        
        return arr;
    };
}

if( !AP.filter ){
    /*
     * ECMAScript 5 15.4.4.20 
     * 遍历数组并执行回调，将满足回调函数测试的数组元素过滤到一个新的数组中，原数组保持不变。
     * @param { Function } 回调函数( argument : 数组元素, 数组索引, 数组 )
     * @param { Object } this的指向对象，默认为window
     * @return { Array } 新数组
     */
    AP.filter = function( fn, context ){
        var len = this.length,
            arr = [],
            i = 0,
            j = 0,
            result;

        for( ; i < len; i++ ){
            result = this[i];
            
            if( fn.call(context, result, i, this) ){
                arr[ j++ ] = result;
            }
        }
        
        return arr;        
    };
}
    
if( !AP.reduce ){
    /*
     * ECMAScript 5 15.4.4.21    
     * 遍历数组并执行回调，将previous元素与next元素传入回调函数中进行计算，
     * 回调的返回值作为previous元素继续与next元素再进行计算，最后返回计算结果
     * @param { Function } 回调函数( argument : previous, next, 数组索引, 数组 )
     * @param { Anything } previous的初始值，默认为数组的第一个元素，
     * 无参时从0索引开始遍历，有参时从1开始遍历
     * @return { Anything } 遍历数组后的计算结果
     */     
    AP.reduce = function( fn, result ){        
        var len = this.length,
            i = 0;
            
        if( result === undefined ){
            result = this[i++];
        }
        
        for( ; i < len; i++ ){
            result = fn( result, this[i], i, this );
        }
        
        return result;
    };
}

if( !AP.reduceRight ){
    // ECMAScript 5 15.4.4.22
    // 该方法是reduce的反转版，只是计算顺序是从右到左，reduce是从左到右
    AP.reduceRight = function( fn, result ){
        var len = this.length,
            i = len - 1;
            
        if( result === undefined ){
            result = this[i--];
        }
        
        for( ; i >= 0; i-- ){
            result = fn( result, this[i], i, this );
        }
        
        return result;
    };    
}

// 修复IE6-7的unshift不返回数组长度的BUG
if( [].unshift(1) !== 1 ){
    var unshift = AP.unshift;
    AP.unshift = function(){
        unshift.apply( this, arguments );
        return this.length;
    };
}

if( !Date.now ){
    Date.now = function(){
        return +new Date;
    };
    
    DP.getYear = function(){
        return this.getFullYear() - 1900;
    };
    
    DP.setYear = function( year ){
        return this.setFullYear( year );
    };
}

if( !FP.bind ){
    /*
     * ECMAScript 5 15.3.4.5
     * 创建一个新的绑定函数
     * @param { Object } 新函数的this指针
     * @param { agruments } 新函数的默认的参数
     * @return { Function } 返回新函数
     */
    FP.bind = function( context ){        
        if( arguments.length < 2 && context === undefined ){
            return this;
        }
        
        var self = this,
            Nop = function(){},
            args = AP.slice.call( arguments, 1 ),                        
            Bound = function(){
                var newArg = args.concat.apply( args, arguments );
                    context = this instanceof Nop && context ? this : context;
                    
                return self.apply( context, newArg );
            };
            
        Nop.prototype = this.prototype;
        Bound.prototype = new Nop();
        return Bound;
    };
}

if( !Object.keys ){
    /*
     * ECMAScript 5 15.2.3.14
     * 遍历对象，将对象的属性名组成数组返回( 不包含原型链上的属性名 )
     * @param { Object } 待遍历的对象
     * @return { Array } 属性名数组
     */
    Object.keys = function( obj ){
        var hasDontEnumBug = !({ toString: null }).propertyIsEnumerable( 'toString' ),
            arr = [],
            i = 0,
            j = 0,
            name, dontEnums, len;

        for( name in obj ){
            if( hasOwnProperty.call(obj, name) ){
                arr[ j++ ] = name;
            }
        }
        
        // 修复IE的fon in的BUG
        if( hasDontEnumBug ){
            dontEnums = 'propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor'.split( ',' );
            len = dontEnums.length;
            for( ; i < len; i++ ){
                name = dontEnums[i];
                if( hasOwnProperty.call(obj, name) ){
                    arr[ j++ ] = name;
                }
            }
        }
        
        return arr;
    };
}

if( !SP.trim ){
    // 字符串首尾去空格
    SP.trim = function(){
        // http://perfectionkills.com/whitespace-deviations/
        var whiteSpaces = [
                '\\s',
                '00A0', 
                '1680', 
                '180E', 
                '2000-\\u200A',
                '200B', 
                '2028', 
                '2029', 
                '202F', 
                '205F', 
                '3000'
            ].join('\\u'),
            
            trimLeftReg = new RegExp( '^[' + whiteSpaces + ']' ),
            trimRightReg = new RegExp( '[' + whiteSpaces + ']$' );
            
        return this.replace( trimLeftReg, '' ).replace( trimRightReg, '' );
    };
}

});