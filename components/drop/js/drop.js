/*
* Drop components v0.1.0 for easy.js
*
* Copyright (c) 2013 Yiguo Chan
* Released under the MIT Licenses
*
* Mail : chenmnkken@gmail.com
* Date : 2013-5-11 
*/
define(['../../drag/js/drag'], function(){

'use strict';

var defaults = {
    accept     :   '*',       // String        设置drop元素仅接受基本选择器匹配的drag元素
    mode       :   'pointer'  // String        pointer, intersect, strict
};

var dropCache = [],

    easyDrop = {
        
        getPosition : function( elem ){
            var offset = elem.offset();        
            
            return {
                top : offset.top,
                right : offset.left + elem.outerWidth(),
                bottom : offset.top + elem.outerHeight(),
                left : offset.left               
            };
        },
        
        //drag元素和drop元素互相接触的模式
        mode : {
            // 鼠标指针与drop元素接触
            pointer : function( drag, drop ){
                return drag.left >= drop.left &&
                    drag.left <= drop.right &&
                    drag.top >= drop.top &&
                    drag.top <= drop.bottom;
            },
            
            // drag元素和drop元素的边界有接触
            intersect : function( drag, drop ){
                return drag.top <= drop.bottom &&
                    drag.right >= drop.left &&
                    drag.bottom >= drop.top &&
                    drag.left <= drop.right;
            },
            
            // drag元素完全在drop元素的内部
            strict : function( drag, drop ){
                return drag.top >= drop.top &&
                    drag.right <= drop.right &&
                    drag.bottom <= drop.bottom &&
                    drag.left >= drop.left;       
            }
        }

    };

var Drop = function( target, options ){
    target = E( target ).eq( 0 );
    options = options || {};
    
    if( !target.length ){
        return;
    }
    
    var o = E.merge( defaults, options );    

    target.data( 'dropIndex', dropCache.length );   
    
    dropCache.push({
        elem : target,
        mode : o.mode,
        accept : o.accept
    });

    o.target = target;
    this.__o__ = o;
};

E.mix( Drop, {

    /*    
     * accept的DOM元素过滤器，判断是否符合selector的匹配
     * @param { HTMLElement } 
     * @param { String } 基本类型的选择器( tag, class, id )
     * @return { Boolean } 是否匹配
     */
    filter : function( elem, selector ){
        var tagName, className, name, index;
        
        // class
        if( ~selector.indexOf('.') ){
            className = elem.className;
            index = selector.indexOf( '.' );
            name = ' ' + selector.substring( index + 1 ) + ' ';    
            tagName = selector.substring( 0, index ).toUpperCase();
            return (!tagName || elem.tagName === tagName) && (className && !!~(' ' + className + ' ').indexOf(name));
        }
        // id
        if( ~selector.indexOf('#') ){
            index = selector.indexOf( '#' );
            name = selector.substring( index + 1 );    
            tagName = selector.substring( 0, index ).toUpperCase();
            return (!tagName || elem.tagName === tagName) && (elem.id === name);        
        }
        // tag
        return elem.tagName.toLowerCase() === selector;
    },

    fire : function( o, e, isMove ){
        var drag = {
                left : e.pageX,
                top : e.pageY
            },

            target = o.target[0],
            extraData = { drag : target },
            isFire = false,
            i = 0,
            drop, mode, elem;
            
        if( !dropCache.length ){
            return;
        }
            
        for( ; i < dropCache.length; i++ ){
            drop = dropCache[i];
            elem = drop.elem;
            mode = easyDrop.mode[ drop.mode ];
            
            if( (drop.accept !== '*' && !Drop.filter(target, drop.accept)) || target === elem[0] ){
                continue;
            }
            
            if( drop.mode !== 'pointer' ){
                drag.top -= e.offsetY;
                drag.left -= e.offsetX;
                drag.right = drag.left + o.width;
                drag.bottom = drag.top + o.height;
            }
            
            isFire = mode( drag, drop );
            
            if( isMove ){
                if( isFire ){
                    if( !drop.isEnter ){
                        drop.isEnter = true;
                        drop.elem.fire( 'likedropenter', extraData );                        
                    }
                    
                    drop.elem.fire( 'likedropover', extraData );                    
                }
                else if( drop.isEnter ){
                    drop.isEnter = false;
                    drop.elem.fire( 'likedropexit', extraData );
                }
            }
            else if( isFire ){
                drop.elem.fire( 'likedrop', extraData );
            }
        }
    },

    // 拖拽开始的时候都要重新计算一下drop元素的尺寸和位置
    refresh : function( elem ){
        var getPosition = easyDrop.getPosition,
            len = dropCache.length,            
            mix = E.mix,
            i = 0,
            drop;
            
        if( !len ){
            return;
        }
            
        if( elem === undefined ){    
            for( ; i < len; i++ ){
                drop = dropCache[i];
                mix( drop, getPosition(drop.elem) );
            }
        }
        else{
            i = elem.data( 'dropIndex' );
            drop = dropCache[i];
            mix( drop, getPosition(elem) );
        }
    }

});

Drop.prototype = {

    destroy : function(){
        if( !this.__o__ ){
            return;
        }
        
        var target = this.__o__.target,
            dropIndex = target.data( 'dropIndex' );        

        dropCache.splice( dropIndex, 1 );    
        target.removeData( 'dropIndex' ).un( 'likedropenter likedropover likedropexit likedrop' );
            
        this.__o__ = null;
        delete this.__o__;
    },

    on : function( type, fn ){
        if( this.__o__ ){
            var self = this;
            self.__o__.target.on( 'like' + type, function( e ){
                e.type = type;
                e.drag = e.extraData.drag;
                delete e.extraData;
                e.drop = e.target;
                fn.call( self, e );
                e.stopPropagation();
            });
        }

        return this;
    },
    
    un : function( type ){
        if( this.__o__ ){
            this.__o__.target.un( 'like' + type );
        }
        
        return this;
    } 

};

E.ui.Drop = Drop;

});