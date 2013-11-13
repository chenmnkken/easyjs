define(['../../carousel/js/carousel', '../../drag/js/drag'], function(){

'use strict';

var defaults = {
    cookieHost : window.location.hostname,
    footerVisible : false,
    placeholder : false,
    trigger : 'click',
    cookiePath : '/',    
    minWidth : 1000,
    minHeight : 500,    
    repeat : false,
    zIndex : 9999,
    thumb : false,
    wheel : true,
    hash : false,
    zoom : true,
    index : 0    
};

var ROUND = Math.round,
    FLOOR = Math.floor,
    ABS = Math.abs,
    keyMap = [ 33, 34, 38, 40 ],
    isIE6 = E.browser.ie && E.browser.version === '6.0',
    rHash = /[#&]lightboxindex=\d+/,
    doc = window.document,
    docElem = doc.documentElement,
    $win = E( window ),
    $doc = E( doc ), 
    $body = E( doc.body ),
    $docElem = E( docElem ),
    documentMode = doc.documentMode,
    supportHashChange = ( 'onhashchange' in window ) && ( documentMode === undefined || documentMode > 7 ),
    imgLoader = new Image(),
    isInitHash = false,
    sizeCache = {},    
    imgMap = {},    
    overlayElem, boxElem, wrapElem, closeElem, bodyElem, imgboxElem, loadingElem, prevElem, nextElem, footerElem, mainImg, placeholderImg, navImg, zoomElem,
    thumbWrapElem, thumbListElem, thumbToggleElem, thumbElem, navElem, navboxElem, navmaskElem, pagecurrentElem, pagetotalElem,
    bodyWidth, bodyHeight, index, nextIndex, winWidth, winHeight, itemWidth, footerHeight, navWidth, navHeight, mainDrag, navDrag;

var easyLightBox = {

    throttle : function( fn ){        
        var timer;
        
        return function(){
            var self = this,
                args = arguments;

            clearTimeout( timer );

            timer = setTimeout(function(){
                fn.apply( self, args );
            }, 200 );
        };
    },

    // 防止IE6的select穿透
    appendIframe : function( elem ){
        var html = '<iframe class="eui_bg_iframe" frameborder="0" tabindex="-1" src="javascript:false;"' +
                        ' style="position:absolute;left:0;top:0;width:100%;height:100%;z-index:-1;border:0 none;filter:alpha(opacity=0)"/>',
			iframe;
        
        if( !elem.children('iframe.eui_bg_iframe').length ){
			iframe = E( html, doc );
            elem.prepend( iframe );			
        }
	},  

    createOverlay : function( zIndex ){
        if( !overlayElem ){
            overlayElem = E( '#euiLightBoxOverlay' );
            
            if( overlayElem.length ){
                return;
            }
            
			var html = '<div class="eui_lightbox_overlay" ' +
                'style="margin:0;padding:0;display:none;position:fixed;top:0;left:0;width:100%;height:100%;' + 
                'z-index:' + zIndex + '"/>';

			overlayElem = E( html, doc ).appendTo( $body );
				
            if( isIE6 ){             
                overlayElem.css( 'position', 'absolute' );
                easyLightBox.appendIframe( overlayElem );                  
            }            
        }
    },

    createBox : function( o, zIndex ){
        if( !boxElem ){
            boxElem = E( '#euiLightBox' );
            
            if( !boxElem.length ){            
                var html = '<div class="eui_lightbox" style="margin:0;padding:0;display:none;position:fixed;top:0;left:0;z-index:' + zIndex + '">' + 
                    '<div class="lb_wrapper">' + 
                        '<a href="#closelightbox" class="lb_close"></a>' +
                        '<div class="lb_body">' +
                            '<div class="lb_imgbox">' +
                                '<div class="lb_navigator"><div class="lb_navbox"><div class="lb_navmask"><div></div></div></div></div>' + 
                            '</div>' +
                            '<a class="lb_toggle lb_prev" href="#"><span>上一张</span></a>' +
                            '<a class="lb_toggle lb_next" href="#"><span>下一张</span></a>' +
                            '<div class="lb_loading"></div>' +
                        '</div>' +
                        '<div class="lb_toolbar">' + 
                            '<ul class="lb_toolbarlist">' +
                                '<li><span class="lb_pageation"><b class="lb_page_current">2</b>/<span class="lb_page_total">7</span></span></li>' +
                                '<li><span class="lb_thumb_toggle lb_thumb_toggle_up">显示缩略图</span></li>' +
                                '<li><span class="lb_zoom lb_zoomin lb_zoom_disable"></span></li>' +
                            '</ul>' +
                        '</div>' +
                        '<div class="lb_footer"></div>' +
                    '</div>' +
                '</div>';
                
                boxElem = E( html, doc );
                $body.append( boxElem );
                
                if( isIE6 ){
                    boxElem.css( 'position', 'absolute' );            
                }
            }
            else{
                boxElem[0].style.cssText = 'margin:0;padding:0;display:none;position:' + ( isIE6 ? 'absolute' : 'fixed' ) + ';top:0;left:0;z-index:' + zIndex + ';';
            }
        }
        
        if( !wrapElem ){
            easyLightBox.initDom();
            easyLightBox.initEvent( o );
        }
    },
    
    createThumb : function( o ){
        if( o.thumb ){
            if( !thumbElem ){
                var html = '<div class="carousel">' +
                        '<a class="carousel_arrow carousel_prev" href="#"><span>上一组</span></a>' +
                        '<div class="carousel_wrapper">' +
                            '<ul class="carousel_list"></ul>' +
                        '</div>' +    
                        '<a class="carousel_arrow carousel_next" href="#"><span>下一组</span></a>' +
                    '</div>'; 
                
                thumbElem = E( html, doc ).appendTo( footerElem );
                thumbWrapElem = thumbElem.find( 'div.carousel_wrapper' );
                thumbListElem = thumbElem.find( 'ul.carousel_list' );
            }
            
            easyLightBox.createThumbList( o );
        }
        else{
            if( thumbElem && thumbElem.length ){
                thumElem.remove();
            }
        }
    },
    
    createThumbList : function( o ){
        var html = '';
            
        o.data.forEach(function( item ){
            html += '<li><img src="'  + item.thumbSrc + '" width="' + item.thumbWidth + '" height="' + item.thumbHeight + '" />';
        });
        
        thumbListElem.html( html );
        easyLightBox.layoutThumb( o );
    }, 

    // 对缩略图列表进行计算布局
    layoutThumb : function( o ){
        var thumbWrapWidth = bodyWidth - 100,
            thumbSpace = thumbSpace || E( 'a.carousel_prev', thumbElem ).outerWidth() * 2 + parseInt( thumbWrapElem.css('marginLeft') ) + parseInt( thumbWrapElem.css('marginRight') ),
            thumbListWidth;
            
        itemWidth = thumbListElem.children( 'li' ).outerWidth();
        thumbListWidth = itemWidth * o.data.length;
            
        if( thumbListWidth + thumbSpace > thumbWrapWidth ){
            thumbWrapWidth = thumbWrapWidth - ( (thumbWrapWidth - thumbSpace) % itemWidth ) - thumbSpace;
        }
        else{
            thumbWrapWidth = thumbListWidth;
        }    
        
        thumbListElem.css( 'width', thumbListWidth + 'px' );
        thumbWrapElem.css( 'width', thumbWrapWidth + 'px' );     
        
        if( o.carousel ){
            o.carousel.destroy();
            delete o.carousel;   
        }

        // 实例化carousel组件
        o.carousel = new E.ui.Carousel( thumbElem, {
            index : index
        });          
        
        o.carousel.on( 'change', function( e ){
            easyLightBox.switchTransport( o, null, e.index );
        });
    },

    // 缩略图的滑动效果
    slideThumb : function( o, isUp ){
        var oldClassName, newClassName, text, isVisible;
            
        if( isUp ){
            bodyHeight -= footerHeight;
            oldClassName = 'lb_thumb_toggle_up';
            newClassName = 'lb_thumb_toggle_down';
            text = '隐藏缩略图';                 
            isVisible = 1;
        }
        else{
            bodyHeight += footerHeight;
            oldClassName = 'lb_thumb_toggle_down';
            newClassName = 'lb_thumb_toggle_up';
            text = '显示缩略图';            
            isVisible = 0;
        }
        
        bodyElem.anim({
            to : { height : bodyHeight + 'px' },
            duration : 300,
            easing : 'easeIn',
            complete : function(){
                var date = new Date(),
                    btnHeight;
                
                if( mainDrag ){
                    zoomElem.fire( 'click' );
                }
                else{
                    easyLightBox.zoomOut( null, true );  
                }
                date.setTime( date.getTime() + 2289600000 );

                // IE6重新计算翻页按钮的高度
                if( isIE6 ){
                    btnHeight = parseInt( bodyHeight * 0.8 ) + 'px';
                    prevElem.css( 'height', btnHeight );
                    nextElem.css( 'height', btnHeight );
                }    
            
                thumbToggleElem.text( text )
                    .removeClass( oldClassName )
                    .addClass( newClassName );

                // 显示/隐藏缩略图的状态记录到cookie中
                doc.cookie = 'lightbox_thumb_visible' + '=' + isVisible + '; expires=' + date.toGMTString() + '; path=' + o.cookiePath + '; domain=' + o.cookieHost;
                o.footerVisible = !!isVisible;
            }
        });
    },
    
    initDom : function(){    
        wrapElem = boxElem.find( 'div.lb_wrapper' );
        closeElem = boxElem.find( 'a.lb_close' );
        bodyElem = boxElem.find( 'div.lb_body' );
        footerElem = boxElem.find( 'div.lb_footer' );
        imgboxElem = bodyElem.find( 'div.lb_imgbox' );
        loadingElem = bodyElem.find( 'div.lb_loading' );
        prevElem = bodyElem.find( '.lb_prev' );
        nextElem = bodyElem.find( '.lb_next' );
        zoomElem = boxElem.find( '.lb_zoom' );
        pagecurrentElem = boxElem.find( '.lb_page_current' );
        pagetotalElem = boxElem.find( '.lb_page_total' );
        navElem = imgboxElem.find( 'div.lb_navigator' );
        navmaskElem = imgboxElem.find( 'div.lb_navmask' );
        navboxElem = imgboxElem.find( 'div.lb_navbox' );

        navWidth = navElem.width();
        navHeight = navElem.height();
    },
    
    initEvent : function( o ){            
        // 向上翻页按钮绑定事件
        prevElem.on( 'click', function( e ){
            if( !prevElem.hasClass('lb_toggle_disable') ){
                easyLightBox.switchTransport( o, true );
            }
            e.preventDefault();
        });
        
        // 向下翻页按钮绑定事件
        nextElem.on( 'click', function( e ){
            if( !nextElem.hasClass('lb_toggle_disable') ){
                easyLightBox.switchTransport( o, false );
            }
            e.preventDefault();
        });
        
        // 关闭按钮的事件
        closeElem.on( 'click', function(e){
            easyLightBox.close( o );
            e.preventDefault();            
        });
        
        if( o.zoom ){
            zoomElem.on( 'click', easyLightBox.zoomIn );
        }
    },
    
    initFooter : function( o ){
        var cookie = doc.cookie,
            cookieName = 'lightbox_thumb_visible=',
            startIndex = cookie.indexOf( cookieName ),
            endIndex = cookie.indexOf( ';', startIndex ),                
            cookieVal;         

        footerElem.css( 'display', 'block' );
        footerHeight = footerElem.outerHeight();    

        // endIndex可能是在末尾
        if( !~endIndex ){
            endIndex = cookie.length;
        }    
        
        // 根据cookie记录来判断是否显示/隐藏底部缩略图
        if( ~startIndex ){
            cookieVal = cookie.slice( startIndex + cookieName.length, endIndex );
            o.footerVisible = !!parseInt( cookieVal );
        }         

        thumbToggleElem = boxElem.find( 'span.lb_thumb_toggle' )    
            .css( 'display', 'block' )
            .on( 'click', function(){
                var isUp = E( this ).hasClass( 'lb_thumb_toggle_up' );
                easyLightBox.slideThumb( o, isUp );
            });  
        
        if( o.footerVisible ){
            thumbToggleElem.text( '隐藏缩略图' )
                .removeClass( 'lb_thumb_toggle_up' )
                .addClass( 'lb_thumb_toggle_down' );
        }
    },

    // 对放大时的导航器进行计算布局
    layoutNav : function(){    
        if( !navImg ){
            navImg = E( new Image() ).appendTo( navboxElem ); 
        }
        
        var imgWidth = sizeCache.originalWidth,
            imgHeight = sizeCache.originalHeight,
            maskWidth = bodyWidth,
            maskHeight = bodyHeight,
            top = ABS( parseInt(mainImg.css('top')) ),
            left = ABS( parseInt(mainImg.css('left')) ),
            scale;

        // 宽度超出
        if( imgWidth > navWidth ){
            scale = navWidth / imgWidth;
            imgWidth = navWidth;
            imgHeight = ROUND( imgHeight * scale );  
        }
        
        // 高度超出
        if( imgHeight > navHeight ){
            scale = navHeight / imgHeight; 
            imgHeight = navHeight;    
            imgWidth = ROUND( imgWidth * scale );                
        }
        
        // 计算导航框的尺寸和位置
        maskWidth = ROUND( maskWidth * scale );
        maskHeight = ROUND( maskHeight * scale );
        top = ROUND( top * scale );
        left = ROUND( left * scale );

        // 导航框的尺寸要减去边框
        maskWidth -= ( parseInt(navmaskElem.css('borderLeftWidth')) + parseInt(navmaskElem.css('borderRightWidth')) );
        maskHeight -= ( parseInt(navmaskElem.css('borderTopWidth')) + parseInt(navmaskElem.css('borderBottomWidth')) );
        
        // 设置导航框外部容器的尺寸以及垂直居中
        navboxElem.css({
            width : imgWidth + 'px',
            height : imgHeight + 'px',
            marginTop : ( 0 - imgHeight / 2 ) + 'px',
            marginLeft : ( 0 - imgWidth / 2 ) + 'px'
        });

        // 设置导航框的尺寸和位置
        navmaskElem.css({
            width : maskWidth + 'px',
            height : maskHeight + 'px',
            top : top + 'px',
            left : left + 'px'
        });
        
        // 设置导航图片的尺寸
        navImg.css({
            width : imgWidth + 'px',
            height : imgHeight + 'px'
        });

        // 导航图直接用大图缩小
        navImg[0].src = mainImg[0].src;
        navElem.show();
        
        // 对大图进行拖拽时同时联动导航框
        mainDrag.on( 'drag', function(){
            navmaskElem.css({
                top : FLOOR( ABS( parseInt(mainImg.css('top')) ) * scale ) + 'px',
                left : FLOOR( ABS( parseInt(mainImg.css('left')) ) * scale ) + 'px'
            });
        });
        
        // 导航框绑定拖拽
        navDrag = new E.ui.Drag( navmaskElem, {
            container : navboxElem
        });
        
        // 对导航框进行拖拽时同时联动大图
        navDrag.on( 'drag', function(){
            var top = 0 - ROUND( navDrag.top / scale ),
                left = 0 - ROUND( navDrag.left / scale );
                
            easyLightBox.dragHandle( mainImg[0].style, top, left );
        });
    },
    
    // 切换hash
    changeHash : function( o ){
        var hash = '#lightboxindex=' + index,
            name, returnVal;

        if( o.changeHash ){
            returnVal = o.changeHash( o.data[index] );
            for( name in returnVal ){
                hash += '&' + name + '=' + returnVal[ name ];
            }
        }
        
        window.location.hash = hash;
    },    
    
    unDrag : function(){
        if( mainDrag ){
            mainDrag.destroy();
            mainDrag = null;
        }
        
        if( navDrag ){
            navDrag.destroy();
            navDrag = null;
        }
        
        navElem.hide();
    },
    
    switchHandle : function( o, currentIndex ){
        var data = o.data,
            len = data.length;
            
        if( !o.repeat ){
            if( !index ){
                prevElem.addClass( 'lb_toggle_disable' );
                nextElem.removeClass( 'lb_toggle_disable' );
            }
            // 切换至最后一张添加disable的className
            else if( index === len - 1 ){
                if( !o.isFireEnd ){
                    nextElem.addClass( 'lb_toggle_disable' );
                    prevElem.removeClass( 'lb_toggle_disable' );
                }
            }
            else{
                nextElem.removeClass( 'lb_toggle_disable' );
                prevElem.removeClass( 'lb_toggle_disable' );                
            }
        }
        
        if( o.thumb && currentIndex === undefined ){
            o.carousel.change( index );
        }        

        if( o.zoom ){
            zoomElem[0].className = 'lb_zoom lb_zoomin lb_zoom_disable';
        }

        easyLightBox.loadImg( o );        
        pagecurrentElem.text( index + 1 );
        o.target.fire( 'likechange', { index : index, data : data[index] } );
    },
    
    switchTransport : function( o, isPrev, currentIndex ){
        var data = o.data,
            len = data.length;
 
        if( currentIndex === index ){
            return;
        }
        
        if( E.isNumber(currentIndex) ){
            index = currentIndex;
            nextIndex = index + 1;
        }
        
        if( E.isBoolean(isPrev) ){
            if( isPrev ){
                index -= 1;
                nextIndex = index - 1;
            }
            else{
                index += 1;
                nextIndex = index + 1;
            }    
        }

        // 重复切换
        if( o.repeat ){            
            index = index === len ? 0 : 
                !~index ? len - 1 :
                index;
        }
        // 不重复切换
        else{
            if( index < 0 ){
                index = 0;
                return;
            }
            
            if( index === len ){
                index--;
                o.target.fire( 'likeend' );
                return;                          
            }
        }

        // 在开启了hash支持的情况下如果浏览器支持hashchange(IE6-7不支持)
        // 则利用hash去切换
        if( o.hash ){
            if( !supportHashChange ){
                easyLightBox.switchHandle( o, currentIndex );
            }
            easyLightBox.changeHash( o );
        }
        else{
            easyLightBox.switchHandle( o, currentIndex );
        }
    },
    
    // 拖拽时限制其范围
    dragHandle : function( dragStyle, top, left ){     
        var widthDiff = bodyWidth - sizeCache.originalWidth,
            heightDiff = bodyHeight - sizeCache.originalHeight;
            
        top = top > 0 ? 0 :
            top < heightDiff ? heightDiff :
            top;
            
        left = left > 0 ? 0 :
            left < widthDiff ? widthDiff :
            left;
            
        dragStyle.top = top + 'px';
        dragStyle.left = left + 'px';
    },
    
    zoomIn : function( e ){
        var isZoomIn, originalWidth, originalHeight, top, left, oldClassName, newClassName;
        
        if( zoomElem.hasClass('lb_zoom_disable') ){
            return;
        }
            
        isZoomIn = zoomElem.hasClass( 'lb_zoomin' );    
            
        // 放大    
        if( isZoomIn ){
            originalWidth = sizeCache.originalWidth;
            originalHeight = sizeCache.originalHeight;            
            left = FLOOR( (bodyWidth - originalWidth) / 2 );
            top = FLOOR( (bodyHeight - originalHeight) / 2 );

            imgboxElem.css({
                width : bodyWidth + 'px',
                height : bodyHeight + 'px',
                top : '0px',
                left : '0px',
                marginLeft : '0px',
                marginTop : '0px'
            });

            mainImg.css({
                width : originalWidth + 'px',
                height : originalHeight + 'px',
                top : top + 'px',
                left : left + 'px'
            });

            mainDrag = new E.ui.Drag( mainImg );       

            mainDrag.on( 'drag', function( e ){
                easyLightBox.dragHandle( e.drag.style, mainDrag.top, mainDrag.left ); 
            });
            
            oldClassName = 'lb_zoomin';
            newClassName = 'lb_zoomout';
            easyLightBox.layoutNav();
        }
        // 缩小
        else{
            if( mainImg.is(':animated') ){
                mainImg.stop( true, true );
            }
            
            easyLightBox.zoomOut( null, true );
            oldClassName = 'lb_zoomout';
            newClassName = 'lb_zoomin';            
        }
        
        zoomElem.removeClass( oldClassName ).addClass( newClassName );
        e.preventDefault();
    },
    
    zoomOut : function( e, nonLoad, thumbSrc ){
        var width = sizeCache.originalWidth,
            height = sizeCache.originalHeight,           
            scale; 
        
        easyLightBox.unDrag();

        if( !width ){
            width = sizeCache.originalWidth = mainImg[0].width;
            height = sizeCache.originalHeight = mainImg[0].height;      
        }
      
        // 宽度超出
        if( width > bodyWidth ){
            scale = bodyWidth / width;
            width = bodyWidth;
            height = FLOOR( height * scale );  
        }
        
        // 高度超出
        if( height > bodyHeight ){
            scale = bodyHeight / height; 
            height = bodyHeight;    
            width = FLOOR( width * scale );                       
        }      

        imgboxElem.css({
            top : '50%',
            left : '50%',
            marginTop : 0 - height / 2 + 'px',
            marginLeft : 0 - width / 2 + 'px',
            width : width + 'px',
            height : height + 'px'                 
        });        
        
        // 如果有缩略图先将缩略图作为占位图
        if( thumbSrc ){
            if( !placeholderImg ){
                placeholderImg = E( new Image() )
                    .addClass( 'lb_placeholderimg' )
                    .appendTo( imgboxElem );
            }

            placeholderImg.css({
                width : width + 'px',
                height : height + 'px',
                display : 'block'
            });          

            placeholderImg[0].src = thumbSrc;
        }

        mainImg.css({
            width : width + 'px',
            height : height + 'px',
            top : '0px',
            left : '0px'
        });
        
        // 只有在图片加载完毕才会用动画效果来显示
        if( !nonLoad ){
            mainImg.css({
                    visibility : 'visible', 
                    display : 'none'
                })
                .fadeIn( 200 );

            // 根据是否缩放来显示放大按钮
            if( o.zoom && scale !== undefined ){
                zoomElem.removeClass( 'lb_zoom_disable' );   
            }                
        }
    },
    
    loadImg : function( o ){
        var data = o.data[ index ],
            nextData = o.data[ nextIndex ],
            src, nextSrc, newImg;
        
        if( !data || !data.src ){
            return;
        }  
        
        sizeCache = {
            originalWidth : data.width,
            originalHeight : data.height
        };

        if( !mainImg ){
            mainImg = E( new Image() ).appendTo( imgboxElem );
        }
        else{
            if( mainImg.is(':animated') ){
                mainImg.stop( true, true );
            }      
            
            // 每次都新创建一个图片替换掉原图片
            // 防止在老版本的IE中在onload时会取原图片的尺寸    
            newImg = new Image();
            mainImg.replace( newImg );
            mainImg = E( newImg );
        }        
        
        mainImg.addClass( 'lb_mainimg' );  
        
        // 如果数据中包含了尺寸信息将提前计算好图片适应窗口的尺寸
        if( o.isFixedSize ){
            easyLightBox.zoomOut( null, true, o.placeholder && data.thumbSrc );
            mainImg.one( 'load', function(){
                var width, height;
                
                if( o.placeholder && data.thumbSrc && placeholderImg ){
                    placeholderImg.hide();
                }
                
                if( o.zoom && sizeCache.originalWidth ){
                    width = parseInt( mainImg[0].style.width );
                    height = parseInt( mainImg[0].style.height );
                    
                    if( sizeCache.originalWidth > width || sizeCache.originalHeight > height ){
                        zoomElem.removeClass( 'lb_zoom_disable' );                        
                    }
                }
            });
        }
        // 数据中没有尺寸信息只能等到图片加载完才计算图片适应窗口的尺寸
        else{
            mainImg.css( 'visibility', 'hidden' )        
                .one( 'load', easyLightBox.zoom );        
        }
        
        src = data.src;
        mainImg[0].src = src;
        imgMap[ src ] = true;        
        
        // 预加载下一张图
        if( nextData ){
            nextSrc = nextData.src;
            
            if( !imgMap[nextSrc] ){
                imgLoader.src = nextData.src;
                imgMap[ nextSrc ] = true;
            }
        }
    },
    
    // 设置lightbox的body的尺寸
    setBodyHeight : function( o ){
        var children = wrapElem.children( 'div' ),
            siblings = wrapElem.siblings(),
            width = winWidth,
            height = winHeight,
            btnHeight;
            
        wrapElem.siblings().forEach(function(){
            width -= E( this ).outerWidth();
        });
        
        children.forEach(function(){
            var elem = E( this );
            
            if( !elem.hasClass('lb_body') && 
                elem.is(':visible') && 
                ( !elem.hasClass('lb_footer') || o.footerVisible )
                ){
                height -= elem.outerHeight();
            }
        });

        bodyWidth = width;
        bodyHeight = height;
        wrapElem.css( 'width', width + 'px' );
        bodyElem.css( 'height', height + 'px' );        

        if( isIE6 ){
            btnHeight = parseInt( height * 0.8 ) + 'px';
            prevElem.css( 'height', btnHeight );
            nextElem.css( 'height', btnHeight );
        }
    },
    
    setPosition : function( o ){
        winWidth = Math.max( $win.width(), o.minWidth );
        winHeight = Math.max( $win.height(), o.minHeight );

        boxElem.css({
            width : winWidth + 'px',
            height : winHeight + 'px'
        });
        
        easyLightBox.bindExpression();
    },
    
    bindExpression : function(){
        if( isIE6 ){
            if( docElem.currentStyle.backgfloorAttachment !== 'fixed' ){
                docElem.style.backgfloorImage = 'url(about:blank)';
                docElem.style.backgfloorAttachment = 'fixed';
            }

            boxElem[0].style.setExpression( 'top', 'fuckIE6=document.documentElement.scrollTop+"px"' );
        }
    },    
    
    close : function( o ){
        overlayElem.hide();
        boxElem.hide();
        
        // 恢复页面滚动条
        $docElem.css({
            width : '',
            height : '',
            overflow : '' 
        });
        
        o.target.fire( 'likeclose' );
        
        if( o.thumb ){
            thumbToggleElem.un( 'click' );
        }
        
        $doc.un( 'keyup.lightbox keydown.lightbox' );
        $win.un( 'resize.lightbox' );

        if( o.wheel ){
            boxElem.un( 'mousewheel' );
        }        
        
        if( o.hash ){
            $win.un( 'hashchange' );
            window.location.hash = 'closelightbox';
        }
        
        // 还原IE6模拟fixed效果修改的样式
        if( isIE6 ){
            boxElem[0].style.removeExpression( 'top' );
            docElem.style.backgfloorImage = '';
			docElem.style.backgfloorAttachment = '';
        }

        easyLightBox.unDrag();
    },  
    
    showError : function(){
        console.log( 'error' );
    },
    
    loadDone : function( o ){
        var data = o.data;
        
        o.isFixedSize = !!( data[0].width && data[0].height );            
        // 根据数据中是否包含尺寸信息来确定是否显示loading图片
        loadingElem[ o.isFixedSize ? 'hide' : 'show' ]();        
        easyLightBox.loadImg( o );

        // 如果只有一张图将为nextElem添加disable的className                                
        if( !o.repeat && data.length > 1 ){
            nextElem.removeClass( 'lb_toggle_disable' );
        }
        
        // 初始化缩略图
        if( !data[0].thumbSrc ){
            o.thumb = false;
        }    
        
        easyLightBox.createThumb( o );
        easyLightBox.bindKeyPress( o );
        
        if( o.wheel ){
            boxElem.on( 'mousewheel', easyLightBox.throttle(function( e ){
                easyLightBox.switchTransport( o, e.wheelDelta > 0 );
            }));
        }
        
        if( o.hash ){
            isInitHash = true;
            easyLightBox.changeHash( o );        
            easyLightBox.bindHashChange( o );
        }
        
        pagetotalElem.text( data.length );
    },
    
    bindHashChange : function( o ){
        $win.on( 'hashchange', function(){
            if( isInitHash ){
                isInitHash = false;
                return;
            }

            var hash = window.location.hash,
                startIndex = hash.indexOf( 'lightboxindex=' ) + 14,
                endIndex = hash.indexOf( '&', startIndex );
            
            if( !~endIndex ){
                endIndex = hash.length;
            }
            
            index = parseInt( hash.slice(startIndex, endIndex) );         
            
            if( isNaN(index) ){
                easyLightBox.close( o );
            }
     
            easyLightBox.switchHandle( o );
        });        
    },
    
    bindKeyPress : function( o ){
        $doc.on( 'keyup.lightbox', function( e ){
            switch( e.which ){
                case 27 :
                    closeElem.fire( 'click' );
                break;
                
                case 37 :
                    easyLightBox.switchTransport( o, true );
                break;
                
                case 39 :
                    easyLightBox.switchTransport( o, false );
                break;
            };
        })
        .on( 'keydown.lightbox', function( e ){
            if( ~keyMap.indexOf(e.which) ){
                e.preventDefault();
            }        
        });           
    },
    
    bindResize : function( o ){        
        $win.on( 'resize.lightbox', function(){        
            if( isIE6 ){
                boxElem[0].style.removeExpression( 'top' );
            
                // 先将遮罩层的宽高设置成100%，可隐藏由于自身宽高超出窗口而产生的滚动条
                overlayElem.css({
                    width : '100%',
                    height : '100%'
                });   
                
                // 然后再将遮罩层的宽高设置成整个页面的宽高
                overlayElem.css({
                    width : $doc.width() + 'px',
                    height : $doc.height() + 'px'
                });  
            }        
            
            var bakWidth = winWidth;
        
            easyLightBox.setPosition( o );
            easyLightBox.setBodyHeight( o );  
            
            if( mainDrag ){
                zoomElem.fire( 'click' );
            }
            else{
                easyLightBox.zoomOut( null, true );  
            }
            
            // 只有当resize的窗口宽度的改变
            // 大于1个缩略图的宽度才会重新初始化carousel组件
            if( ABS(winWidth - bakWidth) > itemWidth ){
                easyLightBox.layoutThumb( o );
            }
        });    
    },
    
    init : function( o ){
        var data = o.data;
        
        index = ( +o.index );
        nextIndex = index + 1;

        // 隐藏页面滚动条
        $docElem.css({
            width : '100%',
            height : '100%',
            overflow : 'hidden' 
        });
        
        easyLightBox.createOverlay( o.zIndex );	
        easyLightBox.createBox( o, o.zIndex + 1 );
        
        if( !o.repeat ){
            prevElem.addClass( 'lb_toggle_disable' );
            nextElem.addClass( 'lb_toggle_disable' );
            
            if( index ){
                prevElem.removeClass( 'lb_toggle_disable' );
            }
        }
        
        // ie6不对遮罩层进行固定定位
        if( isIE6 ){
            overlayElem.css({
                width : $doc.width() + 'px',
                height : $doc.height() + 'px'
            });             
        }
        
        overlayElem.show();
        boxElem.show();
        
        if( o.thumb ){
            easyLightBox.initFooter( o ); 
        }
        else{
            footerElem.css( 'display', 'none' );
        }
        
        easyLightBox.setPosition( o );         
        easyLightBox.setBodyHeight( o );        
        
        // 静态数据
        if( E.isArray(data) ){
            easyLightBox.loadDone( o );
        }
        // 动态数据会返回一个promise实例
        else if( E.isFunction(data) ){
            data().then(function( data ){
                o.data = data;
                easyLightBox.loadDone( o );
            });
        }
        else{
            easyLightBox.showError();
        }
        
        easyLightBox.bindResize( o );
        
        if( o.zoom ){
            zoomElem.css( 'display', 'block' );
        }
        
        pagecurrentElem.text( index + 1 );
    },
    
    reload : function( o ){
        var data = o.data;
        
        o.isFixedSize = !!( data[0].width && data[0].height );            
        // 根据数据中是否包含尺寸信息来确定是否显示loading图片
        loadingElem[ o.isFixedSize ? 'hide' : 'show' ]();        
        easyLightBox.loadImg( o );
        
        if( !o.repeat ){
            prevElem.addClass( 'lb_toggle_disable' );
            nextElem.addClass( 'lb_toggle_disable' );
            
            if( index ){
                prevElem.removeClass( 'lb_toggle_disable' );
            }

            nextElem.removeClass( 'lb_toggle_disable' );
        }
        
        // 初始化缩略图
        if( !data[0].thumbSrc ){
            o.thumb = false;
        }    
        else{
            easyLightBox.createThumbList( o ); 
        }
        
        o.target.fire( 'likereload' );
        pagetotalElem.text( data.length );
    }

};

var LightBox = function( target, options ){
    target = E( target );
    options = options || {};
    
    if( !target.length ){
        return;
    }
    
    var o = E.merge( defaults, options );

    target.on( o.trigger + '.lightbox', function(){
        o.data = options.data;
        o.index = options.index || 0;
        easyLightBox.init( o );
    });
    
    o.target = target;
    this.__o__ = o;    
};

LightBox.prototype = {
    
    on : function( type, fn ){
        if( this.__o__ ){
            var self = this;
            
            if( type === 'end' ){
                self.__o__.isFireEnd = true;
            }
                
            self.__o__.target.on( 'like' + type, function( e ){
                e.type = type;
                e.target = boxElem[0];
                
                if( e.extraData ){
                    e.index = e.extraData.index;
                    e.lightBoxData = e.extraData.data;
                    delete e.extraData;
                }
                
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
    },
    
    reload : function( data, reloadIndex ){
        this.__o__.data = data;        
        index = ( +reloadIndex ) || 0;
        nextIndex = index + 1;        
        loadingElem.show();
        
        // 静态数据
        if( E.isArray(data) ){
            easyLightBox.reload( this.__o__ );
        }
        // 动态数据会返回一个promise实例
        else if( E.isFunction(data) ){
            data().then(function( data ){
                this.__o__.data = data;
                easyLightBox.reload( this.__o__ );
            });
        }
        else{
            easyLightBox.showError();
        }

        if( this.__o__.hash ){
            isInitHash = true;
            easyLightBox.changeHash( this.__o__ );
        }                
    }
    
};

E.ui.LightBox = LightBox;

});