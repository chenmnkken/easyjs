// ---------------------------------------------
// ---------------@module easy------------------
// ---------------------------------------------
 
(function( window, undefined ){

'use strict';

var document = window.document,
    
    isReady = false,    // 判断DOM是否ready
    readyBound = false,    // 判断是否绑定过ready事件
    readyList = [],     // 存放DOM ready后的函数
    uaMatch,
    
    rQuickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,    
    rReadyState = /loaded|complete|undefined/,
    
    moduleCache = {},    // 模块加载时的队列数据存储对象
    modifyCache = {},    // modify的临时数据存储对象
    
    head = document.head || 
    document.getElementsByTagName( 'head' )[0] || 
    document.documentElement,

    baseElem = head.getElementsByTagName( 'base' )[0],
    
    // 模块加载器的配置对象
    moduleOptions = {
        baseUrl : null,
        charset : {}    // 模块对应的charset存储对象
    },
    
    // 浏览器判定的正则    
    rUA = [    /ms(ie)\s(\d\.\d)/,    // IE
            /(chrome)\/(\d+\.\d+)/,    // chrome
            /(firefox)\/(\d+\.\d+)/,   // firefox 
            /version\/(\d+\.\d+)(?:\.\d)?\s(safari)/,    // safari
            /(opera)(?:.*version)\/([\d.]+)/ ],    // opera
    
    // easyJS的构造器，利用私有的init构造器实现无new实例化
    easyJS = function( selector, context ){
        return new init( selector, context );
    },
    
    // DOM ready
    ready = function( fn ){
        var domReady, stateChange,
            toplevel = false,
            doScroll = document.documentElement.doScroll,
            eventType = doScroll ? 'onreadystatechange' : 'DOMContentLoaded',
            fireReady = function(){
                if( isReady ) return;
                isReady = true;
                
                if( readyList ){
                    var i = 0, readyFn;                        
                    while( readyFn = readyList[i++] ){
                        readyFn.call( window, easyJS );
                    }
                    
                    readyList = undefined;
                }
            },
            
            doScrollCheck = function(){
                try {
                    doScroll( 'left' );
                    fireReady();
                } catch(e) {
                    setTimeout( doScrollCheck, 1 );
                    return;
                }
            };
        
        if( !readyBound ){
            readyBound = true;
            
            if( document.readyState === 'complete' ){
                return fireReady();
            }
            
            if( document.addEventListener ){
                domReady = function(){
                    document.removeEventListener( eventType, domReady, false );
                    fireReady();
                };
                
                document.addEventListener( eventType, domReady, false );
                window.addEventListener( 'load', fireReady, false );
            }
            else if( document.attachEvent ){
                stateChange = function(){
                    if( document.readyState === 'complete' ){
                        document.detachEvent( eventType, stateChange );
                        fireReady();
                    }
                };
                
                document.attachEvent( eventType, stateChange );
                window.attachEvent( 'onload', fireReady );
                
                try {
                    toplevel = window.frameElement == null;
                }catch(_){}
                
                if( doScroll && toplevel ){
                    doScrollCheck();
                }
            }
        }
        
        if( isReady ){
            fn.call( window, easyJS );
        }
        else{
            readyList.push( fn );
        }
    },
    
    // 私有的init构造器，外部无法访问
    init = function( selector, context ){
        var elems, elem, match;        
        // 无参数时需要初始化length 如：E();
        this.length = 0;
        
        if( !selector ){
            return this;
        }

        // selector为字符串
        if( typeof selector === 'string' ){
            // selector为HTML字符串时需要转换成DOM节点
            if( selector.charAt(0) === '<' && selector.charAt(selector.length - 1) === '>' && selector.length >= 3 ){
                context = context ? context.ownerDocument || context : document;
                elems = easyJS.create( selector, context );
            }
            // selector符合CSS选择器的语法规范直接调用选择器接口
            else{
                context = context || document;
                match = rQuickExpr.exec( selector );
                // 对于单个的id选择器，使用频率较多，使用快速通道
                if( match && ~match[0].indexOf('#') ){
                    elem = document.getElementById( match[2] );
                    if( elem ){
                        this[0] = elem;
                        this.length = 1;
                    }
                    return this;
                }
                
                elems = easyJS.query( selector, context );
            }
            
            return easyJS.makeArray( elems, this );
        }
        
        // selector为function时将回调函数放到DOM reday时执行
        if( typeof selector === 'function' ){            
            return ready( selector );
        }          
        
        // selector为DOM节点
        if( selector.nodeType ){
            this[0] = selector;
            this.length = 1;
            return this;
        }
        
        // selector为body元素
        if( selector === 'body' && !context && document.body ){
            this[0] = document.body;
            this.length = 1;
            return this;
        }

        // selector为Nodelist
        if( typeof selector.length === 'number' ){
            return easyJS.makeArray( selector, this );
        }
     
    };

init.prototype = easyJS.prototype;
    
/*
 * 将源对象的成员复制到目标对象中
 * @param { Object } 目标对象
 * @param { Object } 源对象
 * @param { Boolean } 是否覆盖 默认为true(覆盖)
 * @param { Array } 只复制该数组中在源对象中的属性
 * @return { Object } 目标对象
 */
easyJS.mix = function( target, source, override, whitelist ){
    if( !target || !source ) return;
    if( override === undefined ){
        override = true;
    }

    var prop, len, i,
        _mix = function( prop ){
            if( override === true || !(prop in target) ){
                target[ prop ] = source[ prop ];
            }
        };            
    
    if( whitelist && (len = whitelist.length) ){
        for( i = len; i; ){
            prop = whitelist[--i];
            if( prop in source ){
                _mix( prop );
            }
        }
    }
    else{
        for( prop in source ){
            _mix( prop );
        }
    }
    
    return target;
};

easyJS.mix( easyJS, {

    version : '@version@',
    
    __uuid__ : 2,
    
    browser : {},    // 存储浏览器名和版本的相关数据
    
    module : {},    // 模块加载器的缓存对象
    
    /*
     * 将多个对象合并成一个新对象，后面的对象属性将覆盖前面的
     * 常用于合并配置对象
     * @param { Object } 一个或多个对象
     * @return { Object } 合并后的新对象
     */
    merge : function( /* Objects */ ){
        var result = {};
        for( var i = 0, len = arguments.length; i < len; i++ ){
            easyJS.mix( result, arguments[i] );
        }        
        
        return result;
    },
        
    // 创建一个唯一的uuid
    guid : function( pre ){
        return ( pre || 'easyJS_' ) + 
            ( +new Date() ) + 
            ( Math.random() + '' ).slice( -8 );
    },
        
    /*
     * 加载模块
     * @param { String } 模块标识
     * @param { Function } 回调函数
     */
    use : function( ids, fn ){
        ids = typeof ids === 'string' ? [ ids ] : ids;
        var module = easyJS.module,
            modUrls = [],
            modNames = [],
            namesCache = [],
            i = 0,
            mod, modName, modUrl, result, useKey;        
            
        for( ; i < ids.length; i++ ){
            // 获取解析后的模块名和url
            result = easyModule.parseModId( ids[i], moduleOptions.baseUrl );
            modName = result[0];
            modUrl = result[1];
            mod = module[ modName ];            

            if( !mod ){
                mod = module[ modName ] = {};
            }
            
            // 将模块名和模块路径添加到队列中
            modNames[ modNames.length++ ] = modName;
            modUrls[ modUrls.length++ ] = mod.url = modUrl;
        }
        
        // 生成队列的随机属性名
        useKey = modNames.join( '_' ) + '_' + easyJS.euid + (++easyJS.__uuid__);
        // 复制模块名，在输出exports时会用到
        namesCache = namesCache.concat( modNames );
        
        // 添加队列
        moduleCache[ useKey ] = {
            callback : fn,
            names : modNames,
            namesCache : namesCache,
            urls : modUrls
        };

        // 开始加载
        easyModule.load( useKey );
    },
    
    /*
     * 给模块添加modify方法以便在正式返回exports前进行修改
     * @param { String } 模块名
     * @param { Function } 修改exports的函数，该函数至少要有一个返回值
     */
    modify : function( name, fn ){        
        modifyCache[ name ] = fn;
    },
    
    /*
     * 修改模块加载器的配置
     * @param { Object }
     */
    config : function( options ){
        if( options.baseUrl ){
            moduleOptions.baseUrl = options.baseUrl;
        }
        
        moduleOptions.charset = easyJS.merge( moduleOptions.charset, options.charset );
    }
    
});

// 生成euid
easyJS.euid = easyJS.guid();

var easyModule = {
    
    // 初始化模块加载器时获取baseUrl(既是当前js文件加载的url)
    init : function(){
        var scripts = document.getElementsByTagName( 'script' ),
            // 在页面加载时，当前js文件的script标签始终是最后一个
            script = scripts[ scripts.length - 1 ],
            initMod = script.getAttribute( 'data-main' ),
            url = script.hasAttribute ? script.src : script.getAttribute( 'src', 4 );
        
        moduleOptions.baseUrl = url.slice( 0, url.lastIndexOf('/') + 1 );
        // 初始化时加载data-main中的模块
        if( initMod ){
            easyJS.use( initMod );
        }
        
        scripts = script = null;
    },
    
    /*
     * 解析模块标识，返回模块名和模块路径
     * @parmm { String } 模块标识
     * @param { String } 基础路径baseUrl
     * @return { Array } [ 模块名, 模块路径 ]
     * =====================================================================
     * 解析规则：
     * baseUrl = http://easyjs.org/js/                                
     * http://example.com/test.js => [ test, http://example.com/test.js ]
     *                   ajax/xhr => [ xhr, http://easyjs.org/js/ajax/xhr.js ]
     *                    ../core => [ core, http://easyjs.org/core.js ]
     *                       test => [ test, http://easyjs.org/js/test.js ]
     * =====================================================================
     */
    parseModId : function( id, url ){
        var modName = id,
            isCSS = id.slice( -4 ) === '.css',
            suffix = isCSS ? '.css' : '.js',
            modUrl, startIndex, endIndex, href, dLen, hLen;
            
        if( ~id.indexOf('/') ){
            startIndex = id.lastIndexOf( '/' ) + 1;
            endIndex = ~id.indexOf( suffix ) ? id.lastIndexOf( suffix ) : id.length;
            
            modName = id.slice( startIndex, endIndex );
        }    
            
        if( id.slice(0, 4) === 'http' ){
            modUrl = id;
        }    
        else if( id.charAt( 0 ) === '.' ){
            url = url.match( /([\w:]+\/\/)(.+)/ );
            href = url[2].split( '/' );
            hLen = href.length - 2;
            dLen = id.match( /\.\.\//g ).length;
            dLen = dLen > hLen ? hLen : dLen;
            href.splice( href.length - dLen - 1, dLen );
            id = id.replace( /(\.\.\/)+/, '' );

            modUrl = url[1] + href.join( '/' ) + id + ( isCSS ? '' : '.js' );
        }
        else{
            if( isCSS && !~id.indexOf('/') ){
                modName = id.slice( 0, -4 ); 
            }
            
            modUrl = url + id + ( isCSS ? '' : '.js' );
        }

        return [ modName, modUrl ];
    },
    
    /*
     * 将依赖模块列表的外部接口(exports)合并成arguments
     * @param { Array }    依赖模块列表
     * @return { Array } 返回参数数组
     */
    getExports : function( deps ){
        if( deps ){
            var len = deps.length,
                module = easyJS.module,
                arr = [],
                i = 0,
                j = 0,
                dep;
                
            for( ; i < len; i++ ){
                arr[ j++ ] = module[ deps[i] ].exports;
            }
            
            return arr;
        }
    },
    
    /*
     * 触发被依赖模块的factory
     * @param { Object } 模块的缓存对象
     */    
    fireFactory : function( mod ){
        var toDepData = mod.toDepData,
            module = easyJS.module,
            i = 0,
            result, len, args, exports, toDepMod;
            
        if( !toDepData ){
            return;
        }
        
        len = toDepData.length;
            
        // 执行被依赖模块的factory    
        for( ; i < len; i++ ){
            result = toDepData[i];
            toDepMod = module[ result.name ];
            // 被依赖模块完成解析，但还未输出exports
            toDepMod.status = 3;                
            
            args = easyModule.getExports( toDepMod.deps );    
            exports = result.factory.apply( null, args );
            
            if( exports !== undefined ){
                if( modifyCache[result.name] ){
                    exports = modifyCache[ result.name ]( exports );
                    delete modifyCache[ result.name ];
                }
                // 缓存被依赖模块的exports到该模块中
                toDepMod.exports = exports;
            }
            // 被依赖模块加载并执行完毕，exports已可用
            toDepMod.status = 4;
        }
        
        delete mod.toDepData;        
    },
    
    /*
     * 加载模块
     * @param { String } 用来访问存储在moduleCache中的数据的属性名
     */ 
    load : function( useKey ){            
        var data = moduleCache[ useKey ],
            urls = data.urls,
            charset = moduleOptions.charset,
            url = urls.shift(),
            name = data.names.shift(),
            module = easyJS.module,
            mod = module[ name ],
            isCSS = url.slice( -4 ) === '.css',
            script, link,
            
            // script加载完后执行的函数
            complete = function(){
                // 队列没加载完将继续加载
                if( urls.length ){
                    easyModule.load( useKey );
                }
                // 所有的模块都已加载完
                else{
                    var namesCache = data.namesCache,                        
                        len = namesCache.length,
                        args = [],
                        i = 0,
                        j = 0;
                    
                    // 如果CSS模块包含了被依赖模块的信息，将在此触发factory
                    if( isCSS ){
                        easyModule.fireFactory( mod );
                    }
                    
                    // 合并模块的exports为arguments
                    for( ; i < len; i++ ){
                        args[ j++ ] = module[ namesCache[i] ].exports;
                    }
                    
                    // 执行use的回调
                    if( data.callback ){
                        data.callback.apply( null, args );
                    }
                    
                    // 删除队列数据
                    delete moduleCache[ useKey ];                    
                }
                
                // 删除模块缓存中的队列属性值
                delete mod.useKey;
            };

        // 已加载过的模块不重复加载，但如果有回调还是需要执行回调
        if( mod.status === 4 ){
            complete();            
            return;
        }

        if( isCSS ){            
            link = document.createElement( 'link' );            
            link.rel = 'stylesheet';
            link.href = url;
        }
        else{
            script = document.createElement( 'script' );
            script.async = 'async';
            script.src = url;
        }
        
        // 如果有配置charset则指定charset
        if( charset[name] ){
            if( isCSS ){
                link.charset = charset[ name ];
            }
            else{
                script.charset = charset[ name ];
            }
        }
        
        if( isCSS ){
            link.onload = link.onerror = function(){
                link = link.onload = link.onerror = null;
                mod.status = 4;
                
                complete();
            };
        }
        else{
            script.onload = script.onerror = script.onreadystatechange = function(){
                if( rReadyState.test(script.readyState) ){            
                    script.onload = script.onerror = script.onreadystatechange = null;
                    head.removeChild( script );
                    script = null;

                    complete();
                }
            };
        }
        
        mod.useKey = useKey;
        // 开始加载模块
        mod.status = 1;

        baseElem ? 
            head.insertBefore( script || link, head.firstChild ) : 
            head.appendChild( script || link );
    }
    
};

/*
 * 定义模块的全局方法(AMD规范)
 * @param { String } 模块名
 * @param { String / Array } 依赖模块列表，单个可以用字符串形式传参，多个用数组形式传参
 * @param { Function } 模块的内容
 * factory的参数对应依赖模块的外部接口(exports)
 */
window.define = function( name, deps, factory ){
    var module = easyJS.module,
        mod = module[ name ],
        toDepData = mod.toDepData,
        getExports = easyModule.getExports,
        modUrl = mod.url,
        data, urls, names, baseUrl, i, j, depMod, depName, lastDepName, result, exports, toDepMod, args;
    
    // 存储模块依赖列表的数组
    mod.deps = [];    
    // 开始解析模块内容
    mod.status = 2;
    
    if( typeof deps === 'function' ){
        factory = deps;
        deps = null;
    }        

    // 如果有依赖模块，先加载依赖模块
    if( deps ){
        deps = typeof deps === 'string' ? [ deps ] : deps;
        // 依赖模块的baseUrl是当前模块的baseUrl
        baseUrl = modUrl.slice( 0, modUrl.lastIndexOf('/') + 1 );
        // 取出当前模块的队列数据
        data = moduleCache[ mod.useKey ];
        
        urls = data.urls;
        names = data.names;

        // 遍历依赖模块列表，如果该依赖模块没加载过，
        // 则将该依赖模块名和模块路径添加到当前模块加载队列的数据去进行加载
        for( i = deps.length - 1; i >= 0; i-- ){
            result = easyModule.parseModId( deps[i], baseUrl );
            depName = result[0]; 
            depMod = module[ depName ];
            // 第一次遍历依赖模块时保存最后一个依赖模块的模块名
            lastDepName = lastDepName || depName;
            mod.deps.unshift( depName );

            if( depMod ){
                deps.splice( i, 1 );
                continue;
            }
            else{
                depMod = module[ depName ] = {};
            }
            
            names.unshift( depName );
            urls.unshift( (depMod.url = result[1]) );
        }        
        
        // 将当前模块名和factory存储到最后一个依赖模块的缓存中
        // 当最后一个依赖模块加载完毕才执行当前模块的factory
        if( deps.length ){
            depMod = module[ lastDepName ];
            depMod.toDepData = toDepData || [];            
            depMod.toDepData.unshift({ 
                name : name, 
                factory : factory
            });
        }            
    }
        
    if( !deps || !deps.length ){
        // 模块解析完毕，所有的依赖模块也都加载完，但还未输出exports
        mod.status = 3;
        
        args = easyModule.getExports( mod.deps );    
        exports = factory.apply( null, args );
        
        if( exports !== undefined ){
            // 如果有绑定modify方法，将在正式返回exports前进行修改
            if( modifyCache[name] ){
                exports = modifyCache[ name ]( exports );
                // 修改后即删除modify方法
                delete modifyCache[ name ];
            }
            // 存储exports到当前模块的缓存中
            mod.exports = exports;
        }
        
        // 当前模块加载并执行完毕，exports已可用
        mod.status = 4;
        
        // 触发被依赖模块的factory        
        easyModule.fireFactory( mod );
    }
    
    // 无依赖列表将删除依赖列表的数组 
    if( !mod.deps.length ){
        delete mod.deps;
    }
    
    // 删除当前模块的被依赖模块的相关数据
    delete mod.toDepData;
};

// 初始化模块加载器
easyModule.init();

// 处理浏览器UA的判断
uaMatch = (function(){
    var ua = navigator.userAgent.toLowerCase(),
        len = rUA.length,
        i = 0,
        matches;
        
    for( ; i < len; i++ ){
        if( (matches = ua.match(rUA[i])) ){
            break;
        };
    }
    
    if( !matches ){
        matches = [];
    }
    
    return {
        browser : matches[1] || '',
        version : matches[2] || 0
    };
})();

if( uaMatch.browser ){
    if( uaMatch.version === 'safari' ){
        uaMatch.version = uaMatch.browser;
        uaMatch.browser = 'safari';
    }

    easyJS.browser[ uaMatch.browser ] = true;
    easyJS.browser.version = uaMatch.version;
}

window.easyJS = window.E = easyJS;

})( window );