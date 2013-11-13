define(function(){

'use strict';

var defaults = {
    index : 0,
    indexSwitch : true 
};

var easyCarousel = {
    
    init : function( o ){
        var listElem = o.listElem;
            
        o.wrapElem.css( 'overflow', 'hidden' );
        
        listElem.css({
            width : o.listWidth + 'px', 
            left : '0px'
        });
        
        if( o.indexSwitch ){
            listElem.on( 'click.carousel', 'li', function(){
                var elem = E( this );
                listElem.stop( true, true );
                if( !elem.hasClass('current') && elem.parent().hasClass('carousel_list') ){
                    easyCarousel.switchHandle( o, elem, true );
                    listElem.find( 'li.current' ).removeClass( 'current' );
                    elem.addClass( 'current' );
                }
            });
            
            // 初始化高亮item的位置
            if( o.index ){
                easyCarousel.switchHandle( o, o.itemElem.eq(+o.index) );
            }
        }

        if( o.slide ){
            o.prevElem.on( 'click.carousel', function( e ){
                listElem.stop( true, true );  
                easyCarousel.slide( o, true );    
                e.preventDefault();
            });
            
            o.nextElem.on( 'click.carousel', function( e ){
                listElem.stop( true, true );  
                easyCarousel.slide( o ); 
                e.preventDefault();
            });
        }
    },
    
    slide : function( o, isPrev ){
        var target = o.target,
            listElem = o.listElem,
            left = Math.abs( parseInt(listElem.css('left')) ),
            wrapWidth = o.wrapWidth,
            lastLeft = o.listWidth - wrapWidth,
            distance, operator, eventType;
            
        if( isPrev ){                            
            if( left === 0 ){
                return;
            }
            
            if( wrapWidth > left ){
                distance = left;
                eventType = 'liketoStart';
            }
            else{
                distance = wrapWidth;
            }
            operator = '+=';
        }
        else{
            if( left === lastLeft ){
                return;
            }            
                
            if( left + wrapWidth > lastLeft ){
                distance = lastLeft - left;
                eventType = 'liketoEnd';
            }
            else{
                distance = wrapWidth;
            }
                
            operator = '-=';    
        }
        
        listElem.anim({
            to : { left : operator + distance + 'px' },
            duration : 400,
            easing : 'easeInStrong',
            complete : function(){
                if( eventType ){
                    target.fire( eventType );
                }
            }
        });       
    },
    
    switchHandle : function( o, elem, isTrigger ){
        var target = o.target,
            listElem = o.listElem,            
            left, middleLeft, offsetLeft, lastLeft, distance, operator, eventType, wrapWidth;
            
        if( o.slide ){
            wrapWidth = o.wrapWidth;
            left = Math.abs( parseInt(listElem.css('left')) );
            middleLeft = left + wrapWidth / 2;
            offsetLeft = Math.floor( elem.offset().left ) - o.wrapOffset + left;
            lastLeft = o.listWidth - wrapWidth;
        
            if( offsetLeft > middleLeft ){
                distance = offsetLeft - middleLeft;            
                
                if( (left + distance) > lastLeft ){
                    distance = lastLeft - left;
                    eventType = 'liketoEnd';
                }
                
                operator = '-=';
            }
            else if( left !== 0 ){
                distance = middleLeft - offsetLeft;           

                if( distance > left ){
                    distance = left;
                    eventType = 'liketoStart';
                }
                
                operator = '+=';
            }
            
            if( distance ){        
                listElem.anim({
                    to : { left : operator + distance + 'px' },
                    duration : 400,
                    easing : 'easeInStrong',
                    complete : function(){
                        if( eventType ){
                            target.fire( eventType );
                        }
                    }
                });                
            }
        }
        
        if( o.indexSwitch && isTrigger ){
            target.fire( 'likechange', { target : elem[0], index : elem.attr('data-index') });
        }
    }
    
};

var Carousel = function( target, options ){
    target = E( target ).first();
    options = options || {};
    
    if( !target.length ){
        return;
    }
    
    var o = E.merge( defaults, options ),        
        itemElem, index;
    
    o.target = target;
    o.wrapElem = target.find( 'div.carousel_wrapper' );
    o.listElem = target.find( 'ul.carousel_list' );
    o.prevElem = target.find( 'a.carousel_prev' );
    o.nextElem = target.find( 'a.carousel_next' );    
    o.itemElem = itemElem = o.listElem.children( 'li' );    
    
    o.itemWidth = itemElem.outerWidth();     
    o.listWidth = o.itemWidth * itemElem.length;    
    o.wrapWidth = o.wrapElem.outerWidth();   
    
    // item数量不够的情况下就没有动画切换效果
    if( o.listWidth <= o.wrapWidth ){
        o.prevElem.hide();
        o.nextElem.hide();
        o.slide = false;
    }
    else{
        o.prevElem.show();
        o.nextElem.show();
        o.slide = true;        
    }

    index = (+o.index);
    
    if( o.indexSwitch ){
        o.wrapOffset = Math.floor( o.wrapElem.offset().left );
        itemElem.forEach(function( i ){
            var item = E( this );            
            item.attr( 'data-index', i );

            if( index === i ){
                item.addClass( 'current' );
            }
        });
    }
    
    easyCarousel.init( o );
    this.__o__ = o;
};

Carousel.prototype = {

    destroy : function(){
        if( !this.__o__ ){
            return;
        }
        
        var o = this.__o__;
        
        o.target.un( 'likechange liketoStart liketoEnd' );
        o.listElem.un( 'click.carousel' );
        o.prevElem.un( 'click.carousel' );
        o.nextElem.un( 'click.carousel' );
        o.itemElem.filter( '.current' ).removeClass( 'current' );

        this.__o__ = o = null;
        delete this.__o__;
    },

    on : function( type, fn ){
        if( this.__o__ ){
            var self = this;
            this.__o__.target.on( 'like' + type, function( e ){                    
                if( e.extraData ){
                    e.target = e.extraData.target;
                    e.index = ( +e.extraData.index );
                    delete e.extraData;
                }
                
                e.type = type;                
                fn.call( self, e );
                e.stopPropagation();
            });            
        }
        
        return this;
    },

    un : function( type, fn ){
        if( this.__o__ ){
            this.__o__.target.un( 'like' + type );
        }
        
        return this;
    },
    
    change : function( index ){
        var o = this.__o__,
            itemElem = o.itemElem.eq( index ),
            listElem = o.listElem;
            
        if( !itemElem.hasClass('current') ){                
            listElem.stop( true, true );
            easyCarousel.switchHandle( o, itemElem );
            listElem.find( 'li.current' ).removeClass( 'current' );
            itemElem.addClass( 'current' );
        }
        
        return this;
    }

};

E.ui.Carousel = Carousel;

});