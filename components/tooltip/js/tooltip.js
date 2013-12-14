/*
* Tooltip component v0.1.2 for easy.js
*
* Copyright (c) 2013 Yiguo Chan
* Released under the MIT Licenses
*
* Mail : chenmnkken@gmail.com
* Date : 2013-12-14
*/
define(function(){

'use strict';

var defaults = {
    content     :   null,         // String   工具提示的内容
    duration    :   200,          // Number   动画运行时间
    easing      :   'swing',      // String   缓动函数的名称    
    effects     :   null,         // String   动画效果的名称
    maxWidth    :   200,          // Number   工具提示的最大显示宽度
    position    :   'top',        // String   工具提示显示的方位
    trigger     :   'mouseenter', // String   触发工具提示的事件类型
    zIndex      :   9900,         // Number   工具提示的层级    
    unClose     :   false,        // Boolean  由mouseenter、focus触发的工具提示是否自动关闭
    space       :   12            // Number   工具提示离触发元素的间距
};

var isIE6 = E.browser.ie && E.browser.version === '6.0',
    $win = E( window ),
    isVisible = false,
    tipCache = {},
    zIndex;

var easyTooltip = {
    
    init : function( o ){
        var trigger = o.trigger,
            unClose = o.unClose,
            target = o.target,   
            isHover = trigger === 'mouseenter',
            timer;
            
        if( isHover ){
            target.on( 'mouseenter.tooltip', function(){
                var self = this;                    
                clearTimeout( timer );     
                
                timer = setTimeout(function(){
                    easyTooltip.open( o, self );
                }, 50 );
            });          

            if( !unClose ){
                target.on( 'mouseleave.tooltip', function(){
                    clearTimeout( timer );
                    timer = null;
                    easyTooltip.close( o );
                });
            }
        }
        else{
            target.on( trigger + '.tooltip', function(){
                easyTooltip.open( o, this );
            });        

            if( trigger === 'focus' && !unClose ){
                target.on( 'blur.tooltip', function(){
                    easyTooltip.close( o );
                });            
            }
        }
    },
    
    open : function( o, target ){
        var elem = E( target ),
            trigger = o.trigger,
            euid = target[ E.euid ],                
            tipElem, btnClose, content;
            
        if( tipCache[euid] !== undefined ){
            if( trigger === 'click' ){
                easyTooltip.close( o );
            }
        
            return;            
        }
        
        tipCache[ euid ] = true;
        content = o.content || elem.attr( 'data-title' );
            
        if( content === null ){
            content = elem.attr( 'title' );
            
            if( content === null ){
                return;
            }
            
            elem.removeAttr( 'title' ).attr( 'data-title', content );
        }

        o.width = elem.outerWidth();
        o.height = elem.outerHeight(); 

        tipElem = easyTooltip.createTip( isVisible );
        tipElem.appendTo( o.context.body );
        tipElem.data( 'targetIndex', euid );
        tipElem.find( 's.tt_arrow' )[0].className = 'tt_arrow tt_arrow_' + o.position;
        tipElem.find( 'div.tt_content' ).html( content );
        o.btnClose = tipElem.find( 'a.tt_btn_close' );
        o.tipElem = tipElem;
        o.currentTarget = elem;

        isVisible = true;
        easyTooltip.initStyle( o, target );
        elem.fire( 'likeopen' );
        easyTooltip.patterns[ o.effects ].show( o );

        if( (trigger !== 'mouseenter' && trigger !== 'focus') || o.unClose ){
            $win.on( 'resize.tooltip', function(){
                easyTooltip.setPosition( o, true );
            });
        }
    },
    
    createTip : (function(){
        var tipElem;
        
        return function( reCreate ){        
            if( tipElem && tipElem.is(':animated') ){
                tipElem.stop( true, true );
                reCreate = false;
            }
            
            tipElem = tipElem && !reCreate ? tipElem :
                E( '<div class="eui_tooltip" style="z-index:' + ( zIndex++ ) + '">' +
                    '<div class="tt_wrapper">' + 
                        '<s class="tt_arrow"></s>' + 
                        '<a href="#" class="tt_btn_close">&times;</a>' + 
                        '<div class="tt_content"></div>' +
                    '</div>' +
                '</div>' );
              
            return tipElem;
        };
    })(),
    
    setPosition : function( o, isResize ){
        var cssMap = {},
            space = o.space,
            tipElem = o.tipElem,
            wrapElem = o.wrapElem,
            position = o.position,
            targetWidth = o.width,
            targetHeight = o.height,
            offset = o.currentTarget.offset(),
            offsetTop = offset.top,            
            offsetLeft = offset.left,            
            isTop = position === 'top',
            isLeft = position === 'left',  
            wrapWidth = wrapElem.outerWidth(),
            wrapHeight = wrapElem.outerHeight();

        if( isTop || position === 'bottom' ){
            cssMap.left = offsetLeft - wrapWidth / 2 + targetWidth / 2 + 'px';
            
            if( isTop ){
                cssMap.top = offsetTop - wrapHeight - space + 'px';
            }
            else{
                cssMap.top = offsetTop + targetHeight + space + 'px';
            }
        }
        else if( isLeft || position === 'right' ){
            cssMap.top = offsetTop - wrapHeight / 2 + targetHeight / 2 + 'px';
            
            if( isLeft ){
                cssMap.left = offsetLeft - wrapWidth - space + 'px';
            }
            else{
                cssMap.left = offsetLeft + targetWidth + space + 'px';  
            }
        }
        
        if( !isResize ){
            cssMap.visibility = '';
            cssMap.display = 'none';   
        }

        tipElem.css( cssMap );                
    },
    
    initStyle : function( o ){
        var tipElem = o.tipElem,
            trigger = o.trigger,
            btnClose = o.btnClose,
            wrapElem = tipElem.find( 'div.tt_wrapper' ),
            wrapWidth;
            
        if( (trigger !== 'mouseenter' && trigger !== 'focus') || o.unClose ){
            wrapElem.css( 'paddingRight', '25px' );
            btnClose.css( 'display', 'block' )
                .on( 'click.tooltip', function( e ){
                    easyTooltip.close( o );
                    e.preventDefault();
                });
        }
        else{
            wrapElem.css( 'paddingRight', '10px' );
            btnClose.css( 'display', 'none' ).un( 'click.tooltip' );
        }
                
        // 设置tip有布局但不显示
        tipElem.css({
            visibility : 'hidden',
            display : 'block'
        });

        // 设置其为inline-block布局，这样可以取得其合适的宽度
        wrapElem.css({
            width : '', 
            display : 'inline-block'
        });
        
        // 修复ie6 inline-block 的bug
        if( isIE6 ){
            wrapElem[0].style.display = 'inline';
            wrapElem[0].style.zoom = 1;
        }

        wrapWidth = wrapElem.width();        
        wrapWidth = Math.min( o.maxWidth, wrapWidth );  

        // 设置合适的宽度
        wrapElem.css( 'width', wrapWidth + 'px' );   
        
        o.wrapElem = wrapElem;
        easyTooltip.setPosition( o );  
    },
    
    close : function( o ){
        var trigger = o.trigger,
            tipElem = o.tipElem,
            euid;
            
        if( !tipElem ){
            return; 
        }
        
        if( tipElem.is(':animated') ){
            tipElem.stop( true, true );
        } 
        
        isVisible = false;
        euid = tipElem.data( 'targetIndex' );
        delete tipCache[ euid ];
        
        if( o.currentTarget ){
            o.currentTarget.fire( 'likeclose' );
            delete o.currentTarget;
        }
        
        easyTooltip.patterns[ o.effects ].hide( o );        
        
        if( (trigger !== 'mouseenter' && trigger !== 'focus') || o.unClose ){
            $win.un( 'resize.tooltip' );
        }
    }
    
};

easyTooltip.patterns = {
    
    normal : {
        show : function( o ){
            o.tipElem.css( 'display', 'block' );
        },
        
        hide : function( o ){
            o.tipElem.css( 'display', 'none' ).remove();
            delete o.tipElem;
            isVisible = false;
        }
    },
    
    fade : {
        show : function( o ){
            o.tipElem.fadeIn( o.duration, o.easing );
        },
        
        hide : function( o ){
            o.tipElem.fadeOut( o.duration, o.easing, function(){
                o.tipElem.remove();
                delete o.tipElem;
                isVisible = false;
            });            
        }
    },

    slide : {}
    
};

[ 'show', 'hide' ].forEach(function( item ){

    easyTooltip.patterns.slide[ item ] = function( o ){
        if( !o.tipElem ){
            return;
        }    
    
        var tipElem = o.tipElem,
            top = tipElem.css( 'top' ),
            left = tipElem.css( 'left' ),            
            isHide = item === 'hide',
            FROM = 'from',
            TO = 'to',
            animMap = {};
            
        if( isHide ){
            FROM = 'to';
            TO = 'form';
            animMap.complete = function(){
                tipElem.css({
                        display : 'none',
                        opacity : ''
                    })                    
                    .remove();
                    
                delete o.tipElem;
                isVisible = false;
            };
        }
        
        animMap[ FROM ] = {
            opacity : '0'
        };
        
        animMap[ TO ] = { 
            opacity : '1'
        };
        
        switch( o.position ){            
            case 'top' : 
                animMap[ FROM ].top = parseInt(top) - 30 + 'px';
                animMap[ TO ].top = top;
            break;
            
            case 'bottom' : 
                animMap[ FROM ].top = parseInt(top) + 30 + 'px';
                animMap[ TO ].top = top;
            break;     

            case 'left' : 
                animMap[ FROM ].left = parseInt(left) - 30 + 'px';
                animMap[ TO ].left = left;
            break;     

            case 'right' : 
                animMap[ FROM ].left = parseInt(left) + 30 + 'px';
                animMap[ TO ].left = left;
            break;                    
        }
        
        animMap.easing = o.easing;
        animMap.duration = o.duration;       
        tipElem.css( 'display', 'block' ).anim( animMap );        
    };

});

var Tooltip = function( target, options ){
    target = E( target );
    options = options || {};
    
    if( !target.length ){
        return;
    }    
    
    var o = E.merge( defaults, options );
    o.effects = o.effects || 'normal';    
    
    if( isIE6 ){
        o.space -= 6;
    }
    
    zIndex = o.zIndex;
    o.target = target;   
    o.context = target[0].ownerDocument;
    easyTooltip.init( o );
    
    this.__o__ = o;
};

Tooltip.prototype = {

    destroy : function(){
        if( !this.__o__ ){
            return;
        }
        
        var o = this.__o__,
            trigger = o.trigger,
            target = o.target,
            title;
                
        trigger = trigger === 'mouseenter' ?
            'mouseenter.tooltip mouseleave.tooltip' :
            trigger === 'focus' ?
            'focus.tooltip blur.tooltip' :
            trigger + '.tooltip';
            
        trigger += ' likeopen likeclose';        

        target.un( trigger )
            .forEach(function(){
                // 还原其title值
                var elem = E( this ),
                    title  = elem.attr( 'data-title' );
                    
                elem.attr( 'title', title )
                    .removeAttr( 'data-title' );            
            });
        
        this.__o__ = target = o = null;
        delete this.__o__;
    },
    
    on : function( type, fn ){
        if( this.__o__ ){
            var self = this;
            self.__o__.target.on( 'like' + type, function( e ){
                e.type = type;
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

E.ui.Tooltip = Tooltip;

});