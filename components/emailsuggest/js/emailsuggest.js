/*
* Emailsuggest components v0.1.0 for easy.js
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
    data       :   null,      // Array         设置用于提示的邮箱类型
    zIndex     :   9998,      // Number        提示层的层级值
    space      :   0          // Number        提示层和input框的上下间距 
};

var $doc = E( document ),
    $win = E( window ),
    suggestCache = {},    
    rEmail = /@/,
    bdLeftWidth, bdRightWidth;

var easyEMS = {

    createSuggest : function( o ){
        var html = '<ul class="eui_emailsuggest" style="z-index:' + o.zIndex + '">',
            suggestElem, itemElem;
        
        o.data.forEach(function( item ){
            html += '<li>@' + item + '</li>';
        });
        
        html += '</ul>';
        
        // 让suggest响应鼠标hover和选中
        suggestElem = E( html ).appendTo( o.context.body )
            .on( 'mouseover', 'li', function(){
                var elem = E( this );
                
                if( !elem.hasClass('current') ){
                    itemElem.filter( '.current' ).removeClass( 'current' );
                    elem.addClass( 'current' );
                }
            })
            .on( 'click', 'li', function(){
                var value = E( this ).text();
                o.target.val( value ).fire( 'likeselected', { value : value }); 
            });
            
        // 缓存邮箱后缀    
        itemElem = suggestElem.children( 'li' ).forEach(function(){
            E( this ).data( 'html', this.innerHTML );
        });
        
        o.itemElem = itemElem;
        o.suggestElem = suggestElem;        
    },
    
    setPosition : function( o ){
        var suggestElem = o.suggestElem,
            target = o.target,
            offset = target.offset(),
            width = target.outerWidth(),
            height = target.outerHeight(),
            bdBottomWidth = parseInt( target.css('borderBottomWidth') );
            
        bdLeftWidth = bdLeftWidth || parseInt( suggestElem.css('borderLeftWidth') );
        bdRightWidth = bdRightWidth || parseInt( suggestElem.css('borderRightWidth') );
            
        suggestElem.css({
            top : offset.top + height - bdBottomWidth + o.space + 'px',
            left : offset.left + 'px',
            width : width - bdLeftWidth - bdRightWidth + 'px',
            display : 'block'
        });
    },
    
    render : function( o ){
        var value = o.value,
            target = o.target,            
            originalValue = target.data( 'value' ),
            isEmail = false;
        
        if( value !== originalValue ){
            target.data( 'value', value );
            isEmail = rEmail.test( value );
            o.itemElem.forEach(function(){
                var elem = E( this ),
                    text;
                
                if( isEmail ){
                    text = elem.text();
                    
                    if( ~text.indexOf(value) ){
                        elem.css( 'display', 'block' );
                    }
                    else{
                        elem.css( 'display', 'none' )
                            .removeClass( 'current' );
                    }
                }
                else{
                    elem.css( 'display', 'block' )
                        .text( value + elem.data('html') );
                }
            });
        }
    },
    
    keyup : function( o, e ){
        var which = e.which,
            value;
        
        if( which === 13 || which === 9 ){
            easyEMS.close( o );
            return;
        } 

        value = o.target[0].value.trim();
            
        if( value !== '' ){
            if( o.suggestElem.is(':hidden') ){
                easyEMS.setPosition( o ); 
                
                $win.on( 'resize.emailsuggest', function(){
                    easyEMS.setPosition( o );
                });
                
                $doc.on( 'click.emailsuggest', function( e ){
                    if( e.target !== o.target[0] ){
                        easyEMS.close( o );
                    }
                });
            }
            o.value = value;           
            easyEMS.render( o );
        }        
    },
    
    keydown : function( o, e ){
        var which = e.which, 
            value, item;
        
        switch( which ){        
            case 38 :
                easyEMS.keyMove( o, false );
                e.preventDefault();
            break;
            
            case 40 :
                easyEMS.keyMove( o, true );
                e.preventDefault();
            break;
            
            case 13 :
                item = o.itemElem.filter( '.current' );
                
                if( item.length ){
                    value = item.text();
                    o.target.val( value ).fire( 'likeselected', { value : value });
                }
                e.preventDefault();
            break;
        }        
    },
    
    keyMove : function( o, isDown ){
        var findType = isDown ? 'next' : 'prev',
            item = o.itemElem.filter( ':visible' ),
            first = item.first(),
            last = item.last(),
            elem;
        
        if( item.length === 1 ){
            item.addClass( 'current' );
            return;
        }
        
        elem = item.filter( '.current' );

        if( !elem.length ){
            elem = first;
        }
        else{
            elem.removeClass( 'current' );
            elem = elem[ findType ]();
        }
        
        if( elem.is(':hidden') ){
            elem = elem[ findType ]();
            while( elem.length ){
                if( elem.is(':visible') ){
                    break;
                }
                elem = elem[ findType ]();
            }
        }
        
        if( !elem.length ){
            elem = isDown ? first : last;
        }
        
        elem.addClass( 'current' );
    },
    
    close : function( o ){
        var suggestElem = o.suggestElem;
        
        if( suggestElem.is(':visible') ){
            suggestElem.css( 'display', 'none' );
            
            $win.un( 'resize.emailsuggest' );
            $doc.un( 'click.emailsuggest' );
        }
    },
    
    init : function( o ){
        var target = o.target;
        
        // 初始化时关闭input的原生的自动完成功能
        target.attr( 'autocomplete', 'off' )
            .on( 'focus.emailsuggest', function(){
                var euid = this[ E.euid ],
                    value = this.value;
                
                if( suggestCache[euid] === undefined ){
                    suggestCache[ euid ] = true;
                    easyEMS.createSuggest( o );
                    target.data( 'value', value );
                }
            }) 
            .on( 'keydown.emailsuggest', function( e ){
                easyEMS.keydown( o, e );
            })
            .on( 'keyup.emailsuggest', function( e ){
                easyEMS.keyup( o, e ); 
            });
    }

};

var EmailSuggest = function( target, options ){
    target = E( target ).eq( 0 );
    options = options || {};
    
    if( !target.length ){
        return;
    }
    
    var o = E.merge( defaults, options );
    
    o.target = target;
    o.context = target[0].ownerDocument;
    easyEMS.init( o );
    this.__o__ = o;
};

EmailSuggest.prototype = {
    
    on : function( type, fn ){
        if( !this.__o__ ){
            return this;
        }
        
        var self = this,
            o = self.__o__;
        
        o.target.on( 'like' + type, function( e ){
            e.type = type;
            e.value = e.extraData.value;
            delete e.extraData;
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
    }
    
};

E.ui.EmailSuggest = EmailSuggest;

});