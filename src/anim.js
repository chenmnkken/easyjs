// ---------------------------------------------
// ---------------@module anim------------------
// ---------------------------------------------
 
define( 'anim', [ 'data', 'css' ], function( easyData, easyStyle ){

'use strict';

var rUnit = /^[-\d.]+/,
    rColorVals = /\d+/g,
    rOtherVals = /([-\d]+|[a-z%]+)/g,

    pow = Math.pow,
    sin = Math.sin,
    PI = Math.PI,
    BACK_CONST = 1.70158,
    animHooks = {};
    
// 精挑细选过的tween(缓动)函数
E.easing = {
    // 匀速运动
    linear : function(t){
        return t;
    },

    easeIn : function(t){
        return t * t;
    },

    easeOut : function(t){
        return ( 2 - t) * t;
    },

    easeBoth : function(t){
        return (t *= 2) < 1 ?
            .5 * t * t :
            .5 * (1 - (--t) * (t - 2));
    },

    easeInStrong : function(t){
        return t * t * t * t;
    },

    easeOutStrong : function(t){
        return 1 - (--t) * t * t * t;
    },

    easeBothStrong : function(t){
        return (t *= 2) < 1 ?
            .5 * t * t * t * t :
            .5 * (2 - (t -= 2) * t * t * t);
    },
    
    easeOutQuart : function(t){
      return -(pow((t-1), 4) -1)
    },
    
    easeInOutExpo : function(t){
        if(t===0) return 0;
        if(t===1) return 1;
        if((t/=0.5) < 1) return 0.5 * pow(2,10 * (t-1));
        return 0.5 * (-pow(2, -10 * --t) + 2);
    },
    
    easeOutExpo : function(t){
        return (t===1) ? 1 : -pow(2, -10 * t) + 1;
    },
    
    swing : function( t ) {
        return 0.5 - Math.cos( t*PI ) / 2;
    },
    
    swingFrom : function(t){
        return t*t*((BACK_CONST+1)*t - BACK_CONST);
    },
    
    swingTo : function(t){
        return (t-=1)*t*((BACK_CONST+1)*t + BACK_CONST) + 1;
    },

    backIn : function(t){
        if (t === 1) t -= .001;
        return t * t * ((BACK_CONST + 1) * t - BACK_CONST);
    },

    backOut : function(t){
        return (t -= 1) * t * ((BACK_CONST + 1) * t + BACK_CONST) + 1;
    },

    bounce : function(t){
        var s = 7.5625, r;

        if (t < (1 / 2.75)) {
            r = s * t * t;
        }
        else if (t < (2 / 2.75)) {
            r = s * (t -= (1.5 / 2.75)) * t + .75;
        }
        else if (t < (2.5 / 2.75)) {
            r = s * (t -= (2.25 / 2.75)) * t + .9375;
        }
        else {
            r = s * (t -= (2.625 / 2.75)) * t + .984375;
        }

        return r;
    }
};

animHooks = {
    
    backgroundPosition : {        
        parse : function( val ){
            val = val.match( rOtherVals );
            // 修复IE6不缓存背景图片的BUG
            if( E.browser.ie && E.browser.version === '6.0' ){
                document.execCommand( 'BackgroundImageCache', false, true );
            }
            
            return {
                val : { x : parseFloat(val[0]), y : parseFloat(val[2]) },
                unit : { x : val[1], y : val[3] }
            };
        },

        compute : function( sv, tv, tu, e ){
            var cp = easyAnim.compute;
            return cp( sv, tv, tu, e, 'x' ) + ' ' +
                cp( sv, tv, tu, e, 'y' );
        },

        set : function( elem, val, unit ){                
            elem.style.backgroundPosition = val.x + unit.x + ' ' + val.y + unit.y;
        }        
    },
    
    textShadow : {
        parse : function( val ){
            if( !~val.indexOf('rgb') ){
                // 16进制的颜色值转换成rgb的颜色值
                // '#fff 0px 0px 1px' => 'rgb(255, 255, 255) 0px 0px 1px'
                val = val.replace( /([#\w]+)(.+)/, function($, $1, $2){
                    return easyStyle.parseColor($1) + $2;
                });
            }
            
            val = val.slice(4).match( rOtherVals );
            
            return {
                val : { r : parseInt(val[0]), g : parseInt(val[1]), b : parseInt(val[2]), x : parseFloat(val[3]), y : parseFloat(val[5]), fuzzy : parseFloat(val[7]) },
                unit : { r : '', g : '', b : '', x : val[4], y : val[6], fuzzy : val[8] }
            }
        },
        
        compute : function( sv, tv, tu, e ){
            var cp = easyAnim.compute;
            return 'rgb(' + cp( sv, tv, tu, e, 'r', 0 ) + ', ' +
                cp( sv, tv, tu, e, 'g', 0 ) + ', ' +
                cp( sv, tv, tu, e, 'b', 0 ) + ') ' +
                cp( sv, tv, tu, e, 'x' ) + ' ' +
                cp( sv, tv, tu, e, 'y' ) + ' ' +
                cp( sv, tv, tu, e, 'fuzzy' );
        },
        
        set : function( elem, val, unit ){
            elem.style.textShadow = 'rgb(' + val.r + ',' + val.g + ',' + val.b + ') ' +
                val.x + unit.x + ' ' +
                val.y + unit.y + ' ' +
                val.fuzzy + unit.fuzzy;
        }
    }
    
};

// 方位值简写格式的动画：padding:10px 10px 10px 10px;
[ 'padding', 'margin', 'borderWidth', 'borderRadius' ].forEach(function( name ){
    
    animHooks[ name ] = {
        parse : function( val ){
            val = val.match( rOtherVals );
            return {
                val : { top : parseFloat(val[0]), right : parseFloat(val[2]), bottom : parseFloat(val[4]), left : parseFloat(val[6]) },
                unit : { top : val[1], right : val[3], bottom : val[5], left : val[7] }
            }
        },
        
        compute : function( sv, tv, tu, e ){
            var cp = easyAnim.compute;
            return cp( sv, tv, tu, e, 'top' ) + ' ' +
                cp( sv, tv, tu, e, 'right' ) + ' ' +
                cp( sv, tv, tu, e, 'bottom' ) + ' ' +
                cp( sv, tv, tu, e, 'left' );
        },
        
        set : function( elem, val, unit ){
            elem.style[ name ] = val.top + unit.top + ' ' +
                val.right + unit.right + ' ' +
                val.bottom + unit.bottom + ' ' + 
                val.left + unit.left;
        }    
    };
    
});

// 颜色属性值的动画
[ 'color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'outlineColor' ].forEach(function( name ){

    animHooks[ name ] = {        
        parse : function( val ){
            val = easyStyle.parseColor( val ).match( rColorVals );
            return {
                val : {
                    r : parseInt( val[0] ),
                    g : parseInt( val[1] ),
                    b : parseInt( val[2] )
                }
            };
        },

        // 颜色值不允许有小数点
        compute : function( sv, tv, _, e ){
            var r = ( sv.r + (tv.r - sv.r) * e ).toFixed(0), 
                g = ( sv.g + (tv.g - sv.g) * e ).toFixed(0), 
                b = ( sv.b + (tv.b - sv.b) * e ).toFixed(0);
            
            return 'rgb(' + r + ',' + g + ',' + b + ')';                
        },
        
        set : function( elem, val ){
            elem.style[ name ] = 'rgb(' + val.r + ',' + val.g + ',' + val.b + ')';
        }
    };

});

var easyAnim = {

    interval : 1000 / 65,
    
    data : function( elem, name, val ){
        return easyData.data( elem, 'anim', name, val );
    },
        
    removeData : function( elem, name ){
        return easyData.removeData( elem, 'anim', name );
    },

    // 合并动画参数
    mergeOptions : function( source ){
        var target = {},            
            duration = source.duration,
            easing = source.easing;                
        
        target.duration = E.isNumber( duration ) ? duration : 400;
        
        target.easing = E.isString( easing ) && E.easing[ easing ] ? 
            E.easing[ easing ] :
            E.easing.swing;
        
        target.targetProps = source.to || source;
        target.sourceProps = source.from;
        target.reverse = source.reverse;
        target.complete = source.complete;    
        
        return target;
    },

    /* 
     * 预定义动画效果的属性值
     * @param { String } 动画类型(show/hide)
     * @param { Number } 数组索引，0 : show/hide 1 : slide, 2 : fade
     * @return { Object } object.props为CSS属性数组，object.type为动画类型(show/hide)
     */
    patterns : function( type, index ){
        var props = [
            [ 'width', 'height', 'opacity', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth' ],
            [ 'height', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth' ],
            [ 'opacity' ]
        ];
            
        return { 
            props : props[ index ],
            type : type
        }
    },
    
    /* 
     * 创建常见的动画模式的结束属性值
     * @param { HTMLElement } 
     * @param { Array } CSS动画属性
     * @param { String } 动画类型(show/hide)
     * @return { Object } 动画结束的属性值
     */     
    createProps : function( elem, props, type ){
        var isShow = type === 'show',
            len = props.length,
            elem = E( elem ),
            obj = {},
            i = 0,
            val, prop;                

        for( ; i < len; i++ ){
            prop = props[i];
            val = elem.css( prop );
            if( parseFloat(val) ){
                obj[ prop ] = isShow ? val : ( prop === 'opacity' ? '0' : '0px' );
            }
        }
        
        return obj;
    },
    
    // 用于各种特殊动画计算的方法
    compute : function( sv, tv, tu, e, name, n ){
        if( n === undefined ){
            n = 7;
        }
        return ( sv[name] + (tv[name] - sv[name]) * e ).toFixed(n) + tu[name];
    },
    
    /*
     * 解析CSS属性值
     * @param { String } CSS属性
     * @param { String } CSS属性值
     * @return { Object } 
     * { val : 属性值, unit : 单位, compute : 计算方法, set : 设置方法 }
     */
    parseStyle : function( prop, value ){
        var special = animHooks[ prop ],
            val, unit, obj, compute, set;

        if( special ){
            obj = special.parse( value );
            val = obj.val;
            unit = obj.unit;
            compute = special.compute;
            set = special.set;
        }
        else{
            val = parseFloat( value );
            unit = value.replace( rUnit, '' );
            
            // 总距离 * ( (当前时间 - 开始时间) / 总时间 ) = 当前距离
            // 计算属性值时精度将直接影响到动画效果是否流畅toFixed(7)明显比toFixed(0)要流畅
            compute = function( sv, tv, tu, e ){
                return ( sv + (tv - sv) * e ).toFixed(7) + tu;
            }
            
            set = function( elem, val, unit ){
                elem.style[ prop ] = val + unit;
            }
        }
        
        return { val : val, unit : unit, compute : compute, set : set };
    },
    
    // 将数据添加到队列中
    queue : function( elem, data ){
        var animQueue = this.data( elem, 'animQueue', [] );

        if( data ){
            animQueue.push( data );
        }
        
        if( animQueue[0] !== 'running' ){
            this.dequeue( elem );
        }        
    },
        
    // 取出队列中的数据并执行
    dequeue : function( elem ){
        var animQueue = this.data( elem, 'animQueue', [] ),
            fn = animQueue.shift(),
            delay;        
            
        if( fn === 'running' ){
            fn = animQueue.shift();
        }
        
        if( fn ){
            animQueue.unshift( 'running' );
            if( E.isNumber(fn) ){
                delay = window.setTimeout(function(){
                    window.clearTimeout( delay );
                    delay = null;
                    easyAnim.dequeue( elem );
                }, fn );
            }
            else if( E.isFunction(fn) ){
                fn.call( elem, function(){
                    easyAnim.dequeue( elem );
                });
            }
        }
        
        // 无队列时清除相关的缓存
        if( !animQueue.length ){
            this.removeData( elem, 'animQueue' );
        }
    }
    
};

// 动画构造器
var Anim = function( elem, duration, easing, complete, type ){
    this.elem = elem;
    this.$elem = E( elem );
    this.duration = duration;    
    this.easing = easing;    
    this.complete = complete;    
    this.type = type;
};

Anim.prototype = {
    
    /*
     * 开始动画
     * @param { Object } 动画开始时的属性值
     * @param { Object } 动画结束时的属性值
     * @param { Number } 动画属性的个数
     */
    start : function( source, target, len ){        
        var self = this,
            elem = this.elem,
            timer = easyAnim.data( elem, 'timer' );
        
        this.len = len;
        this.source = source;
        this.target = target;
        // 动画开始的时间
        this.startTime = +new Date();
        // 动画结束的时间
        this.endTime = this.startTime + this.duration;
        
        if( timer ){
            return;
        }    

        easyAnim.data( elem, 'currentAnim', this );        
        
        timer = window.setInterval(function(){
            self.run();
        }, easyAnim.interval );        
        
        easyAnim.data( elem, 'timer', timer );
    },
    
    /*
     * 运行动画
     * @param { Boolean } 是否立即执行最后一帧
     */
    run : function( end ){
        var elem = this.elem,
            $elem = this.$elem,
            style = elem.style,            
            type = this.type,
            source = this.source,
            target = this.target,
            endTime = this.endTime,                     
            // 当前帧的时间
            elapsedTime = +new Date(),         
            // 时间比 => 已耗时 / 总时间
            t = elapsedTime < endTime ? ( elapsedTime - this.startTime ) / this.duration : 1,
            e = this.easing( t ),
            i = 0,
            p, sv, tv, tu, tp, endVal;
            
        if( type === 'show' ){
            style.display = 'block';
        }

        for( p in source ){
            i++;
            sv = source[p].val;  // 动画开始时的属性值
            tp = target[p];  
            tv = tp.val;         // 动画结束时的属性值
            tu = tp.unit;        // 属性值的单位
            
            if( elapsedTime < endTime && !end ){
                // 开始值和结束值是一样的无需处理
                if( sv === tv ){
                    continue;
                }
                
                endVal = tp.compute( sv, tv, tu, e );

                if( p !== 'opacity' ){
                    style[p] = endVal;                    
                }
                else{
                    $elem.css( 'opacity', endVal );
                }
            }
            // 动画结束时还原样式
            else{                
                if( type ){
                    if( type === 'hide' ){
                        style.display = 'none';
                    }
                    
                    // 预定义模式动画在结束时的还原样式直接设置成''，
                    // 如果设置实际结束值在IE6-7下会有BUG
                    if( p !== 'opacity' ){
                        style[p] = '';
                    }
                    else{
                        $elem.css( 'opacity', '1' );                        
                    }                    
                }
                else{
                    tp.set( elem, tv, tu );                
                }
                
                // 最后一个动画完成时执行回调
                if( i === this.len ){  
                    this.stop();
                    this.complete.call( elem );    
                    easyAnim.removeData( elem, 'currentAnim' );
                }
            }
        }
    },
    
    // 停止动画
    stop : function(){
        var elem = this.elem,
            timer = easyAnim.data( elem, 'timer' );

        window.clearInterval( timer );
        easyAnim.removeData( elem, 'timer' );
    }
    
};

E.mix( E.prototype, {
    
    anim : function( options ){    
        options = easyAnim.mergeOptions( options );

        return this.forEach(function(){
            var fn = options.complete,
                sourceProps = options.sourceProps,
                targetProps = options.targetProps,
                isInit = sourceProps !== undefined,
                source = {},
                target = {},
                elem = this,
                len = 0,
                pattern, anim, type, complete;

            // 获取常见动画模式的属性值
            if( E.isFunction(targetProps) ){
                pattern = targetProps();
                type = pattern.type;
                targetProps = easyAnim.createProps( elem, pattern.props, type );
            }

            // 回调函数的封装
            complete = function(){
                if( E.isFunction(fn) ){
                    fn.call( elem );
                }
                easyAnim.dequeue( elem );
            };
            
            // 实例化动画
            anim = new Anim( elem, options.duration, options.easing, complete, type );        
            
            easyAnim.queue( this, function(){
                var elem = E( this ),
                    parse = easyAnim.parseStyle,
                    rOperator = /(?:[+-]=)/,                
                    p, sv, tv, temp;
                
                for( p in targetProps ){
                    len++;
                    // 显示类动画先将开始时的CSS属性值重置为0
                    if( type === 'show' ){                        
                        elem.css( p, p === 'opacity' ? '0' : '0px' );
                    }
                    
                    sv = isInit && sourceProps[p] || elem.css( p );
                    tv = targetProps[p];
                    
                    if( !sv || !tv || sv === 'none' || tv === 'none' ){
                        continue;
                    }
                    
                    // 处理 += / -= 的动画
                    if( rOperator.test(tv) ){
                        temp = tv.slice(2);
                        
                        tv = tv.charAt(0) === '+' ?
                            parseFloat( sv ) + parseFloat( temp ) : // +=
                            parseFloat( sv ) - parseFloat( temp );  // -=
                            
                        tv = tv + temp.replace( rUnit, '' );
                    }

                    // 解析动画开始时的CSS属性值
                    source[p] = parse( p, sv );        
                    // 解析动画结束时的CSS属性值
                    target[p] = parse( p, tv );   

                    // 如果有初始值，则设置动画开始时的初始值
                    if( isInit ){
                        elem.css( p, sourceProps[p] || '' );
                    }
                }
                
                // 开始动画                
                anim.start( source, target, len );
            });
            
            // 添加反向的动画队列
            if( options.reverse === true ){
                easyAnim.queue( this, function(){                            
                    anim.start( target, source, len );
                });                
            }
        });
    },
    
    /*
       * 停止动画
     * @param { Boolean } 是否清除队列
     * @param { Boolean } 是否执行当前队列的最后一帧动画
     * @return { easyJS Object } 
     */
    stop : function( clear, end ){
        return this.forEach(function(){
            var currentAnim = easyAnim.data( this, 'currentAnim' );
                    
            if( clear ){
                easyAnim.removeData( this, 'animQueue' );
            }

            if( currentAnim ){
                currentAnim.stop();
            }
            
            if( end ){
                if( currentAnim ){
                    currentAnim.run( true );
                }
            }
            else{
                easyAnim.dequeue( this );
            }
        });
    },
    
    show : function( duration, easing, fn ){
        // 有动画效果
        if( duration ){
            return this.anim({
                to : function(){
                    return easyAnim.patterns( 'show', 0 );
                }, 
                duration : duration, 
                easing : easing, 
                complete : fn 
            });
        }
        // 无动画效果
        else{
            return this.forEach(function(){
                var currentDisplay = E( this ).css( 'display' ),
                    oldDisplay;
                    
                if( currentDisplay === 'none' ){
                    oldDisplay = easyData.data( this, null, 'display' );    
                    // 如果有缓存的显示模式就用缓存的显示模式    
                    if( oldDisplay ){
                        easyData.removeData( this, null, 'display' );
                    }
                    // 无缓存就只能强制用block了
                    else{
                        oldDisplay = currentDisplay;
                    }
                    
                    this.style.display = oldDisplay === 'none' ? 'block' : '';
                }                
            });
        }
    },
    
    hide : function( duration, easing, fn ){
        // 有动画效果
        if( duration ){
            return this.anim({
                to : function(){
                    return easyAnim.patterns( 'hide', 0 );
                }, 
                duration : duration, 
                easing : easing, 
                complete : fn 
            });
        }
        // 无动画效果
        else{
            return this.forEach(function(){
                var currentDisplay = E( this ).css( 'display' );
                
                if( currentDisplay !== 'none' ){
                    // 隐藏的时候缓存原始的显示模式，以便在下次show的时候能正确的还原
                    easyData.data( this, null, 'display', currentDisplay );
                    this.style.display = 'none';
                }
            });
        }
    },
    
    delay : function( time ){
        return this.forEach(function(){
            if( E.isNumber(time) ){
                easyAnim.queue( this, time );
            }        
        });
    },
        
    slideToggle : function( duration, easing, fn ){
        return this.forEach(function(){
            var elem = E( this ),
                slide = elem.is( ':hidden' ) ? 
                    elem.slideDown :
                    elem.slideUp;
                    
            slide.call( elem, duration, easing, fn );    
        });
    }
    
});

// slideDown、slideUp、fadeIn、fadeOut动画原型方法的拼装
E.each({    
    slideDown : { type : 'show', index : 1 },
    slideUp : { type : 'hide', index : 1 },
    fadeIn : { type : 'show', index : 2 },
    fadeOut : { type : 'hide', index : 2 }        
}, function( name, val ){    
    E.prototype[ name ] = function( duration, easing, fn ){
        return this.anim({
            to : function(){
                return easyAnim.patterns( val.type, val.index );
            }, 
            duration : duration, 
            easing : easing, 
            complete : fn 
        });            
    };    
});

});