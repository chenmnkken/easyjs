// ---------------------------------------------
// --------------@module support----------------
// ---------------------------------------------
 
define(function(){

'use strict';

var support = function(){

    var div = document.createElement( 'div' ),
        button, input, select, option, testCloneEvent;        
        
    div.innerHTML = '<link/><table></table><input type="checkbox" /><button value="testValue">click</button>';
    input = div.getElementsByTagName( 'input' )[0];
    button = div.getElementsByTagName( 'button' )[0];    
    select = document.createElement( 'select' );
    option = select.appendChild( document.createElement('option') );
    
    var fireEvent = function( elem, type ){
        if( document.createEvent ){
            var event = document.createEvent( 'HTMLEvents' );
            event.initEvent( type, true, true );
            elem.dispatchEvent( event );
        }
        else{
            elem.fireEvent( 'on' + type );
        }    
    };

    var support = {
    
        tbody : !div.getElementsByTagName( 'tbody' ).length,
        
        // 使用innerHTML创建script、link、style元素在IE6/7下
        htmlSerialize : !!div.getElementsByTagName( 'link' ).length,
        
        cloneEvent : false,
        
        // IE6在克隆HTML5的新标签元素时outerHTML有":"
        cloneHTML5 : document.createElement( 'nav' ).cloneNode( true ).outerHTML !== '<:nav></:nav>',
        
        // IE6-7获取button元素的value时是innerText
        buttonValue : button.getAttribute( 'value' ) === 'testValue',
        
        // 在大多数游览器中checkbox的value默认为on，唯有chrome返回空字符串
        checkOn : input.value === 'on',
        
        // 部分标准浏览器不支持mouseenter和mouseleave事件，包括chrome和ff3.5
        mouseEnter : false
        
    };
    
    // IE6-9在克隆input元素时没有克隆checked属性
    input.checked = true;
    support.cloneChecked = input.cloneNode( true ).checked; 
    
    // IE6-7 set/getAttribute tabindex都有问题
    input.setAttribute( 'tabindex', '5' );
    support.attrTabindex = parseInt( input.getAttribute('tabindex') ) === 5;

    // IE6-8在克隆DOM元素时也会克隆用attachEvent绑定的事件
    if( !div.addEventListener && div.attachEvent && div.fireEvent ){
        testCloneEvent = function(){
            support.cloneEvent = true;
            div.detachEvent( 'onclick', testCloneEvent );
        };
        div.attachEvent( 'onclick', testCloneEvent );
        div.cloneNode( true ).fireEvent( 'onclick' );
    }
    
    // chrome和firefox3.5不支持该事件
    div.onmouseenter = function(){
        support.mouseEnter = true;
    };
    
    fireEvent( div, 'mouseenter' );
    
    if( E.browser.firefox ){
        support.focusin = false;
        // firefox目前不支持focusin和focusout事件
        div.onfocusin = function(){
            support.focusin = true;
        };
        
        fireEvent( div, 'focusin' );
    }
    else{
        support.focusin = true;
    }
    
    // 设置select为disable时，option不应该有disable属性
    select.disabled = true;
    support.optDisabled = !option.disabled;
    
    div = input = button = select = option = div.onmouseenter = null;

    return support;
};

E.support = support();

});