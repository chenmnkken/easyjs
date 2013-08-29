/*
* Switchable components v0.1.0 for easy.js
*
* Copyright (c) 2013 Yiguo Chan
* Released under the MIT Licenses
*
* Mail : chenmnkken@gmail.com
* Date : 2013-5-11 
*/
define(function(){

'use strict';

var defaults = {    
    auto        :    true,        // Boolean   是否自动切换
    interval    :    3000,        // Number    切换的间隔时间
    duration    :    600,         // Number    切换时的动画运行时间，该参数只对左右、上下切换有效
    index       :    true,        // Boolean   是否添加索引按钮
    nav         :    true,        // Boolean   是否添加翻页按钮
    effects     :    'fade',      // String    fade为淡入淡出的动画、slideX为左右滑动切换的动画、slideY为上下滑动切换的动画
    imglazyload :    false,       // Boolean   是否延迟加载图片，该效果需要配合相应的结构，初始化时加载前2屏的图片，切换到第2屏时开始加载第3屏的图片，依次类推  
    easing      :    'swing',     // String    缓动效果的名称
    init        :    null         // Function  初始化的回调
};

// 修复IE6下重复加载背景图片的BUG
if( E.browser.ie && E.browser.version === '6.0' ){
    document.execCommand( 'BackgroundImageCache', false, true );
}  

var easySwitchable = {

    switchHandle : function( o, target ){
        var effects = o.effects,
            isReverse = false,
            index = E.isNumber( target ) ? target : E( target ).attr( 'data-index' ),
            run = easySwitchable.patterns[ effects ];
            
        if( index === null ){
            isReverse = ~target.className.indexOf( 'prev' ) ? true : false;
        }
        
        if( effects !== 'fade' ){
            if( o.listElem.is(':animated') ){
                o.listElem.stop( true, true );
            }
        }
        else{
            o.itemElem.filter( ':animated' ).stop( true, true );
        }
        
        run( o, index, isReverse );
    },    
    
    // 遍历li标签加载图片
    loadImg : function( target ){
        E( 'img', target ).forEach(function(){
            var elem = E( this ),
                lazysrc = elem.attr( 'data-lazysrc' );
                
            if( lazysrc ){
                this.src = lazysrc;
                elem.removeAttr( 'data-lazysrc' );
            }
        });
    },
    
    // 初始化索引切换的按钮
    initIndex : function( o ){
        var i = 0,
            html = '',
            len = o.itemElem.length,
            isIndex = o.index,
            indexElem, hoverTimer;
            
        for( ; i < len; i++ ){
            html += '<a href="#"' +
                ( i === 0 ? ' class="current"' : '' ) + 
                ( isIndex ? '' : ' style="display:none"' ) + 
                ' data-index="' + i + '">' + ( i + 1 ) + '</a>';            
        }

        indexElem = E( '<div class="sc_index">' + html + '</div>' )
            .appendTo( o.target )
            .find( 'a' ); 
        
        // 绑定索引切换
        if( isIndex ){
            indexElem.on( 'mouseover.switchable', function(){
                    var self = this;
                    
                    hoverTimer = setTimeout(function(){
                        easySwitchable.switchHandle( o, self );
                    }, 200 );     
                })
                .on( 'mouseout.switchable', function(){
                    clearTimeout( hoverTimer );
                    hoverTimer = null;                
                })
                .on( 'click.switchable', function( e ){
                    e.preventDefault();
                });
        }

        return indexElem;
    },
    
    // 初始化翻页切换的按钮
    initNav : function( o ){
        var target = o.target,
            navElem;

        if( o.nav ){
            navElem = E( '<a href="#" class="sc_prev" style="display:none"></a>' +
                '<a href="#" class="sc_next" style="display:none"></a>' )                   
                    .appendTo( target );
            
            // 由组件生成的翻页切换按钮默认状态下是隐藏的
            target.on( 'mouseenter.switchable', function(){
                    navElem.show();
                })
                .on( 'mouseleave.switchable', function(){
                    navElem.hide();
                });  
        }
        else{
            // 自定义的翻页切换按钮绑定切换效果
            navElem = E( 'a.sc_prev,a.sc_next', target );
        }        
        
        navElem.on( 'click.switchable', function( e ){
            easySwitchable.switchHandle( o, this );
            e.preventDefault();
        });
        
        return navElem;
    },
    
    // 非fade动画时需要初始化布局
    initLayout : function( o ){
        var itemElem = o.itemElem,
            width = itemElem.outerWidth(),
            height = itemElem.outerHeight(),
            effects = o.effects,
            size, sizeType, floatType;
        
        // 左右切换时固定ul的宽度，让li浮动
        if( effects === 'slideX' ){
            size = width;
            sizeType = 'width';
            floatType = 'left';
        }
        // 上下切换时固定ul的高度，li不能浮动
        else if( effects === 'slideY' ){
            size = height;
            sizeType = 'height';
            floatType = 'none';            
        }        
        
        // 让ul基于container绝对定位
        o.containerElem.css({
            overflow : 'hidden',
            position : 'relative',
            width : width + 'px',
            height : height + 'px'
        });
        
        o.listElem.css( sizeType, ( size * itemElem.length ) + 'px' )
            .css({
                position : 'absolute',
                top : '0px',
                left : '0px'
            });        
            
        itemElem.css({
            'float' : floatType, 
            display : 'block'
        });

        return size;
    },
    
    clear : function( o ){
        clearInterval( o.timer );
        o.timer = null;        
    },
    
    autoRun : function( o ){
        o.timer = setInterval(function(){
            easySwitchable.patterns[ o.effects ]( o, null, false );
        }, o.interval );           
    },
    
    patterns : {
        /*
         * 默认的切换效果是淡入淡出的动画效果
         * @param { Object } 配置对象
         * @param { Number } 要切换的索引
         * @param { Boolean } 是否反向切换
         */
        fade : function( o, nextIndex, isReverse ){
            var itemElem = o.itemElem,
                indexElem = o.indexElem,
                currentIndex = parseInt( indexElem.filter('.current').attr('data-index') ),
                len = itemElem.length - 1,
                currentItem, nextItem;
                
            if( currentIndex === nextIndex ){
                return;
            }

            if( nextIndex === null ){
                nextIndex = !isReverse ? ( currentIndex === len ? 0 : currentIndex + 1 ) :
                    ( currentIndex === 0 ? len : currentIndex - 1 );            
            }
            
            currentItem = itemElem.eq( currentIndex );
            nextItem = itemElem.eq( nextIndex );  
            
            nextItem.css( 'display', 'block' )
                // 当前屏的图片如果是延迟加载的则立即触发loadImg的事件
                // 通常只有在手动切换索引的时候才会这样触发
                .fire( 'loadimg' )
                .next()
                // 切换当前屏的图片时才开始加载下一张图片
                .fire( 'loadimg' );
                
            currentItem.fadeOut( o.duration, o.easing, function(){
                currentItem.css( 'zIndex', '1' );
                nextItem.css( 'zIndex', '2' );
            });    
            
            // 索引的高亮效果切换
            indexElem.eq( currentIndex ).removeClass( 'current' );            
            indexElem.eq( nextIndex )
                .addClass( 'current' )
                .fire( 'likeinit' );

            // 触发change事件
            o.target.fire( 'likechange' );        
        }  
    }

};

// 左右切换和上下切换的方法拼装
E.each({
    slideX : [ 'left', 'width' ],
    slideY : [ 'top', 'height' ]
}, function( name, val ){
    var posName = val[0],
        sizeType = val[1];
        
    easySwitchable.patterns[ name ] = function( o, nextIndex, isReverse ){
        var itemElem = o.itemElem,
            listElem = o.listElem,
            indexElem = o.indexElem,
            len = itemElem.length - 1,
            currentIndex = parseInt( indexElem.filter('.current').attr('data-index') ),
            size = o.size,
            // ul的宽度/高度
            listSize = parseFloat( listElem.css(sizeType) ),
            // ul的初始top/left值
            posVal = parseFloat( listElem.css(posName) ),
            // 单次切换的li的个数，索引按钮切换时可能是多个，翻页按钮切换和默认切换都是1个
            multiple = 1,
            animMap = {},
            thresholdElem, thresholdVal, distance, complete;

        if( currentIndex === nextIndex ){
            return;
        }
        
        if( nextIndex !== null ){
            // 计算索引切换时需要切换的li的个数
            if( nextIndex > currentIndex ){
                // 正向切换
                isReverse = false;
                multiple = nextIndex - currentIndex;
            }
            else{
                // 反向切换
                isReverse = true;
                multiple = currentIndex - nextIndex;
            }                 
        }
        else{
            nextIndex = !isReverse ? ( currentIndex === len ? 0 : currentIndex + 1 ) :
                ( currentIndex === 0 ? len : currentIndex - 1 );            
        }
        
        // 单次动画切换的总距离
        distance = size * multiple;
        
        // 正向切换
        if( !isReverse ){
            // 动画的终点 = 初始值 - 总距离
            posVal -= distance;
            
            if( currentIndex === len ){
                // 临界元素为第一个li标签
                thresholdElem = itemElem.first();
                // 临界值为ul的宽度/高度
                thresholdVal = listSize + 'px';
                complete = function(){
                    // 此时ul的初始top/left值应为0px
                    listElem.css( posName, '0px' );                        
                    thresholdElem.css( 'position', '' ).css( posName, '' );
                };
            }
        }
        // 反向切换
        else{
            // 动画的终点 = 初始值 + 总距离
            posVal += distance;
            
            if( currentIndex === 0 ){
                // 临界元素为最后一个li元素
                thresholdElem = itemElem.last();
                // 临界值为ul的宽度/高度的负值
                thresholdVal = '-' + listSize + 'px';
                complete = function(){
                    // 此时ul的初始top/left值为：-(ul的宽度/高度 - li的宽度/高度)
                    listElem.css( posName, '-' + (listSize - size) + 'px' );                        
                    thresholdElem.css( 'position', '' ).css( posName, '' );
                };
            }
        }

        animMap[ posName ] = posVal + 'px';
        
        // 为了实现无缝切换，在达到临界点(最后一个li或第一个li)时，
        // 将设置临界元素到指定的位置，在ul的切换动画结束时执行回调
        // 该回调将恢复ul和li的初始top/left值
        if( thresholdElem ){
            thresholdElem.css( 'position', 'relative' ).css( posName, thresholdVal );      
        }
        
        // 开始切换动画
        listElem.anim({
            to : animMap, 
            duration : o.duration,
            easing : o.easing, 
            complete : complete
        });      
        
        itemElem.eq( nextIndex )
            // 当前屏的图片如果是延迟加载的则立即触发loadimg的事件
            // 通常只有在手动切换索引的时候才会这样触发
            .fire( 'loadimg' )
            .next()
            // 切换当前屏的图片时才开始加载下一张图片
            .fire( 'loadimg' );
        
        // 索引的高亮效果切换
        indexElem.eq( currentIndex ).removeClass( 'current' );            
        indexElem.eq( nextIndex )
            .addClass( 'current' )    
            .fire( 'likeinit' );

        // 触发change事件
        o.target.fire( 'likechange' );   
    };
});

var Switchable = function( target, options ){
    target = E( target ).eq( 0 );
    options = options || {};
    
    if( !target.length ){
        return;
    }

    var o = E.merge( defaults, options ),        
        containerElem = target.children( 'div.sc_container' ),
        listElem = containerElem.children( 'ul' ),
        itemElem = listElem.children( 'li' ),     
        effects = o.effects,
        ES = easySwitchable,           
        autoRun;
        
    if( itemElem.length < 2 ){
        return;
    }

    o.containerElem = containerElem;
    o.target = target;
    o.listElem = listElem;
    o.itemElem = itemElem;
    
    if( effects !== 'fade' ){
        o.size = ES.initLayout( o );
    }
    else{
        // fade效果先设置所有面板的定位为重叠的
        o.itemElem.css({
                position : 'absolute',
                display : 'none',
                zIndex : '1',
                top : '0px',
                left : '0px'
            })
            // 设置第一张为显示状态并设置最高层级
            .eq( 0 )
            .css({
                display : 'block',
                zIndex : '2'
            });
    }
    
    o.indexElem = ES.initIndex( o );
    o.navElem = ES.initNav( o );
    
    // 如果有延迟加载的设置则给li绑定延迟加载的自定义事件
    if( o.imglazyload ){
        itemElem.slice( 2 ).one( 'loadimg', function(){
            ES.loadImg( this ); 
        });
    }
    
    // 触发初始化的回调函数
    if( o.init ){
        o.init.call( target[0] );
        delete o.init;
    }
    
    if( o.auto ){
        target.on( 'mouseenter.switchable', function(){
                easySwitchable.clear( o ); 
            })
            .on( 'mouseleave.switchableauto', function(){
                easySwitchable.autoRun( o ); 
            });   

        easySwitchable.autoRun( o );    
    } 
    
    this.__o__ = o;
};

Switchable.prototype = {
    
    destroy : function(){
        if( !this.__o__ ){
            return;
        }
        
        var o = this.__o__,
            target = o.target;
        
        if( o.auto ){
            easySwitchable.clear( o );
        }
        
        target.un( 'mouseenter.switchable mouseleave.switchable mouseleave.switchableauto likechange' );
        
        if( o.nav ){
            o.navElem.remove();
        }
        
        if( o.index ){
            o.indexElem.remove();
        }
        
        if( o.imglazyload ){
            o.itemElem.slice( 2 ).un( 'loadimg' );
        }
        
        this.__o__ = o = null;
        delete this.__o__;
    },

    on : function( type, fn ){
        if( !this.__o__ ){
            return this;
        }
        
        var self = this,
            o = self.__o__,
            isInit = type === 'init',
            indexElem = o.indexElem,
            elem = isInit ? indexElem.not( '.current' ) : o.target,
            bind = isInit ? 'one' : 'on';        
        
        elem[ bind ]( 'like' + type, function( e ){
            e.index = indexElem.filter( '.current' ).attr( 'data-index' );
            e.target = o.itemElem[ e.index ];
            e.type = type;
            fn.call( self, e );
            e.stopPropagation();
        });
        
        return this;
    },
    
    un : function( type ){
        if( this.__o__ ){
            this.__o__.target.un( 'like' + type );
        }
        
        return this;
    },
    
    change : function( index ){
        if( this.__o__ ){
            easySwitchable.switchHandle( this.__o__, +index );
        }
    },
    
    pause : function(){
        var o = this.__o__;
        
        if( o ){
            easySwitchable.clear( o );
            
            if( o.auto ){
                o.target.un( 'mouseleave.switchableauto' );
            }
        }
    },
    
    play : function(){
        var o = this.__o__;
        
        if( o ){
            easySwitchable.autoRun( o );
            
            if( o.auto ){
                o.target.on( 'mouseleave.switchableauto', function(){
                    easySwitchable.autoRun( o ); 
                });   
            }            
        }
    }
    
};

E.ui.Switchable = Switchable;

});