// ---------------------------------------------
// ---------------@module event-----------------
// ---------------------------------------------
 
define([ 'data', 'css' ], function( easyData ){

'use strict';

var eventProps = 'attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which fireData'.split( ' ' ),
    mouseProps = 'button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement'.split( ' ' ),
    keybordProps = 'char charCode key keyCode'.split( ' ' ),
    
    rFormElems = /^(?:textarea|input|select)$/i,
    rInputCheck = /^(?:radio|checkbox|)$/,
    rMouseEvent = /^(?:mouse|contextmenu)|click/,
    rKeybordEvent = /^(?:key(?:down|press|up))$/,
    rMousewheel = /^(?:DOMMouseScroll|mousewheel)$/,
    
    fixEventType = {},
    eventHooks = {},
    
    isECMAEvent = !!document.addEventListener,    

    ADDEVENT = isECMAEvent ? 'addEventListener' : 'attachEvent',
    REMOVEEVENT = isECMAEvent ? 'removeEventListener' : 'detachEvent';
    
// 唯独firefox不支持mousewheel鼠标滚轮事件，其它浏览器都支持    
if( E.browser.firefox ){
    fixEventType.mousewheel = 'DOMMouseScroll';
}

// 使用mouseover、mouseout判断event.relatedTarget的方法来模拟mouseenter、mouseleave
// chrome和firefox3.5不支持该事件
// mouseenter, mouseleave的事件代理也用相同的方法实现
E.each({    
    mouseenter : 'mouseover',
    mouseleave : 'mouseout'        
}, function( name, type ){        
    eventHooks[ name ] = {
    
        setup : function( options ){
            if( options.selector || !E.support.mouseEnter ){
                var originalHandle = options.handle,
                    handle = function( e ){
                        var relatedTarget = e.relatedTarget;
                        // 通过判断relatedTarget不为绑定事件元素的子元素来实现模拟
                        if( this !== relatedTarget && !E.contains(this, relatedTarget) ){
                            // 修正模拟事件的一些Event属性
                            e.type = name;
                            // 执行真正的事件处理器
                            originalHandle.call( this, e );
                        }  
                    },
                    
                    specialName;
                    
                options.type = type;    
                options.handle = handle;         
                options.dataName = ( options.selector ? options.selector + '_' : '' ) + type;       
                specialName = 'special_' + options.dataName;

                options.elems.forEach(function(){
                    var special = easyEvent.data( this, specialName, [] );
                    // 将2个事件处理器存到缓存中，以便卸载
                    special.push({
                        originalHandle : originalHandle,
                        handle : handle
                    });
                });
            }
            
            easyEvent.addEvent( options );
        },

        teardown : function( options ){
            if( options.selector || !E.support.mouseEnter ){
                options.type = type;    
                options.dataName = ( options.selector ? options.selector + '_' : '' ) + type;       
            }

            easyEvent.removeEvent( options );
        }
    };        
    
    if( !E.support.mouseEnter ){
        eventHooks[ name ].trigger = function( elem, namespace, fireData ){
            type += ( namespace ? '.' + namespace : '' );
            elem.fire( type, fireData );        
        };
    }
});

// 使用focus、blur事件的捕获功能来模拟focusin、focusout
// firefox不支持该事件
if( !E.support.focusin ){
    E.each({    
        focusin : 'focus',
        focusout : 'blur'        
    }, function( name, type ){        
        eventHooks[ name ] = {
            
            setup : function( options ){
                options.capture = true;
                options.dataName = options.type = type;
                easyEvent.addEvent( options );
            },
            
            teardown : function( options ){
                options.capture = true;
                options.dataName = options.type = type;
                easyEvent.removeEvent( options );
            },
            
            trigger : function( elem, namespace, fireData ){
                type += ( namespace ? '.' + namespace : '' );
                elem.fire( type, fireData );
            }            
        };    
    });
}

// IE6-8不支持radio、checkbox的change事件，要实现代理也得模拟
if( !isECMAEvent ){
    eventHooks.change = {
        
        setup : function( options ){
            var extraData = options.extraData,
                selector = options.selector,
                namespace = options.namespace,
                cType = 'change',
                bType = 'beforeactivate',
                eventData = {
                    handle : options.handle 
                };                      
                
            if( namespace ){
                cType += ( '.' + namespace );
                bType += ( '.' + namespace );
                eventData.namespace = namespace;
            }

            if( extraData ){
                eventData.extraData = extraData;
            }
        
            options.elems.forEach(function(){
                var self = E( this );
                
                if( rFormElems.test(this.tagName) ){
                    // radio、checkbox的change事件模拟
                    if( rInputCheck.test(this.type) ){
                        var name = 'special_change',
                            handles = easyEvent.data( this, name, [] );
                            
                        handles.push( eventData );                        
                        // 利用propertychange和click事件来模拟change事件
                        // 因为无法重复触发该事件，所以只能绑定一次该事件
                        // 一个或多个事件处理器添加到数组中，依次执行
                        if( handles.length === 1 ){                            
                            self.on( 'propertychange', function( e ){
                                    // 触发propertychange的时候给元素一个已触发的属性来标记
                                    if( e.originalEvent.propertyName === 'checked' ){
                                        this.__changed__ = true;
                                    }                                
                                })
                                .on( 'click', function( e ){
                                    // 根据触发propertychange的标记来判定是否执行事件
                                    if( this.__changed__ ){              
                                        e.type = 'change';
                                        this.__changed__ = false;
                                        
                                        for( var i = 0, j, result, len = handles.length; i < len; i++ ){
                                            j = handles[i] ? i : i - 1;
                                            result = handles[j];
                                            
                                            // 将缓存的附加数据添加到event对象中
                                            if( result.extraData ){
                                                e.extraData = result.extraData;
                                            }
                                            // 附加数据不能共享以确保不冲突
                                            else{
                                                delete e.extraData;
                                            }   

                                            result.handle.call( this, e );
                                        }
                                    }
                                });
                        }
                    }
                    // 其他类型的表单元素无需模拟即可触发
                    else{
                        options.elems = self;
                        easyEvent.addEvent( options );
                    }                    
                }
                // 非表单元素也可以绑定change事件，其表单子元素可以触发该事件，类似于原生的事件代理
                else{
                    var subscriberName = 'subscriber_change',
                        specialName = 'special_beforeactivate',
                        subscriber = easyEvent.data( this, subscriberName, [] ),
                        special = easyEvent.data( this, specialName, [] ),
                        originalHandle = options.handle,
                        handle = function( e ){
                            var target = e.target,
                                i = 0,
                                handles, name;
                                
                            if( rFormElems.test(target.tagName) ){
                                name = rInputCheck.test(target.type) ? 'special_change' : 'change';
                                handles = easyEvent.data( target, name );
                                // 确保该子元素只绑定一次change事件
                                if( !handles ){                                
                                    E( target ).on( cType, extraData, originalHandle );                                    
                                    // 只要绑定过事件都将该子元素添加到缓存中
                                    subscriber[ subscriber.length++ ] = target;                                
                                    // 缓存正确的currentTarget元素
                                    easyEvent.data( target, 'currentTarget', e.currentTarget );
                                }
                                // 不同的事件处理器将添加到数组中
                                else{
                                    for( ; i < handles.length; i++ ){
                                        if( handles[i].handle === originalHandle ){
                                            return;
                                        }
                                    }
                                    
                                    handles.push( eventData );    
                                }                            
                            }
                        };
                
                    // 将2个事件处理器存到缓存中，以便卸载
                    special.push({
                        originalHandle : originalHandle,
                        handle : handle
                    });

                    self.on( bType, selector, handle );
                }
            });    
        },

        teardown : function( options ){
            var handle = options.handle,
                selector = options.selector,
                namespace = options.namespace,
                cType = 'change',
                bType = 'beforeactivate';
                
            if( namespace ){
                cType += ( '.' + namespace );
                bType += ( '.' + namespace );
            } 
                
            options.elems.forEach(function(){
                var self = E( this ),
                    handles, subscriber, name, dataName, result, i, len;
                
                if( rFormElems.test(this.tagName) ){                        
                    if( rInputCheck.test(this.type) ){
                        name = 'special_change';                        
                        handles = easyEvent.data( this, name );
                        
                        if( handles ){
                        
                            if( handle || namespace ){
                                for( i = 0, len = handles.length; i < len; i++ ){
                                    result = handles[i];
                                    
                                    if( (!namespace || result.namespace === namespace) && 
                                        (!handle || result.handle === handle) ){
                                        
                                        handles.splice( i, 1 );
                                        break;
                                    }
                                }
                            }
                            
                            if( !handle && !namespace || !handles.length ){
                                self.un( 'propertychange click' );
                                easyEvent.removeData( this, name );
                                easyEvent.removeData( this, 'currentTarget' );
                                
                                // 移除用于判定是否触发过propertychange事件的属性
                                try{
                                    delete this.__changed__;
                                }
                                catch( _ ){
                                    this.removeAttribute( '__changed__' );
                                }
                            }
                        }
                    }
                    else{
                        options.elems = self;
                        easyEvent.removeEvent( options );
                        
                        if( !easyEvent.data(this, 'change') ){
                            easyEvent.removeData( this, 'currentTarget' );
                        }
                    }
                }
                else{
                    name = 'subscriber_change';
                    dataName = 'beforeactivate';
                    
                    // 从缓存中取出绑定过change事件的子元素
                    subscriber = easyEvent.data( this, name );
                    self.un( bType, selector, handle );
                    
                    if( subscriber ){
                        // 卸载子元素的change事件
                        for( i = 0, len = subscriber.length; i < len; i++ ){
                            E( subscriber[i] ).un( cType, handle );                                                    
                        }
                        
                        if( E.isString(selector) ){
                            dataName = selector + '_' + dataName;
                        }
                        
                        // 删除相关的缓存
                        if( !easyEvent.data(this, dataName) ){
                            easyEvent.removeData( this, name );
                        }
                    }
                }
            });
        }        
    };
}

// 对resize事件做函数节流的处理，确保每次resize的触发都只会触发一次
eventHooks.resize = {    

    setup : function( options ){                
        var specialName = 'special_resize',
            originalHandle = options.handle,
            handle = (function(){
                var timer;
                
                return function(){
                    var self = this,
                        args = arguments;
                        
                    clearTimeout( timer );
                    timer = setTimeout(function(){
                        originalHandle.apply( self, args );
                    }, 50 );
                };
            })();
        
        delete options.selector;                
        options.handle = handle;                

        options.elems.forEach(function(){
            var special = easyEvent.data( this, specialName, [] );
            // 将2个事件处理器存到缓存中，以便卸载
            special.push({
                originalHandle : originalHandle,
                handle : handle
            });
        });
        
        easyEvent.addEvent( options );
    }  
    
};
    
// Event接口对象的构造器
var Event = function( event ){
    // 无new实例化
    if( !(this instanceof Event) ){
        return new Event( event );
    }
    
    if( event && event.type ){
        this.originalEvent = event;
        this.type = event.type;
        
        this.isDefaultPrevented = ( event.defaultPrevented || event.returnValue === false ||
            event.getPreventDefault && event.getPreventDefault() ) ? true : false;    
    }
    else{
        this.type = event;
    }
    
    this.timeStamp = event && event.timeStamp || Date.now();
};

Event.prototype = {

    // 模拟DOM LV2的阻止默认事件的方法
    preventDefault : function(){
        // DOM LV3
        this.isDefaultPrevented = true;
        var e = this.originalEvent;
        
        if( e ){        
            // DOM LV2
            if( e.preventDefault ){
                e.preventDefault();
            }
            // IE6-8
            else{
                e.returnValue = false;
            }
        }
    },
    
    // 模拟DOM LV2阻止事件冒泡的方法
    stopPropagation : function(){
        // DOM LV3
        this.isPropagationStopped = true;
        var e = this.originalEvent;
        
        if( e ){        
            // DOM LV2
            if( e.stopPropagation ){
                e.stopPropagation();
            }

            // IE6-8
            e.cancelBubble = true;
        }
    },
    
    // 模拟DOM LV3阻止同类型事件冒泡的方法
    stopImmediatePropagation : function(){
        this.isImmediatePropagationStopped = true;
        this.stopPropagation();
    },

    // 判定是否阻止了默认事件
    isDefaultPrevented : false,    
    
    // 判定是否阻止了冒泡    
    isPropagationStopped : false,    
    
    // 判定是否阻止了同类型事件的冒泡
    isImmediatePropagationStopped : false
    
};

var easyEvent = {

    data : function( elem, name, val ){
        return easyData.data( elem, 'event', name, val );
    },
        
    removeData : function( elem, name ){
        return easyData.removeData( elem, 'event', name );
    },
    
    /*    
     * 绑定事件的内部方法
     * @param { Object } 参数集合 
     * elems : easyJS Object
     * selector : 事件代理的选择器
     * type : 事件类型
     * dataName : 缓存事件处理器的key
     * handle : 事件处理器
     * capture : 是否捕获
     * extraData : 附加数据
     * namespace : 命名空间
     */
    addEvent : function( options ){        
        var capture = options.capture === undefined ? false : options.capture,
            type = ( isECMAEvent ? '' : 'on' ) + options.type,
            selector = options.selector,
            dataName = options.dataName,
            elems = options.elems,
            len = elems.length,
            i = 0,
            handles, eventHandle, elem,
            eventData = {
                handle : options.handle 
            };

        if( options.namespace ){
            eventData.namespace = options.namespace;
        }
        
        if( options.extraData ){
            eventData.extraData = options.extraData;
        }
            
        for( ; i < len; i++ ){
            elem = elems[i];
            handles = this.data( elem, dataName, [] );
            
            // 将事件处理器添加到缓存的数组中，待统一执行
            handles.push( eventData );
            
            // 确保该元素只绑定一次同类型的事件
            if( handles.length === 1 ){
                // 生成一个统一的事件处理方法
                eventHandle = easyEvent.eventHandle( elem, selector );
                
                // 然后将该方法也缓存到数组的第一个索引中，方便之后的事件卸载
                handles.unshift({ handle : eventHandle });        
                elem[ ADDEVENT ]( type, eventHandle, capture );
            }
        }
    },
    
    /*    
     * 卸载事件的内部方法
     * @param { Object } 参数集合 参数解说同addEvent
     */
    removeEvent : function( options ){
        var capture = options.capture === undefined ? false : options.capture,
            type = ( isECMAEvent ? '' : 'on' ) + options.type,            
            namespace = options.namespace,
            dataName = options.dataName,
            handle = options.handle,
            elems = options.elems,
            len = elems.length,                        
            nameArr = dataName.split( '_' ),
            // specialName的命名规则是 'special_' + 原生的事件类型
            // dataName有可能带有选择器的的前缀
            specialName = 'special_' + ( options.selector ? options.selector + '_' : '' ) + nameArr[ nameArr.length - 1 ],            
            i = 0,
            handles, result, specialHandles, specialHandle, elem, j;

        for( ; i < len; i++ ){
            elem = elems[i];
            handles = this.data( elem, dataName );    
            
            if( handles ){
                specialHandles = this.data( elem, specialName );
                
                // 卸载指定的事件处理器
                if( handle || namespace ){
                    for( j = 1; j < handles.length; j++ ){
                        result = handles[j]; 

                        if( specialHandles ){
                            specialHandle = specialHandles[ j - 1 ];
                            if( specialHandle.originalHandle === handle ){
                                handle = specialHandle.handle;
                            }
                        }
                        
                        if( (!namespace || result.namespace === namespace) && 
                            (!handle || result.handle === handle) ){
                            
                            handles.splice( j, 1 );
                            
                            if( specialHandles ){
                                specialHandles.splice( j - 1, 1 );
                            }
                            
                            if( handle ){
                                break;
                            }
                            
                            j--;
                        }
                    }
                }
                
                // 没有指定函数名或只剩下一个【统一的事件处理器】将卸载所有的事件处理器
                if( !handle && !namespace || handles.length === 1 ){
                    // 卸载统一的事件处理器
                    elem[ REMOVEEVENT ]( type, handles[0].handle, capture );
                    
                    // 删除缓存中的该事件类型的所有数据
                    this.removeData( elem, dataName );
                    
                    if( specialHandles ){
                        this.removeData( elem, specialName );
                    }
                }
            }
        }            
    },
    
    /*    
     * 模拟事件触发器
     * @param { HTMLElement } 
     * @param { String } 事件类型
     * @param { Array } 事件处理器的数组
     * @param { String } 命名空间
     * @param { Array } 附加参数
     */    
    fireEvent : function( elem, type, namespace, fireData ){
        var i = 1,
            handles = this.data( elem, type ),
            len, event, parent, result, isPropagationStopped;

        if( handles ){
            // 修正Event对象
            event = {
                target : elem,
                currentTarget : elem,
                type : type,            
                stopPropagation : function(){
                    isPropagationStopped = true;
                }
            };

            if( fireData ){
                event.fireData = fireData;
            }
            
            if( !namespace ){
                handles[0].handle.call( elem, event );
            }
            else{
                len = handles.length;
                for( ; i < len; i++ ){
                    result = handles[i];
                    if( result.namespace === namespace ){
                        result.handle.call( elem, event );
                    }
                }
            }
            
            parent = elem.parentNode;
            // 模拟事件冒泡
            if( parent && !isPropagationStopped ){
                this.fireEvent( parent, type, null, namespace, fireData );
            }
        }
    },
        
    /*    
     * 事件代理的DOM元素过滤器，判断是否符合 selector 的匹配
     * @param { HTMLElement } 
     * @param { String } 基本类型的选择器( tag, class, id )
     * @return { Boolean } 是否匹配
     */
    delegateFilter : function( elem, selector ){
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
    
    // 原生的Event接口对象不方便重写，IE6-8和标准浏览器的Event接口对象又不一样，
    // 故模拟一个可写的、统一的Event接口对象，该对象包含了常见的标准属性和方法。
    fixEvent : function( event ){
        var sourceEvent = event,
            target = event.target,
            type;
        
        // 创建Event对象    
        event = Event( sourceEvent );
        // 将原生的Event的某些常见的标准属性合并到新Event中
        event = E.mix( event, sourceEvent, true, eventProps );
        
        // IE6-8只有srcElement没有target属性，需统一
        if( !target ){
            target = event.target = event.srcElement || document;
        }
        
        // safari中的target可能是文本节点
        if( target.nodeType === 3 ){
            event.target = event.target.parentNode;
        }
        
        // IE6-8没有metaKey属性
        if( event.metaKey === undefined ){
            event.metaKey = event.ctrlKey;
        }
        
        type = event.type;
        
        // 修正标准鼠标事件
        if( rMouseEvent.test(type) ){
            var doc = target.ownerDocument || document,
                docElem = doc.documentElement,
                body = doc.body,
                button = sourceEvent.button,
                fromElement = sourceEvent.fromElement,
                offset;

            // 合并鼠标事件的常用属性到新Event中    
            event = E.mix( event, sourceEvent, true, mouseProps );                
                
            // IE6-8不支持event.pageX和event.pageY    
            if( event.pageX === undefined && sourceEvent.clientX !== undefined ){                    
                event.pageX = sourceEvent.clientX + ( docElem && docElem.scrollLeft || body && body.scrollLeft || 0 ) - ( docElem && docElem.clientLeft || body && body.clientLeft || 0 ); 
                event.pageY = sourceEvent.clientY + ( docElem && docElem.scrollTop || body && body.scrollTop || 0 ) - ( docElem && docElem.clientTop || body && body.clientTop || 0 ); 
            }
            
            // firefox不支持event.offsetX和event.offsetY
            if( event.offsetX === undefined ){
                offset = E( target ).offset();
                event.offsetX = event.pageX - offset.left;
                event.offsetY = event.pageY - offset.top;
            }
            
            // relatedTarget 属性返回触发 mouseover 和 mouseout 的元素
            // IE6-8：mouseover 为 fromElement，mouseout 为 toElement
            if( !event.relatedTarget && fromElement ){
                event.relatedTarget = fromElement === target ? sourceEvent.toElement : fromElement;
            }
            
            // 为 click 事件添加 which 属性，左1 中2 右3
            // IE button的含义：
            // 0：没有键被按下 
            // 1：按下左键 
            // 2：按下右键 
            // 3：左键与右键同时被按下 
            // 4：按下中键 
            // 5：左键与中键同时被按下 
            // 6：中键与右键同时被按下 
            // 7：三个键同时被按下
            if( !event.which && button !== undefined ){
                event.which = [ 0, 1, 3, 0, 2, 0, 0, 0 ][ button ];
            }

            doc = docElem = body = null;
        }

        // 修正标准按键事件
        if( rKeybordEvent.test(type) ){
            // 合并按键事件的常用属性到新Event中    
            event = E.mix( event, sourceEvent, true, keybordProps );                
            
            if( event.which === undefined ){
                event.which = sourceEvent.charCode !== undefined ? sourceEvent.charCode : sourceEvent.keyCode;
            }
        }
        
        // 修正触摸事件
        if( window.Touch && event.touches && event.touches[0] ){
            event.pageX = event.touches[0].pageX;
            event.pageY = event.touches[0].pageY;
        }
        
        // 修正鼠标滚轮事件，统一使用wheelDelta属性
        if( rMousewheel.test(type) ){
            // safari可能会出现小数点
            if( 'wheelDelta' in sourceEvent ){
                event.wheelDelta = Math.round( sourceEvent.wheelDelta );
            }
            else if( 'detail' in sourceEvent ){                
                event.wheelDelta = -sourceEvent.detail * 40;
            }
        }
        
        return event;
    },
    
    /*    
     * 生成一个统一的事件处理器，来依次执行该元素绑定的所有事件处理器
     * @param { HTMLElement } 
     * @param { String/Function } 事件代理的选择器或事件处理器(若为事件处理器将不予理会) 
     * @return { Function }
     */    
    eventHandle : function( elem, selector ){    
        return function( event ){
            event = easyEvent.fixEvent( event );
            
            var orginalTarget = event.target,    
                fireData = event.fireData,
                isDelegate = false,
                type = event.type,
                target = elem,
                dataName = type,
                i = 1,
                handles, len, j, filter, result;  

            // IE6-8没有currentTarget属性
            if( !event.currentTarget ){
                event.currentTarget = easyEvent.data( orginalTarget, 'currentTarget' ) || elem;
            }

            // 如果有 selector 则用 target 与 selector 进行匹配，匹配成功才执行事件处理器
            // 这就是事件代理的简单原理，利用事件冒泡的特性                            
            if( selector ){                    
                filter = easyEvent.delegateFilter;    
                // 事件代理时将 this 指向 event.target，否则默认指向 elem
                target = orginalTarget;
                // 选择器 + 事件类型的方式来区分事件代理
                dataName = selector + '_' + type;
                
                for( ; target !== elem; target = target.parentNode || elem ){
                    if( filter(target, selector) ){
                        isDelegate = true;
                        break;
                    }                        
                }                    
            }

            if( !selector || isDelegate ){
                handles = easyEvent.data( elem, dataName );    
                
                if( handles ){                
                    len = handles.length;

                    for( ; i < len; i++ ){
                        // 针对只执行一次即卸载的事件的特殊处理
                        j = handles[i] ? i : i - 1;
                        result = handles[j];

                        // 将缓存的附加数据添加到event对象中
                        if( result.extraData || fireData ){                            
                            event.extraData = E.merge( result.extraData || {}, fireData );
                            try{
                                event.originalEvent.fireData = null;
                                delete event.originalEvent.fireData;
                            }
                            catch( _ ){};
                            
                            delete event.fireData;
                        }
                        // 附加数据不能共享以确保不冲突
                        else{
                            delete event.extraData;
                        }
                        
                        if( result.handle.call(target, event) === false ){
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    }
                }
            }
        };
    }
    
};

// 绑定和卸载事件供外部调用的原型方法的拼装
E.each({
    on : 'setup',
    un : 'teardown' 
}, function( key, val ){
    
    E.prototype[ key ] = function( type, selector, extraData, fn, one ){
        var types = type.match( /[^\s]+/g ),
            len = types.length,
            isOn = key === 'on',
            isOne = isOn && one === true,
            options = {},
            i = 0,
            special, dataName, originalFn;

        if( len === 1 ){
            type = fixEventType[ types[0] ] || types[0];            
            types = type.split( '.' );
            type = types[0];
            options.namespace = types[1];            
            special = eventHooks[ type ];
            dataName = type;
        }
        // 多个事件类型循环绑定或卸载
        else{
            for( ; i < len; i++ ){
                this[ isOne ? 'one' : key ]( types[i], selector, extraData, fn );
            }
            return this;
        }

        // 处理相关的参数
        if( !fn ){
            if( selector ){
                if( E.isFunction(selector) ){
                    fn = selector;
                    selector = extraData = null;
                }
                else if( E.isPlainObject(selector) ){
                    fn = extraData;
                    extraData = selector;
                    selector = null;
                }
                else if( E.isString(selector) ){                
                    fn = extraData;
                    // 事件代理时缓存的name格式为：选择器 + '_' + 事件类型 => '.demo_click'
                    dataName = selector + '_' + type;
                    extraData = null;
                }
            }            
            else if( extraData ){
                if( E.isFunction(extraData) ){
                    fn = extraData;
                    extraData = null;
                }
            }
        }
        else if( E.isString(selector) ){
            dataName = selector + '_' + type;
        }

        // one方法的实现，执行真正的事件处理器前先卸载该事件
        if( isOne ){
            originalFn = fn;            
            fn = function( e ){
                var originalEvent = e.originalEvent,
                    args = [ e ];
                
                E( e.currentTarget ).un( type, selector, fn );
                originalFn.apply( this, args );
            };
        }
        
        E.mix( options, {
            elems : this,
            type : type,
            handle : fn,
            dataName : dataName,
            selector : selector,
            extraData : extraData            
        });
        
        // 特殊事件的绑定和卸载分支
        if( special && special[val] ){
            special[ val ]( options );
        }
        else{
            easyEvent[ isOn ? 'addEvent' : 'removeEvent' ]( options );
        }        
        
        return this;
    };    
    
});

E.mix( E.prototype, {

    fire : function( type, fireData ){
        type = fixEventType[ type ] || type;
        var types = type.split( '.' ),
            namespace = types[1],
            special;
           
        type = types[0];
        special = eventHooks[ type ];
        
        if( special && special.trigger ){
            special.trigger( this, namespace, fireData );
            return this;
        }
        
        return this.forEach(function(){                
            // 统一使用模拟的触发(原来是优先使用原生的触发器)
            // 优势1：保证事件命名空间和附加数据的功能
            // 优势2：能捕获到异常
            // 优势3：确保了兼容性    
            easyEvent.fireEvent( this, type, namespace, fireData );
        });
    },
    
    one : function( type, selector, extraData, fn ){
        return this.on( type, selector, extraData, fn, true );
    }
    
});

});