/*
* Lazyload components v0.1.1 for easy.js
*
* Copyright (c) 2013 Yiguo Chan
* Released under the MIT Licenses
*
* Mail : chenmnkken@gmail.com
* Date : 2013-5-27 
*/
define(function(){

'use strict';

var defaults = {    
    type       :   'img',           // String        延迟加载的类型 img : 图片 dom : dom元素
    trigger    :   'scroll',        // String        触发加载的事件类型
    container  :   window,          // String||Element|easyJS Object 设置在某个容器内滚动
    axis       :   'y',             // Boolean       是否纵向滚动触发
    threshold  :   0,               // Number        还有多少距离触发加载的临界值   
    effects    :   null,            // String        动画效果
    duration   :   400,             // Number        动画效果的运行时间
    easing     :   'swing',         // String        动画缓动效果的名称  
    attrName   :   'data-lazysrc'   // String        用于存放在img标签上的自定义特性名
};

var easyLazyload = {
    
    triggerHandle : function( o, offset, type ){
        var threshold = o.threshold,
            scroll = o.scroll,
            currentOffset;
            
        currentOffset = o.isReverse ? offset.offsetReverse : offset.offsetForward;
        return currentOffset >= ( scroll - threshold ) && currentOffset <= ( o.size + scroll + threshold )
    },    
    
    load : {
        img : function( o, elem, isScroll ){
            var attrName = o.attrName,
                lazysrc;
            
            if( elem[0].tagName !== 'IMG' ){
                return;
            }
            
            lazysrc = elem.attr( attrName );
            
            if( !lazysrc ){
                return;
            }
            
            // 只在触发滚动事件时才会使用动画效果
            if( o.effects && isScroll ){
                elem.css( 'visibility', 'hidden' ).one( 'load', function(){
                    easyLazyload.patterns[ o.effects ]( o, this ); 
                });
            }

            elem[0].src = lazysrc;
            // 移除缓存
            elem.removeData( 'offset' ).removeAttr( attrName );               
        },
        
        dom : function( o, elem ){
            var val = elem.val(),
                parent;
                
            if( elem[0].tagName !== 'TEXTAREA' ){
                return;
            }
            
            parent = elem.parent();
            parent.html( val );
            elem.fire( 'likeload', { target : parent[0] }).remove();
        }
    }
    
};

easyLazyload.patterns = {

    fade : function( o, target ){
        E( target ).css({ 
                display : 'none',
                visibility : '' 
            })
            .fadeIn( o.duration, o.easing );        
    }

};

// 以左右滑动、上下滑动效果显示动画
E.each({
    slideX : [ 'left', 'width' ],
    slideY : [ 'top', 'height' ]
}, function( name, val ){
    var posName = val[0],
        sizeName = val[1];

    easyLazyload.patterns[ name ] = function( o, target ){
        target = E( target );
        var parent = target.parent(),
            animMap = {
                from : {},
                to : {},
                easing : o.easing,
                duration : o.duration,
                complete : function(){
                    target.css({
                        position : '',
                        top : '',
                        left : ''
                    });
                    
                    parent.css({
                        overflow : '',
                        position : ''
                    });
                }
            };
            
        animMap.from[ posName ] = '-' + target[ sizeName ]() + 'px';
        animMap.to[ posName ] = '0px';
            
        parent.css({
            overflow : 'hidden',
            position : 'relative'
        });
        
        target.css({
                position : 'relative',
                visibility : '' 
            })
            .anim( animMap );
    };
    
});

var Lazyload = function( target, options ){
    target = E( target );
    options = options || {};
    
    var o = E.merge( defaults, options ),
        
        isY = o.axis === 'y', 
        $win = E( window ),             
        loadType = o.type,
        container = E( o.container ),   
        elems = E.makeArray( target ), 
        triggerHandle = easyLazyload.triggerHandle,                
        isScrollEvent = o.trigger === 'scroll',
        isWindow = E.isWindow( container[0] ),
        triggerElem = isScrollEvent ? container : target,        
        OFFSET = isY ? 'top' : 'left',  
        SIZE = isY ? 'height' : 'width',
        OUTERSIZE = isY ? 'outerHeight' : 'outerWidth',
        SCROLL = isY ? 'scrollTop' : 'scrollLeft';	        
        
    if( !elems || !elems.length ){
        return;
    }
    
    o.originalScroll = 0;
    o.isReverse = null;
        
    var load = function( e ){
        var i = 0,
            isCustom = false,
            isTrigger, offset, offsetForward, $elem, parent, eventType;
            
        o.scroll = container[ SCROLL ]();
        o.size = container[ SIZE ]();        
        o.isReverse = o.scroll < o.originalScroll ? true : false;
        o.originalScroll = o.scroll;    
            
		if( e ){
            eventType = e.type;
			if( eventType !== 'scroll' && eventType !== 'resize' ){
				isCustom = true;
			}
		}
        
        for( ; i < elems.length; i++ ){			
			$elem = E( elems[i] );
            
            if( !isCustom ){
                offset = $elem.data( 'offset' );
                
                if( offset === undefined ){
                    parent = $elem.parent();
                    offsetForward = parent.offset( !isWindow )[ OFFSET ];
                    
                    offset = {
                        offsetForward : offsetForward,
                        offsetReverse : offsetForward + parent[ OUTERSIZE ]()
                    };

                    $elem.data( 'offset', offset );
                }
                
                isTrigger = triggerHandle( o, offset, eventType );	
            }
            else{
                isTrigger = isCustom;
            }
            
            // 开始加载
			if( isTrigger ){
                isTrigger = false;                
                easyLazyload.load[ loadType ]( o, $elem, eventType === 'scroll' );
                // 从DOM数组中移除该DOM	
                elems.splice( i--, 1 );
			}
        }
        
		// 所有的图片加载完后卸载触发事件
		if( !elems.length ){
            container.un( eventType + '.lazyload' );            
			$win.un( 'resize.lazyload' );
			elems = null;
		}
    };

	triggerElem[ isScrollEvent ? 'on' : 'one' ]( o.trigger + '.lazyload', load );
    
    if( isWindow ){
        $win.on( 'resize.lazyload', load );    
    }

    if( isScrollEvent ){
        load({ type : 'scroll' });
    }
    
    o.target = target;
    this.__o__ = o;
};

Lazyload.prototype = {
    
    on : function( type, fn ){
        if( !this.__o__ ){
            return this;
        }
        
        var o = this.__o__,
            self = this,
            eventType = o.type === 'img' ? type : 'like' + type;
        
        return this.__o__.target.on( eventType, function( e ){
            E( this ).un( eventType );
            e.type = type;
            e.target = ( e.extraData && e.extraData.target ) || this;
            fn.call( self, e );
            e.stopPropagation();
        });
    }
    
};

E.ui.Lazyload = Lazyload;

});