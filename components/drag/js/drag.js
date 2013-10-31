/*
* Drag component v0.1.0 for easy.js
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
    axis       :   null,      // String        设置拖拽的方向，x是横向，y是纵向
    container  :   null,      // String|Element|easyJS Object 设置拖拽范围的元素
    handle     :   null,      // String|Element|easyJS Object 触发拖拽的元素
    moveHand   :   true,      // Boolean       是否设置触发拖拽的元素的鼠标手型为移动型
    proxy      :   false,     // Boolean       是否使用代理拖拽(代理拖拽的性能会更好)    
    refresh    :   true       // Boolean       是否在拖拽结束后更新拖拽元素的位置
};

var isIE = E.browser.ie && parseInt( E.browser.version ) < 9,   
    isIE6 = isIE && E.browser.version === '6.0',
    proxyElem,

    easyDrag = {
    
        /*    
         * 获取拖拽元素相对于包含元素的上下左右的边界值
         * 如果拖拽元素是fixed定位，则其包含元素自动设置成当前窗口
         * @param { easyJS Object } 包含元素
         * @param { easyJS Object } 拖拽元素
         * @return { Object } 包含了上下左右的边界值的对象
         */       
        getBoundary : function( container, target ){
            var isWindow = E.isWindow( container[0] ),
                borderTopWidth = 0,
                borderRightWidth = 0,
                borderBottomWidth = 0,
                borderLeftWidth = 0,
                cOffset = container.offset(),
                cOffsetTop = cOffset.top,
                cOffsetLeft = cOffset.left,                
                tOffset = target.offset();

            if( isWindow ){
                cOffsetTop = container.scrollTop();
                cOffsetLeft = container.scrollLeft();
            }
            else{
                borderTopWidth = parseFloat( container.css('borderTopWidth') );
                borderRightWidth = parseFloat( container.css('borderRightWidth') );
                borderBottomWidth = parseFloat( container.css('borderBottomWidth') );
                borderLeftWidth = parseFloat( container.css('borderLeftWidth') );
            }
            
            // 绝对距离+相对位置就是边界的位置
            cOffsetTop = cOffsetTop - tOffset.top + parseFloat( target.css('top') );
            cOffsetLeft = cOffsetLeft - tOffset.left + parseFloat( target.css('left') );
                
            return {    
                top : cOffsetTop + borderTopWidth,
                right : cOffsetLeft + container.outerWidth() - target.outerWidth() - borderRightWidth,
                left : cOffsetLeft + borderLeftWidth,            
                bottom : cOffsetTop + container.outerHeight() - target.outerHeight() - borderBottomWidth
            };
        },
        
        /*    
         * 将源元素的位置复制给目标元素，不管两个元素的定位方式是否相同
         * 该方法用于代理拖拽时，代理元素和拖拽元素之间的位置复制
         * @param { easyJS Object } 源元素
         * @param { easyJS Object } 目标元素
         */     
        copyPosition : function( source, target ){
            var sOffset = source.offset(),
                tOffset = target.offset(),
                top = target.css( 'top' ),
                left = target.css( 'left' );
            
            // 绝对距离+相对位置就是目标元素的位置    
            target.anim({                
                top : sOffset.top - tOffset.top + parseInt( top ) + 'px',
                left : sOffset.left - tOffset.left + parseInt( left ) + 'px'
            });               
        },
        
        // 创建代理元素
        createProxy : function( o ){
            var target = o.target,
                offset = target.offset(),
                zIndex = target.css( 'zIndex' );
            
            // 代理元素的zIndex值始终比拖拽元素的zIndex高
            if( !zIndex ){
                target.css( 'zIndex', '1' );
                zIndex = '2';
            }
            else{
                zIndex = parseInt( zIndex ) + 1;
            }
            
            if( !proxyElem ){
                proxyElem = E( '<div class="eui_drag_proxy" style="position:absolute;' +
                    'border:2px dashed #a0a1a2;"/>' );
            }

            proxyElem.css({
                top : offset.top + 'px',
                left : offset.left + 'px',
                cursor : o.moveHand ? 'move' : '',
                width : o.width - 4 + 'px',
                height : o.height - 4 + 'px',
                zIndex : zIndex
            });

            return proxyElem;                
        }
    
    };

var Drag = function( target, options ){
    target = E( target ).eq( 0 );
    options = options || {};
    
    if( !target.length ){
        return;
    }
    
    var o = E.merge( defaults, options ),

        posType = target.css( 'position' ),    
        isFixed = posType === 'fixed' || ( isIE6 && target[0].style.getExpression('top') !== undefined ),    
        doc = target[0].ownerDocument,
        win = doc.defaultView || doc.parentWindow,
        $win = E( win ),
        
        // 没有设置handle，则默认就是拖拽元素
        originHandle = o.handle ? E( o.handle ) : target,
        // 非IE6-8时，handle就是document
        handle = isIE ? originHandle : E( doc ),
        container = o.container ? E( o.container ) : null,       
        
        count = 0,
        drag = this,        
        axis = o.axis,        
        isMove = false,    
        proxy = o.proxy,        
        refresh = o.refresh,
        
        boundary, proxyElem, zIndex, originalX, originalY, originalPosition,
        
        // 清除文本选择
        clearSelect = 'getSelection' in win ? function(){
            win.getSelection().removeAllRanges();
        } : function(){
            try{
                doc.selection.empty();
            }
            catch( e ){};
        },
        
        down = function( e ){
            o.isDown = true;               
            var newTarget = target,
                left, top, offset;
                
            o.width = target.outerWidth();
            o.height = target.outerHeight();
            
            // 如果托拽元素在拖拽结束后并不移动位置，
            // 则在mousedown的时候设置其为相对定位，
            // 在拖拽结束后还原其定位方式
            if( !refresh ){
                posType = target.css( 'position' );
                
                if( posType === 'static' ){
                    newTarget.css( 'position', 'relative' );
                }
            }
            
            // 创建代理元素
            if( proxy ){
                proxyElem = easyDrag.createProxy( o );
                newTarget = proxyElem.appendTo( doc.body );
                
                if( isIE ){
                    handle = proxyElem;
                }                
            }
            
            o.handle = handle;
            left = newTarget.css( 'left' );
            top = newTarget.css( 'top' );         
            offset = newTarget.offset();
            
            if( !refresh ){
                originalPosition = {
                    left : left,
                    top : top                   
                };
            }
            
            drag.left = left = parseInt( left );
            drag.top = top = parseInt( top );
            drag.offsetLeft = offset.left;
            drag.offsetTop = offset.top;
            
            originalX = e.pageX - left;
            originalY = e.pageY - top; 
            
            // 获取边界值
            // 如果拖拽元素是fixed定位，则其包含元素自动设置成当前窗口
            if( (!boundary && container) || isFixed ){
                boundary = easyDrag.getBoundary( isFixed ? $win : container, newTarget );        
            }  
           
            if( axis ){
                // 横向拖拽
                if( axis === 'x' ){
                    originalY = false;
                }
                // 纵向拖拽
                else if( axis === 'y' ){
                    originalX = false;
                }
            }
            
            if( isIE ){
                handle[0].setCapture();
            }

            // 绑定mousemove和mouseup事件
            handle.on( 'mousemove.drag', move ).on( 'mouseup.drag', up );  
            
            if( isIE ){
                handle.on( 'losecapture.drag', up );
            }
            
            // IE6模拟fixed定位时在拖拽开始时先卸载模拟的CSS表达式
            if( isIE6 && isFixed && !proxy ){
                target[0].style.removeExpression( 'top' );
            }

            // 触发drag实例的dragstart事件
            originHandle.fire( 'likedragstart' );       
            
            if( E.ui.Drop ){
                E.ui.Drop.refresh();
            }  
            
            e.stopPropagation();
            e.preventDefault();            
        },        
        
        move = function( e ){
            if( !o.isDown ){
                return;
            }            
            // 设置回调函数计数器，减少一半的回调次数以提升性能
            count++;
            if( count % 2 === 0 ){
                return;
            }
            
            var currentX = e.pageX,
                currentY = e.pageY,
                style = proxy ? proxyElem[0].style : target[0].style,
                x, y, left, right, top, bottom;
            
            clearSelect();
            isMove = true;
            
            // 横向    
            if( originalX ){
                x = currentX - originalX;
                
                if( boundary ){
                    left = boundary.left;
                    right = boundary.right;
                    
                    x = x < left ? left : 
                        x > right ? right :
                        x;
                }    

                drag.left = x;
                drag.offsetLeft = currentX - e.offsetX;
                style.left = x + 'px';
            }
            
            // 纵向
            if( originalY ){
                y = currentY - originalY;
                
                if( boundary ){
                    top = boundary.top;
                    bottom = boundary.bottom;
                    
                    y = y < top ? top : 
                        y > bottom ? bottom :
                        y;
                }    
                
                drag.top = y;
                drag.offsetTop = currentY - e.offsetY;
                style.top = y + 'px';
            }

            // 触发drag实例的drag事件
            target.fire( 'likedrag', { pageX : currentX, pageY : currentY });     
            
            // 在标准浏览器中拖动过快就可能造成失焦，
            // 失焦后如果drop是边界接触模式就可能判断出错，
            // 所以在失焦后不做drop接触的判断
            // 同时要区分是否为代理元素
            if( E.ui.Drop && (e.target === originHandle[0] || e.target.className === 'eui_drag_proxy') ){
                E.ui.Drop.fire( o, e, true );
            }
            e.stopPropagation();      
        },
        
        // 鼠标弹起
        up = function( e ){
            o.isDown = false;
            if( isIE ){
                handle.un( 'losecapture.drag' );
            }
            
            // 卸载mousemove和mouseup事件
            handle.un( 'mousemove.drag mouseup.drag' );
            
            if( isIE ){
                handle[0].releaseCapture();
            }
            
            // 只有执行了mousemove事件时才认为执行了拖拽
            if( isMove ){
                // 代理模式时将代理元素的位置复制给拖拽元素
                if( proxy ){
                    if( refresh ){                       
                        easyDrag.copyPosition( proxyElem, target );                    
                    }
                    else{
                        target.css( 'position', posType === 'static' ? '' : posType );
                    }
                }
                else{
                    if( !refresh ){
                        target.css( originalPosition );
                    }
                }
                
                // IE6模拟fixed在拖拽结束再重新绑定模拟fixed
                if( isIE6 && isFixed && !proxy ){
                    target[0].style.setExpression( 'top', 'fuckIE6=document.documentElement.scrollTop+' + (drag.top - $win.scrollTop()) + '+"px"' );
                }
                
                isMove = false;
                
                if( E.ui.Drop ){
                    E.ui.Drop.fire( o, e, false );
                }
            }
            else{            
                if( !refresh && posType === 'static' ){
                    target.css( 'position', '' );
                }
            }
            
            if( proxy ){
                proxyElem.remove();
            }
            
            // 触发drag实例的dragend事件
            originHandle.fire( 'likedragend' );
            e.stopPropagation();                
        }; 
        
    // 如果拖拽元素没有设置定位，则默认设置相对定位    
    if( refresh && posType === 'static' ){
        target.css( 'position', 'relative' );
    }
        
    if( o.moveHand ){
        originHandle.css( 'cursor', 'move' );
    }
    
    // 绑定mousedown事件
    originHandle.on( 'mousedown.drag', down );    
    o.originHandle = originHandle;   
    o.target = target;
    drag.__o__ = o;
};

Drag.prototype = {
    
    // 卸载拖拽
    destroy : function(){
        if( !this.__o__ ){
            return;
        }
        
        var o = this.__o__;
        
        o.originHandle.css( 'cursor', '' ).un( 'mousedown.drag likedragstart likedragend' );
            
        // 有可能出现在拖拽过程中的卸载，此时强制触发mouseup事件    
        if( o.isDown ){    
            o.handle.fire( 'mouseup' );
        }
            
        o.target.un( 'likedrag' );        
        this.__o__ = o = null;
        delete this.__o__;
    },
    
    // 添加自定义事件 dragstart, drag, dragend
    on : function( type, fn ){
        if( !this.__o__ ){
            return this;
        }
        
        var self = this,
            o = this.__o__,
            isDragType = type === 'drag',
            drag = isDragType ? o.target : o.originHandle;
        
        drag.on( 'like' + type, function( e ){
            e.type = type;
            e.drag = o.target[0];
            
            if( e.extraData ){
                e.pageX = e.extraData.pageX;
                e.pageY = e.extraData.pageY;
                delete e.extraData;
            }
            
            fn.call( self, e );
            e.stopPropagation();
        });       
        
        return this;
    },
    
    // 卸载自定义事件 dragstart, drag, dragend
    un : function( type ){
        if( !this.__o__ ){
            return this;
        }
        
        var self = this,
            o = this.__o__,            
            drag = type === 'drag' ? o.target : o.originHandle;

        drag.un( 'like' + type );        
        return this;
    }
    
};

E.ui.Drag = Drag;

});