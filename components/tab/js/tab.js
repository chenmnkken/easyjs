/*
* Tab components v0.1.0 for easy.js
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
    auto        :   false,       // Boolean  是否自动切换
    duration    :   200,         // Number   动画效果运行的时间
    easing      :   'swing',     // String   缓动效果的名称
    effects     :   null,        // String   切换的动画效果    
    interval    :   3000,        // Number   自动切换的间隔时间    
    init        :   null,        // Function 初始化函数
    trigger     :   'click'      // String   触发tab切换的事件类型
};

var easyTab = {

    initLayout : function( o ){
        var contentElem = o.contentElem,
            boxElem = o.boxElem,
            width = boxElem.outerWidth(),
            height = boxElem.outerHeight(),
            index = parseInt( o.menuElem.filter('data-index') ),
            size, sizeType, posType, floatType;
            
        // 左右切换时固定wrap的宽度，让div浮动
        if( o.effects === 'slideX' ){
            size = width;
            sizeType = 'width';
            posType = 'left';
            floatType = 'left';
        }
        // 上下切换时固定div的高度，div不能浮动
        else{
            size = height;
            sizeType = 'height';
            posType = 'top';
            floatType = 'none';            
        }

        o.wrapElem.css({
            overflow : 'hidden',
            position : 'relative',
            width : width + 'px',
            height : height + 'px'
        });
            
        contentElem.css( sizeType, size * boxElem.length + 'px' )
            .css( 'position', 'absolute' );
            
        // 初始化时tab不一定是从第一个开始    
        if( index ){
            contentElem.css( posType, '-' + (size * index) + 'px' );
        }
        
        boxElem.css({
            'float' : floatType,
            display : 'block'
        });        
        
        return size;
    },
    
    initMenu : function( o ){
        var run = easyTab.patterns[ o.effects ],
            contentElem = o.contentElem,            
            menuElem = o.menuElem,
            trigger = o.trigger,
            hoverTimer;
        
        // 添加自定义的索引标记，增加元素的索引查找速度
        menuElem.forEach(function( i ){
            var elem = E( this );
            elem.attr( 'data-index', i );
        });

        // click事件触发tab切换
        if( trigger === 'click' ){        
            menuElem.on( 'click.tab', function( e ){
                if( contentElem.is(':animated') ){
                    contentElem.stop( true, true );
                }
            
                run( o, this );
            });  
        }    
        // hover事件触发tab切换
        else if( trigger === 'mouseenter' ){
            menuElem.on( 'mouseenter.tab', function(){                    
                    var self = this;
                    // 添加一定的延迟
                    hoverTimer = setTimeout(function(){
                        if( contentElem.is(':animated') ){
                            contentElem.stop( true, true );
                        }
                        
                        run( o, self );
                    }, 50 );
                })
                .on( 'mouseleave.tab', function(){
                    clearTimeout( hoverTimer );
                    hoverTimer = null;
                });
        }    
    },
    
    clear : function( o ){
        clearInterval( o.timer );
        o.timer = null;        
    },
    
    autoRun : function( o ){
        o.timer = setInterval(function(){
            easyTab.patterns[ o.effects ]( o );
        }, o.interval );           
    }    
    
};

easyTab.patterns = {
    
    // 默认切换无动画效果
    normal : function( o, nextMenu ){
        var menuElem = o.menuElem,
            boxElem = o.boxElem,
            len = menuElem.length,
            currentMenu = menuElem.filter( '.current' ),
            currentIndex = parseInt( currentMenu.attr('data-index') ),    
            nextIndex;

        len--;
        
        if( nextMenu ){
            nextMenu = E( nextMenu );
            nextIndex = parseInt( nextMenu.attr('data-index') );
        }
        else{
            nextIndex = currentIndex === len ? 0 : currentIndex + 1;
            nextMenu = menuElem.eq( nextIndex );
        }   
        
        currentMenu.removeClass( 'current' );
        nextMenu.addClass( 'current' ).fire( 'likeinit' );
        boxElem.eq( currentIndex ).hide();
        boxElem.eq( nextIndex ).show();            
        o.target.fire( 'likechange' );
    }

};

E.each({
    slideX : [ 'left', 'width' ],     // 横向动画
    slideY : [ 'top', 'height' ]      // 纵向动画
}, function( name, val ){
    var posName = val[0],
        sizeType = val[1];
        
    easyTab.patterns[ name ] = function( o, nextMenu ){
        var boxElem = o.boxElem,
            menuElem = o.menuElem,
            contentElem = o.contentElem,
            size = o.size,
            len = menuElem.length,
            currentMenu = menuElem.filter( '.current' ),
            currentIndex = parseInt( currentMenu.attr('data-index') ),
            contentSize = parseInt( contentElem.css(sizeType) ),
            posVal = parseInt( contentElem.css(posName) ),
            multiple = 1,
            animMap = {},            
            isReverse = false,
            thresholdElem, thresholdVal, distance, nextIndex, complete;
            
        len--;

        if( nextMenu !== undefined ){
            nextMenu = E( nextMenu );
            nextIndex = parseInt( nextMenu.attr('data-index') );
            
            if( nextIndex === currentIndex ){
                return;
            }
            
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
                ( currentIndex - 1 ); 
                
            nextMenu = menuElem.eq( nextIndex );
        }
        
        distance = size * multiple;
        
        // 正向切换
        if( !isReverse ){
            // 动画的终点 = 初始值 - 总距离
            posVal -= distance;            
        
            if( currentIndex === len ){
                // 临界元素为第一个li标签
                thresholdElem = boxElem.first();
                // 临界值为content的宽度/高度
                thresholdVal = contentSize + 'px';
                complete = function(){
                    // 此时content的初始top/left值应为0px
                    contentElem.css( posName, '0px' );                        
                    thresholdElem.css( 'position', '' ).css( posName, '' );
                };
            } 
        }
        // 反向切换
        else{
            // 动画的终点 = 初始值 + 总距离
            posVal += distance;
        }

        animMap[ posName ] = posVal + 'px';       
        
        currentMenu.removeClass( 'current' );
        nextMenu.addClass( 'current' ).fire( 'likeinit' );
        
        // 为了实现无缝切换，在达到临界点(最后一个li或第一个li)时，
        // 将设置临界元素到指定的位置，在ul的切换动画结束时执行回调
        // 该回调将恢复ul和li的初始top/left值
        if( thresholdElem ){
            thresholdElem.css( 'position', 'relative' ).css( posName, thresholdVal );      
        }
        
        contentElem.anim({
            to : animMap,
            duration : o.duration,
            easing : o.easing,
            complete : complete
        });

        o.target.fire( 'likechange' );
    };
});
    
var Tab = function( target, options ){
    target = E( target ).eq( 0 );
    options = options || {};
    
    if( !target.length ){
        return;
    }

    var o = E.merge( defaults, options ),
        effects = o.effects || 'normal',
        ET = easyTab,
        autoRun;
        
    o.effects = effects;        
    o.target = target;       
    o.menuElem = target.children( 'ul.tab_menu' ).children( 'li' );    
    o.wrapElem = target.children( 'div.tab_wrapper' );    
    o.contentElem = o.wrapElem.children( 'div.tab_content' );  
    o.boxElem = o.contentElem.children( 'div' );   
    
    ET.initMenu( o );
    
    // 动画效果的切换需要对tab的布局进行初始化
    if( effects && effects !== 'normal' ){  
        o.size = ET.initLayout( o );
    }
    
    // 触发初始化回调
    if( o.init ){
        o.init.call( target[0] );
        delete o.init;
    }    
    
    if( o.auto ){
        target.on( 'mouseenter.tab', function(){
                easyTab.clear( o ); 
            })
            .on( 'mouseleave.tab', function(){
                easyTab.autoRun( o ); 
            });   

        easyTab.autoRun( o );    
    }     

    this.__o__ = o;
};

Tab.prototype = {
    
    destroy : function(){
        if( !this.__o__ ){
            return;
        }
        
        var o = this.__o__;
        
        if( o.auto ){
            easyTab.clear( o ); 
            o.target.un( 'mouseenter.tab mouseleave.tab' );
        }
        
        o.target.un( 'likechange' );
        o.menuElem.un( 'click.tab mouseenter.tab mouseleave.tab' );                
        
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
            menuElem = o.menuElem,
            elem = isInit ? menuElem.not( '.current' ) : o.target,
            bind = isInit ? 'one' : 'on';        
        
        elem[ bind ]( 'like' + type, function( e ){
            var menu = menuElem.filter( '.current' );
            e.index = menu.attr( 'data-index' );
            e.target = o.boxElem[ e.index ];
            e.menu = menu[0];
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
    
    pause : function(){
        var o = this.__o__;
        
        if( o ){
            easyTab.clear( o );
            
            if( o.auto ){
                o.target.un( 'mouseleave.tab' );
            }
        }
    },
    
    play : function(){
        var o = this.__o__;
        
        if( o ){
            easyTab.autoRun( o );
            
            if( o.auto ){
                o.target.on( 'mouseleave.tab', function(){
                    easyTab.autoRun( o ); 
                });   
            }            
        }
    }
};

E.ui.Tab = Tab;

});