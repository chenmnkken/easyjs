/* 组图频道公用JS */


/*==============================================*/
/*================ carousel 组件 ===============*/
/*==============================================*/ 

(function( $, window, undefined ){

'use strict';

$.easing.easeInStrong = function(t){
    return t * t * t * t;
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
                var elem = $( this );
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
        
        listElem.animate({
            left : operator + distance + 'px' 
        }, 400, 'easeInStrong', function(){
            if( eventType ){
                target.trigger( eventType );
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
                listElem.animate({
                    left : operator + distance + 'px' 
                }, 400, 'easeInStrong', function(){
                    if( eventType ){
                        target.trigger( eventType );
                    }
                });               
            }
        }
        
        if( o.indexSwitch && isTrigger ){
            target.trigger( 'likechange', [ elem[0], elem.attr('data-index') ] );
        }
    }
    
};

var Carousel = function( target, options ){
    target = $( target ).first();
    options = options || {};
    
    var o = $.extend({
            index : 0,
            indexSwitch : true 
        }, options ),
        
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
        itemElem.each(function( i ){
            var item = $( this );            
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
        
        o.target.off( 'likechange liketoStart liketoEnd' );
        o.listElem.off( 'click.carousel' );
        o.prevElem.off( 'click.carousel' );
        o.nextElem.off( 'click.carousel' );
        o.itemElem.filter( '.current' ).removeClass( 'current' );

        this.__o__ = o = null;
        delete this.__o__;
    },

    on : function( type, fn ){
        if( this.__o__ ){
            var self = this;
            this.__o__.target.on( 'like' + type, function( e, target, index ){
                if( target ){
                    e.target = target;
                    e.index = (+index);
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
            this.__o__.target.off( 'like' + type );
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

$.Carousel = Carousel;

})( jQuery, window );


/*==============================================*/
/*================ lightBox 组件 ===============*/
/*==============================================*/ 


(function( $, window ){

'use strict';

$.fn.wheel = function( type, fn ){
    var eventType = $.browser.mozilla ? 'DOMMouseScroll' : 'mousewheel',        
        fixEvent = function( e ){
            var originalEvent = e.originalEvent,
                event = {};
            
            if( 'wheelDelta' in originalEvent ){
                event.wheelDelta = Math.round( originalEvent.wheelDelta );
            }
            else if( 'detail' in originalEvent ){                
                event.wheelDelta = -originalEvent.detail * 40;
            }

            return event;
        };
        
    if( type === 'on' ){
        this.on( eventType, function( e ){
            var event = $.extend( e, fixEvent(e) );
            fn.call( this, e );
        });
    }
    else if( type === 'off' ){
        this.off( eventType, fn );
    }        
};

var isIE6 = $.browser.msie && $.browser.version === '6.0',
    document = window.document,
    docMode = document.documentMode,
    supportHashChange = 'onhashchange' in window && ( docMode === undefined || docMode > 7 ),    
    docElem = document.documentElement,   
    $doc = $( document ),
    $docElem = $( docElem ),
    $win = $( window ),
    imgLoader = new Image(),
    isIE = $.browser.msie,
    body = document.body,  
    rHash = /[#&]lightboxindex=\d+/,
    index, boxElem, mainImg, imgBoxElem, bodyElem, btnMainPrev, btnMainNext, thumbElem, thumbWrapElem, thumbPrevElem, thumbNextElem, thumbListElem, loadingElem, headHeight, footerHeight, maxHeight, maxWidth, mainArrowWidth, closeElem, sizeCache, thumbSpace, itemWidth, slideElem, pageCurrentElem, pageNumElem, footerElem, btnSlide, slideTextElem, winHeight, placeholderElem, 
    
    // 获取滚动条的宽度
    scrollBarWidth = (function(){
        var div = $('<div style="width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px;"/>').appendTo( 'body' ),
            width = div[0].offsetWidth - div[0].clientWidth;
            
        div.remove();
        return width;
    })();    

var easyLightBox = {  

    throttle : function( fn ){        
        var timer;
        
        return function(){
            var self = this,
                args = arguments;
                
            clearTimeout( timer );
            timer = setTimeout(function(){
                fn.apply( self, args );
            }, 50 );
        };
    },
    
    parseHash : function( href ){
        href = href || window.location.href;
        
        if( !~href.indexOf('#') || href.slice(-1) === '#' ){
            return;
        }
        
        var hash = href.slice( href.indexOf('#') + 1 ),
            arr = hash.split( '&' ),
            len = arr.length,
            obj = {},
            i = 0,
            item, index;
        
        for( ; i < len; i++ ){
            item = arr[i];
            index = item.indexOf( '=' );
            name = item.slice( 0, index );
            obj[ name ] = item.slice( index + 1 );
        }
        
        return obj;
    },    
    
    createThumb : function( o ){
        var html = '';
            
        $.each( o.data, function( _, item ){
            html += '<li><img src="'  + item.thumbSrc + '" width="' + item.thumbWidth + '" height="' + item.thumbHeight + '" />';
        });      
    
        thumbListElem.html( html );
    },
    
    hideScrollBar : function(){
        $docElem.css({
            width : '100%',
            height : '100%',
            overflow : 'hidden'
        });
    },
    
    showScrollBar : function(){
        $docElem.css({
            width : '',
            height : '',
            overflow : ''
        });    
    },
    
    layout : function( o, isResize ){
        winHeight = $win.height();
        var scrollWidth = docElem.scrollWidth,
            scrollHeight = docElem.scrollHeight,           
            winWidth = $win.width(),
            boxWidth = winWidth + ( scrollHeight > winHeight && !isResize ? scrollBarWidth : 0 ),
            boxHeight = winHeight + ( scrollWidth > winWidth && !isResize ? scrollBarWidth : 0 ),
            thumbWrapWidth = winWidth - 100,
            itemElem, thumbListWidth;         
            
        if( !isResize ){                       
            easyLightBox.hideScrollBar();
        }

        if( !itemWidth ){
            itemElem = thumbListElem.children( 'li' );   
            itemWidth = itemElem.outerWidth();           
        }

        footerHeight = footerHeight || footerElem.outerHeight();
        mainArrowWidth = mainArrowWidth || btnMainPrev.outerWidth();
        thumbSpace = thumbSpace || $( '#lbCarouselPrev' ).outerWidth() * 2 + parseInt( thumbWrapElem.css('marginLeft') ) + parseInt( thumbWrapElem.css('marginRight') ); 
        thumbListWidth = itemWidth * o.data.length;     
        
        boxElem.css({
            top : $win.scrollTop() + 'px',
            left : $win.scrollLeft() + 'px',
            // 计算宽度和高度时需要加上滚动条的宽度    
            width : boxWidth + 'px',
            height : boxHeight + 'px',
            display : 'block',
            zIndex : o.zIndex
        });
        
        if( thumbListWidth + thumbSpace > thumbWrapWidth ){
            thumbWrapWidth = thumbWrapWidth - ( (thumbWrapWidth - thumbSpace) % itemWidth ) - thumbSpace;
        }
        else{
            thumbWrapWidth = thumbListWidth;
        }
        
        if( o.init ){
            o.init( index, o.data );
            delete o.init;
        }        

        thumbListElem.css( 'width', thumbListWidth + 'px' );
        thumbWrapElem.css( 'width', thumbWrapWidth + 'px' );       
        easyLightBox.setBodyHeight( winHeight );        
        maxWidth = boxWidth - mainArrowWidth * 2;
    },
    
    changeHash : function( o ){
        if( o.hash ){
            var href = window.location.href,
                symbol = ~href.indexOf( '#' ) ? '&' : '#';            
            
            href = href.replace( rHash, '' );
            window.location.href = href + symbol + 'lightboxindex=' + index;
        }
    },
    
    slideThumb : function( isUp ){
        var bodyHeight = bodyElem.height(),
            btnHeight = btnMainPrev.height(),
            distance, oldClassName, newClassName, text;
            
        if( isUp ){
            distance = bodyHeight - footerHeight;
            btnHeight -= ( bodyHeight - distance ); 
            oldClassName = 'btn_slide_up';
            newClassName = 'btn_slide_down';
            text = '隐藏缩略图';                 
        }
        else{
            distance = bodyHeight + footerHeight;
            btnHeight += ( distance - bodyHeight ); 
            oldClassName = 'btn_slide_down';
            newClassName = 'btn_slide_up';
            text = '显示缩略图';            
        }
        
        bodyElem.animate({
                height : distance + 'px'
            }, 300, function(){
                slideTextElem.text( text );
                btnSlide.removeClass( oldClassName ).addClass( newClassName );                    
                maxHeight = distance - 20;    
                easyLightBox.zoom.call( mainImg[0], null, true );   
                btnMainPrev.css( 'height', btnHeight + 'px' );
                btnMainNext.css( 'height', btnHeight + 'px' );
            });
    },
    
    switchHandle : function( o, isPrev ){
        var data = o.data,
            len = data.length,
            nextIndex, symbol;
        
        if( isPrev ){
            index -= 1;
            nextIndex = index - 1;
        }
        else{
            index += 1;
            nextIndex = index + 1;
        }
        
        if( index === len - 1 ){
            boxElem.trigger( 'liketoEnd' );
        }
        
        if( !index ){
            boxElem.trigger( 'liketoStart' );
        }
        
        if( index === len ){
            boxElem.trigger( 'likeend' );
            index--;
        }
        else{
            index = !~index ? len - 1 : index;
            boxElem.trigger( 'likechange', [ index, data ] );
            easyLightBox.setBodyHeight();
            easyLightBox.loadImg( data[index] );
            
            if( data[nextIndex] ){
                imgLoader.src = data[ nextIndex ].src;
            }
            
            easyLightBox.changeHash( o );
            o.carousel.change( index );
            pageCurrentElem.text( index + 1 );            
        }
    },
    
    setBodyHeight : function( height ){
        height = height || winHeight;
        var siblings = bodyElem.siblings(),
            btnHeight = 0,
            otherHeight = 0,
            bodyHeight, btnHeight;
            
        siblings.each(function(){
            var elem = $( this ),
                height = elem.outerHeight();
            
            if( !elem.hasClass('lb_header') && !elem.hasClass('lb_footer') ){
                btnHeight += height;
            }
            
            if( elem.is(':visible') ){
                otherHeight += height;
            }
        });
        
        if( btnSlide.hasClass('btn_slide_up') ){
            otherHeight -= footerHeight;
        }
        
        bodyHeight = height - otherHeight;

        btnHeight += bodyHeight;
        maxHeight = bodyHeight - 20;
        bodyElem.css( 'height', bodyHeight + 'px' );
        btnMainPrev.css( 'height', btnHeight + 'px' );
        btnMainNext.css( 'height', btnHeight + 'px' );
    },  
    
    // 对尺寸超过合适范围的大图进行等比例缩小
    zoom : function( e, isResize, isPlaceholder ){
        var img = $( this ),
            width, height, scale;     
            
        width  = sizeCache.originWidth;
        height = sizeCache.originHeight;
      
        // 宽度超出
        if( width > maxWidth ){
            scale = maxWidth / width;
            width = maxWidth;
            height = Math.floor( height * scale );  
        }
        
        // 高度超出
        if( height > maxHeight ){
            scale = maxHeight / height; 
            height = maxHeight;    
            width = Math.floor( width * scale );                       
        }             

        img.css({
            marginTop : 0 - height / 2,
            marginLeft : 0 - width / 2,
            width : width,
            height : height                           
        });        
        
        if( !isResize ){
            img.css( 'visibility', 'visible' );    
            
            // 在实际大图加载完后删除掉占位图
            if( img.hasClass('lb_main_img') && placeholderElem ){
                placeholderElem.remove();
                placeholderElem = null;
            }            
            
            if( !isPlaceholder ){
                img.css( 'display', 'none' ).fadeIn( 200 );
            }
        }

        if( !isResize ){
            boxElem.trigger( 'likeload', [ null, null, sizeCache ] );
        }
    },
    
    loadImg : function( data, isPlaceholder ){
        var height = data.height,
            width = data.width,            
            src = data.src;
        
        // 有占位图时不对图片进行隐藏和淡入淡出操作
        if( !isPlaceholder ){
            mainImg.stop( true, true )
                .css( 'visibility', 'hidden' )
                .removeAttr( 'data-link' )
                .fadeOut( 200 );
        }
            
        sizeCache = {
            originWidth : width,
            originHeight : height
        };    
        
        mainImg[0].src = src;  
        mainImg.attr( 'data-link', data.link );
    },
    
    close : function( o ){
        boxElem.hide();        
        easyLightBox.showScrollBar();
        
        mainImg.off( 'load' );
        btnMainPrev.off( 'click' );
        btnMainNext.off( 'click' );
        $doc.off( 'keyup.lightbox keydown.lightbox' );
        $win.off( 'resize.lightbox hashchange.lightbox' );
        o.carousel.destroy();
        boxElem.trigger( 'likeclose' )
            .off( 'likeopen likeclose likechange likeend likeload liketoStart liketoEnd' );
        
        if( o.wheel ){
            boxElem.wheel( 'off' );
        }
    },
    
    carouselChange : function( o, e ){
        var isNumber = typeof e === 'number',
            data = o.data,
            len = data.length,
            nextIndex;    

        if( index === e ){
            return;
        }
        
        index = isNumber ? e : e.index;
        nextIndex = index + 1;
        
        if( index === len - 1 ){
            boxElem.trigger( 'liketoEnd' );
        }
        
        if( !index ){
            boxElem.trigger( 'liketoStart' );
        }
        
        if( !isNumber ){
            easyLightBox.changeHash( o );
        }
        else{
            o.carousel.change( index );
        }
        
        easyLightBox.loadImg( data[index] );
        pageCurrentElem.text( index + 1 );
        boxElem.trigger( 'likechange', [ index, data ] );
        easyLightBox.setBodyHeight();        
        
        if( data[nextIndex] ){
            imgLoader.src = data[ nextIndex ].src;
        }               
    },
    
    resize : function( o ){
        easyLightBox.layout( o, true );
        easyLightBox.zoom.call( mainImg[0], null, true ); 
    
        o.carousel.destroy();
        delete o.carousel;               

        o.carousel = new $.Carousel( thumbElem, { 
            index : index
        });        
        
        o.carousel.on( 'change', function( e ){
            easyLightBox.carouselChange( o, e ); 
        });        
    },
    
    init : function( o ){
        var data = o.data,
            nextIndex;           
            
        index = ( +o.index );
        nextIndex = index + 1;        
        
        mainImg = $( '<img class="lb_main_img" />' );        
        bodyElem = bodyElem || $( '#lbBody' );
        imgBoxElem = imgBoxElem || $( '#lbImgBox' );               
        btnMainPrev = btnMainPrev || $( '#btnMainPrev' );
        btnMainNext = btnMainNext || $( '#btnMainNext' );
        btnSlide = btnSlide || $( '#btnSlide' );
        loadingElem = loadingElem || $( '#lbLoading' );
        closeElem = closeElem || $( '#lbBtnClose' );
        slideElem = slideElem || $( '#slideElem' );
        thumbElem = thumbElem || $( '#lbCarousel' );
        footerElem = footerElem || $( '#lbFooter' );
        thumbWrapElem = thumbWrapElem || $( '#lbCarouselWrap' );
        thumbListElem = thumbListElem || $( '#lbCarouselList' );
        thumbPrevElem = thumbPrevElem || $( '#lbCarouselPrev' );
        thumbNextElem = thumbNextElem || $( '#lbCarouselNext' );
        pageCurrentElem = pageCurrentElem || $( '#lbPageCurrent' );
        pageNumElem = pageNumElem || $( '#lbPageNum' );
        slideTextElem = slideTextElem || $( '#lbSlideText' );
        
        easyLightBox.createThumb( o );        
        easyLightBox.layout( o );        

        mainImg.on( 'load', function(){
            easyLightBox.zoom.call( this, null, false, !!o.placeholder );
            delete o.placeholder;
        });
        
        imgBoxElem.empty().append( mainImg );
        
        // 如果有占位图，先加载占位图
        if( o.placeholder ){
            placeholderElem = $( '<img src="' + o.placeholder + '" />' )
                .appendTo( imgBoxElem )
                .on( 'load', function(){
                    easyLightBox.zoom.call( this, null, false, true );
                });
        }

        easyLightBox.loadImg( data[index], !!o.placeholder );      

        // 加载下一张图
        if( data[nextIndex] ){
            imgLoader.src = data[ nextIndex ].src;
        }        
        
        pageCurrentElem.text( index + 1 );
        pageNumElem.text( data.length );        
        
        if( o.link ){
            mainImg.css( 'cursor', 'pointer' ).on( 'click', function(){
                var link = mainImg.attr( 'data-link' );
                
                if( link ){
                    window.open( link );
                }
            });
        }
        
        o.carousel = new $.Carousel( thumbElem, {
            index : index
        });        
        
        o.carousel.on( 'change', function( e ){
            easyLightBox.carouselChange( o, e ); 
        });
        
        easyLightBox.changeHash( o );

        btnMainPrev.on( 'click', function( e ){
            easyLightBox.switchHandle( o, true );
            e.preventDefault();
        });
        
        btnMainNext.on( 'click', function( e ){
            easyLightBox.switchHandle( o );
            e.preventDefault();
        });
        
        if( o.wheel ){
            boxElem.wheel( 'on', function( e ){
                if( e.wheelDelta > 0 ){
                    easyLightBox.switchHandle( o, true );
                }
                else{
                    easyLightBox.switchHandle( o );
                }
            });
        }
        
        btnSlide.on( 'click', function( e ){
            var isUp = $( this ).hasClass( 'btn_slide_up' );
            easyLightBox.slideThumb( isUp );
            e.preventDefault();
        });
        
        $doc.on( 'keyup.lightbox', function( e ){
            switch( e.which ){
                case 27 :
                    closeElem.trigger( 'click' );
                break;
                
                case 37 :
                    easyLightBox.switchHandle( o, true );
                break;
                
                case 39 :
                    easyLightBox.switchHandle( o );
                break;
            };
        })
        .on( 'keydown.lightbox', function( e ){
            var which = e.which;
            if( which === 34 || which === 33 || which === 38 || which === 40  ){
                e.preventDefault();
            }        
        });

        $win.on( 'resize.lightbox', easyLightBox.throttle(function(){      
            easyLightBox.resize( o );                           
        }));

        closeElem.one( 'click', function( e ){
            var scrollTop;
            easyLightBox.close( o ); 
            if( o.hash ){
                window.location.hash = '#closelightbox';
            }            
            e.preventDefault();
        });     
        
        if( o.hash && supportHashChange ){
            $win.on( 'hashchange.lightbox', function(){
                var hash = easyLightBox.parseHash();
                
                if( 'lightboxindex' in hash ){
                    easyLightBox.carouselChange( o, (+hash.lightboxindex) );
                }
            });
        }
    }
    
};  

var LightBox = function( target, options ){
    options = options || {};
    var o = $.extend({
        index : 0,
        hash : true,
        data : null,
        overlay : true,
        zIndex : 9999,
        link : true,
        wheel : true,
        init : null,
        placeholder : null
    }, options );
    
    boxElem = boxElem || $( '#lightBox' );
    o.boxElem = boxElem;
    this.__o__ = o;
    easyLightBox.init( o );
};

$.LightBox = LightBox;

LightBox.prototype = {
    
    on : function( type, fn ){
        if( this.__o__ ){
            var self = this;
            this.__o__.boxElem.on( 'like' + type, function( e, index, data, size ){                
                if( index !== undefined ){
                    e.index = index;
                }
                
                if( data ){
                    e.extraData = data;
                }
                
                if( size ){
                    e.size = size;
                    e.target = mainImg[0];
                }
                
                e.type = type;                
                fn.call( self, e );
                e.stopPropagation();
            });            
        }
        
        return this;
    },
    
    un : function( type ){
        if( this.__o__ ){
            this.__o__.boxElem.off( 'like' + type );
        }
        
        return this;
    },
    
    change : function( index ){
        var o = this.__o__;
        easyLightBox.carouselChange( o, index );
        easyLightBox.changeHash( o );
        return this;
    }
    
};

})( jQuery, window );


/*==============================================*/
/*================= 其他交互JS =================*/
/*==============================================*/ 



$(function(){ 
    
    var isHome = !initData;
  
    window.ZT = {
        
        lightBoxVisible : false,
        
        loadCateId : initData && initData.cid,
        
        loadTagId : initData && initData.tid,
        
        parseHash : function( href ){
            href = href || window.location.href;
            
            if( !~href.indexOf('#') || href.slice(-1) === '#' ){
                return;
            }
            
            var hash = href.slice( href.indexOf('#') + 1 ),
                arr = hash.split( '&' ),
                len = arr.length,
                obj = {},
                i = 0,
                item, index;
            
            for( ; i < len; i++ ){
                item = arr[i];
                index = item.indexOf( '=' );
                name = item.slice( 0, index );
                obj[ name ] = item.slice( index + 1 );
            }
            
            return obj;
        }
            
    };
    
    var ZT = window.ZT,
        loadCache = {},
        isNews = ZT.loadCateId > 7,
        body = document.body,
        $win = $( window );
        
    /*==============================================*/
    /*================ 大图浏览相关 ================*/
    /*==============================================*/         
        
    // 构建lightBox的结构    
    var lightBoxElem = $( '<div id="lightBox" class="lightbox">' +
            '<div class="lb_wrapper">' +
                '<div class="lb_header" id="lbHeader">' +
                    '<h3 id="lbTitle" class="lb_title"></h3>' +
                    '<div class="lb_head_left"><a href="#" class="first_link" id="lbSource" target="_blank"></a></div>' +
                    '<div class="lb_head_right"><a href="###" class="lb_btn_close" id="lbBtnClose">关闭</a></div>' +
                '</div>' +
                '<div class="lb_body" id="lbBody">' +
                    '<div class="lb_img_box" id="lbImgBox"></div>' +
                    '<a href="#" class="btn_main_toggle btn_main_prev" id="btnMainPrev" title="上一张"><span>上一张</span></a>' +
                    '<a href="#" class="btn_main_toggle btn_main_next" id="btnMainNext" title="下一张"><span>下一张</span></a>' +
                    '<img src="/static/img/lightbox_loading.gif" class="lb_loading" id="lbLoading" />' +
                '</div>' +   
                '<div class="lb_desc" id="lbDesc"><div class="lb_desc_box"><p id="lbDescCon" class="lb_desc_con"></p></div></div>' + 
                '<div class="lb_footer" id="lbFooter">' +            
                    '<div class="carousel" id="lbCarousel">' +
                        '<a href="#" class="carousel_arrow carousel_prev" id="lbCarouselPrev"><span>上一组</span></a>' +    
                        '<div class="carousel_wrapper" id="lbCarouselWrap">' +
                            '<ul class="carousel_list" id="lbCarouselList"></ul>' +
                        '</div>' +    
                        '<a href="#" class="carousel_arrow carousel_next" id="lbCarouselNext"><span>下一组</span></a>' +    
                    '</div>' +            
                    
                    '<div class="lb_status">' +
                        '<a href="#" class="btn_slide btn_slide_down" id="btnSlide"><b id="lbPageCurrent"></b>/<span id="lbPageNum" class="lb_page_num"></span><span id="lbSlideText">隐藏缩略图</span></a>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' ).appendTo( body ),
        
        lbCloseElem = $( '#lbBtnClose' ),
        lbTitElem = $( '#lbTitle' ),
        lbDescElem = $( '#lbDesc' ),
        lbDescConElem = $( '#lbDescCon' ),
        lbSourceElem = $( '#lbSource' ),
        rHost = /https?\:\/\/([^\/]+)/;
        
    // 加载大图数据
    var getData = function( url ){        
        // 有本地缓存则直接返回本地缓存
        if( loadCache[url] ){
            return loadCache[ url ];
        }
        
        return $.ajax({
            url : url,
            dataType : 'json',
            success : function( data ){
                // 对加载过的数据做本地缓存
                loadCache[ url ] = data;                
            }
        });
    };        
    
    var setBoxInfo = function( e ){    
        var extraData = e.extraData,
            index = e.index,
            otherData = extraData[ index ].otherData,
            srcUrl = otherData.srcUrl,
            matches = srcUrl.match( rHost ),
            srcText = matches ? matches[1] : '';

        lbTitElem.text( otherData.title );
        lbDescConElem.text( otherData.desc );
        lbSourceElem.attr( 'href', srcUrl )
            .attr( 'title', srcUrl )
            .text( '本图集来自 ' + srcText );
    };
    
    var initLightBox = function( data, dataIndex, cateId, placeholder ){
        var lightBoxData = [],
            hash = ZT.parseHash(),                            
            index = ( hash && hash.lightboxindex ) || 0,
            groupTitle = data.group_title,
            srcUrl = data.group_pageurl,
            lightBox;
            
        var dd = function(){
            // pv打点
            monitor.setConf( "wpoUrl", "http://s.360.cn/so/srp.gif" );
            monitor.log({
                group : hash.groupid,
                pro : 'image',
                pid : window.__pid__,
                tp : ZT.loadCateId,
                tag : ZT.loadTagId
            }, 'wpo' );      
        };
            
        $.each( data.list, function( _, item ){
            lightBoxData.push({
                link : item.pic_pageurl,
                src : item.qhimg_url,
                width : item.pic_width,
                height : item.pic_height,
                thumbSrc : item.qhimg_thumb_url,
                thumbWidth : '65',
                thumbHeight : '65',
                otherData : {
                    title : ( item.pic_title || groupTitle ),
                    desc : item.pic_desc,
                    srcUrl : srcUrl
                }
            });
        });
        
        lightBox = new $.LightBox( null, {
            placeholder : placeholder,
            data : lightBoxData,
            index : index,
            init : function( index, data ){
                lbDescElem[ ZT.loadCateId > 7 ? 'show' : 'hide' ]();
            
                setBoxInfo({ 
                    index : index,
                    extraData : data
                });
                
                dd();
            }
        });

        lightBox.on( 'change', setBoxInfo )
            .on( 'change', dd )
            .on( 'end', function(){
                showEndLayer( dataIndex, cateId );
            })
            .on( 'close', function(){
                closeEndLayer();
                ZT.lightBoxVisible = false;
            })
            .on( 'load', function( e ){
                e.target.title = '点击查看源网页';
            });
            
        ZT.lightBoxVisible = true;
        ZT.lightBox = lightBox;
    };
    
    // 显示大图浏览的lightBox
    var showLightBox = ZT.showLightBox = function( groupId, dataIndex, cateId, placeholder ){
        var url = '/zvj?id=' + groupId,
            loadPromise = getData( url );

        if( typeof loadPromise.done === 'function' ){
            loadPromise.done(function( data ){
                initLightBox( data, dataIndex, cateId, placeholder );
            });
        }
        else{
            initLightBox( loadPromise, dataIndex, cateId, placeholder );
        }
    };            

    // 通过url初始化lightBox
    (function(){
        var hash = ZT.parseHash();
        
        if( !hash ){
            return;
        }
        
        if( 'groupid' in hash ){
            ZT.loadCateId = ZT.loadCateId || hash.cid || 1;
            
            setTimeout( function(){
                showLightBox( hash.groupid, hash.dataindex );
            }, 100 );
        }        
    })();
    
    /*==============================================*/
    /*================ 大图推荐相关 ================*/
    /*==============================================*/     
    
    var endLayerElem = $( '<div class="end_layer" id="endLayer">' +
                '<div class="end_overlay"></div>' +         
                '<div class="end_wrapper clearfix">' +
                    '<div class="next_group" id="nextGroup">' +
                        '<a href="#" id="review" class="review">重新浏览</a>' +
                        '<h3>下一图集</h3>' +
                        '<p class="img_box"><a href="#" id="nextGroupImgLink"></a></p>' +
                        '<p><a href="#" id="nextGroupTit">教皇辞职，15万人送行</a></p>' +
                    '</div>' +
                    '<div class="suggest_group">' +
                        '<h3>相关图集推荐</h3>' +
                        '<ul id="suggestGroupList"></ul>' +
                    '</div>' +
                '</div>' +
                '<a href="#" class="btn_group_toggle btn_group_prev" id="btnGroupPrev" title="重新浏览该图集"><span>重新浏览该图集</span></a>' +
                '<a href="#" class="btn_group_toggle btn_group_next" id="btnGroupNext" title="下一图集"><span>下一图集</span></a>' +       
            '</div>' ).appendTo( body ),
            
            suggestGroupList = $( '#suggestGroupList' ),        
            nextGroupImgLink = $( '#nextGroupImgLink' ),
            nextGroupTit = $( '#nextGroupTit' ),
            btnGroupPrev = $( '#btnGroupPrev' ),
            btnGroupNext = $( '#btnGroupNext' ),
            btnMainPrev = $( '#btnMainPrev' ),
            btnMainNext = $( '#btnMainNext' ),
            endLayerVisible = false;    
    
    var throttle = function( fn ){        
        var timer;
        
        return function(){
            var self = this,
                args = arguments;
                
            clearTimeout( timer );
            timer = setTimeout(function(){
                fn.apply( self, args );
            }, 80 );
        };
    };            
    
    var initEndLayer = function( data ){
        var nextData = data.next,
            nextHref = '#groupid=' + nextData.id + '&dataindex=' + nextData.index + '&cid=' + ZT.loadCateId,
            btnHeight = btnMainPrev.height(),
            html = '';                    
            
        nextGroupImgLink.attr( 'href', nextHref )
            .html( '<img src="' + nextData.qhimg_thumb_url + '" width="' + nextData.qhimg_width + '" height=315" />' );
            
        nextGroupTit.attr( 'href', nextHref )
            .text( nextData.group_title );
        
        $.each( data.rec, function( _, data ){
            html += '<li><p class="img_box">' +
                '<a href="#groupid=' + data.id + '&dataindex=' + data.index + '&cid=' + ZT.loadCateId + '">' +
                '<img src="' + data.qhimg_thumb_url + '" width="' + data.qhimg_width + '" height="124" /></a></p><p>' +
                '<a href="#groupid=' + data.id + '&dataindex=' + data.index + '&cid=' + ZT.loadCateId + '">' + data.group_title + '</a></p></li>';
        });
        
        suggestGroupList.html( html );
    
        endLayerElem.css({
            width : lightBoxElem.outerWidth() + 'px',
            height : lightBoxElem.outerHeight() - 35 + 'px',
            top : parseInt( lightBoxElem.css('top') ) + 35 + 'px',
            left : lightBoxElem.css( 'left' ) + 'px',
            display : 'block'
        });    
        
        btnGroupPrev.css( 'height', btnHeight + 'px' );
        btnGroupNext.css( 'height', btnHeight + 'px' ).attr( 'href', nextHref );
        
        $win.on( 'resize.endlayer', throttle(function(){
            var btnHeight = btnMainPrev.height();
            
            endLayerElem.css({
                width : lightBoxElem.outerWidth() + 'px',
                height : lightBoxElem.outerHeight() - 35 + 'px'
            });  

            btnGroupPrev.css( 'height', btnHeight + 'px' );
            btnGroupNext.css( 'height', btnHeight + 'px' );            
        }));  
    };
    
    // 显示大图推荐
    var showEndLayer = function( index, cateId ){
        // 防止鼠标滚轮过快或者点击过快的误触发
        if( endLayerVisible ){
            return;
        }
    
        endLayerVisible = true;
        
        var type = !ZT.loadTagId ? 'cate' : 'tag',
            id = cateId || ZT.loadTagId || ZT.loadCateId,
            url = '/zrec?type=' + type + '&id=' + id + '&n=' + index,
            loadPromise = getData( url );

        if( typeof loadPromise.done === 'function' ){
            loadPromise.done( initEndLayer );            
        }
        else{
            initEndLayer( loadPromise );
        }
    };
    
    // 大图推荐绑定关闭事件
    $( '#review,#btnGroupPrev' ).on( 'click', function( e ){
        closeEndLayer();
        ZT.lightBox.change( 0 );
        e.preventDefault();
    });
    
    // 通过大图推荐来显示大图浏览的lightBox
    endLayerElem.on( 'click', 'a', function(){
        var hash = ZT.parseHash( this.href ),
            placeholder = $( this ).find( 'img' ).attr( 'src' );

        if( hash && 'groupid' in hash ){
            lbCloseElem.trigger( 'click' );
            showLightBox( hash.groupid, hash.dataindex, null, placeholder );
        }        
    });  
    
    var closeEndLayer = function(){
        endLayerVisible = false;
        endLayerElem.hide();
        $win.off( 'resize.endlayer' );
    };

    // !!!首页不执行下面的JS
    if( isHome ){
        return;
    }
    
    
    /*==============================================*/
    /*================== 导航滑动 ==================*/
    /*==============================================*/     

    var mainNav = $( '#mainNav' ),
        navSlider = mainNav.find( 'li.slide_bg' ),
        navLink = mainNav.children( 'li' ).find( 'a' ),
        currentElem = mainNav.children( 'li.current' ).find( 'a' ),      
        currentLeft = currentElem.offset().left,
        sliderLeft = parseInt( navSlider.css('left') ),
        navLeft = mainNav.offset().left,
        navTimer, currentLeft;
        
    if( isNews ){
        navSlider.css({
            left : currentLeft - navLeft + 'px', 
            display : 'block'
        }); 
    }
        
    $.easing.backOut = function(t){
        return (t -= 1) * t * ((1.70158 + 1) * t + 1.70158) + 1;
    };
    
    navLink.on( 'mouseover', function(){            
            var elem = $( this );
            navLeft = mainNav.offset().left;
            navSlider.animate({
                left : elem.offset().left - navLeft + 'px'
            }, 600, 'backOut' );
        })
        .on( 'mouseout', function(){
            navSlider.stop( true, true );
        });

    mainNav.on( 'mouseleave', function(){            
        navSlider.animate({
            left : currentElem.offset().left - navLeft + 'px'
        }, 300 );    
    });
    
    if( !isNews ){
        $( window ).on( 'resize', function(){
            navLeft = mainNav.offset().left;
        });
    }

    
    // 返回顶部    
    var goTop = $( '#goTop' );
        
    if( !goTop.length ){
        goTop = $( '<div title="返回顶部" class="go_top" id="goTop"></div>' ).appendTo( body );
    }
    
    $win.on( 'scroll', function(){
        var scrollTop = $win.scrollTop();
        
        if( scrollTop > 1000 ){
            goTop.show();
        }
        else{
            goTop.stop( true, true );
            goTop.hide();
        }
    });
    
    goTop.on( 'mouseover', function(){
            goTop.animate({ opacity : '1' }, 200 );
        })
        .on( 'mouseout', function(){
            goTop.animate({ opacity : '0.5' }, 200 );
        })
        .on( 'click', function(){
            goTop.hide();
            $win.scrollTop( 0 );
        });    
});