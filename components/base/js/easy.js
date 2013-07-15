/*
* easy.js v1.0.2
*
* Copyright (c) 2013 Yiguo Chan
* Released under the MIT Licenses
*
* Mail : chenmnkken@gmail.com
* Date : 2013-7-15 23:30:52
*/

// ---------------------------------------------
// ---------------@module easy------------------
// ---------------------------------------------
 
(function( window, undefined ){

'use strict';

var document = window.document,
    
    isScriptOnload = !!document.addEventListener,
    isReady = false,    // 判断DOM是否ready
    readyBound = false,    // 判断是否绑定过ready事件
    readyList = [],     // 存放DOM ready后的函数
    uaMatch, modClassName,
    
    rQuickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,    
    rProtocol = /^(http(?:s)?\:\/\/|file\:.+\:\/)/,
    rModId = /([^\/?]+?)(\.(?:js|css))?(\?.*)?$/, 
    rReadyState = /loaded|complete|undefined/,  
    
    moduleCache = {},    // 模块加载时的队列数据存储对象
    modifyCache = {},    // modify的临时数据存储对象
    
    head = document.head || 
    document.getElementsByTagName( 'head' )[0] || 
    document.documentElement,
    
    // 模块加载器的配置对象
    moduleOptions = {
        baseUrl : null,
        charset : {}    // 模块对应的charset存储对象
    },
    
    // 浏览器判定的正则    
    rUA = [ /ms(ie)\s(\d\.\d)/,    // IE
            /(chrome)\/(\d+\.\d+)/,    // chrome
            /(firefox)\/(\d+\.\d+)/,   // firefox 
            /version\/(\d+\.\d+)(?:\.\d)?\s(safari)/,    // safari
            /(opera)(?:.*version)\/([\d.]+)/ ],    // opera
    
    // easyJS的构造器，利用私有的init构造器实现无new实例化
    easyJS = function( selector, context ){
        return new init( selector, context );
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
            selector = selector.trim();
            
            // selector为body元素
            if( selector === 'body' && !context && document.body ){
                this[0] = document.body;
                this.length = 1;
                return this;
            }
            
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
                    context = context ? context.ownerDocument || context : document;                    
                    elem = context.getElementById( match[2] );
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

        // selector为DOM节点、window、document、document.documentElement
        if( selector.nodeType || typeof selector === 'object' && 'setInterval' in selector ){
            this[0] = selector;
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

    version : '1.0.2',
    
    __uuid__ : 2,
    
    // ui组件命名空间
    ui : {},
    
    // 存储浏览器名和版本的相关数据
    browser : {
        ie : false,
        chrome : false,
        firefox : false,
        safari : false,
        opera : false
    },    
    
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
    
    // DOM ready
    ready : function( fn ){
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
        
    /*
     * 加载模块
     * @param { String } 模块标识
     * @param { Function } 回调函数
     */
    use : function( ids, fn ){
        ids = typeof ids === 'string' ? [ ids ] : ids;
        var module = easyJS.module,
            len = ids.length,
            isLoaded = true,
            namesCache = [],
            modNames = [],
            modUrls = [],
            j = 0,
            mod, modName, result, useKey, args, name, i;        
            
        for( i = 0; i < len; i++ ){
            // 获取解析后的模块名和url
            result = easyModule.parseModId( ids[i], moduleOptions.baseUrl );
            modName = result[0];
            mod = module[ modName ];            

            if( !mod ){
                mod = module[ modName ] = {};
                isLoaded = false;
            }
            
            // 将模块名和模块路径添加到队列中
            modNames[ modNames.length++ ] = modName;
            modUrls[ modUrls.length++ ] = mod.url = result[1];
        }
        
        // 生成队列的随机属性名
        useKey = modNames.join( '_' ) + '_' + easyJS.guid();
        // 复制模块名，在输出exports时会用到
        namesCache = namesCache.concat( modNames );
        
        // 在模块都合并的情况下直接执行callback
        if( isLoaded ){                    
            len = namesCache.length;
            args = [];
            
            // 合并模块的exports为arguments
            for( i = 0; i < len; i++ ){
                name = namesCache[i];
                mod = module[ name ];
                
                if( mod.status !== 4 ){
                    easyJS.error( '[' + name + '] module failed to use.' );
                }
                
                args[ j++ ] = mod.exports;
            }
            
            // 执行use的回调
            if( fn ){
                fn.apply( null, args );
            }
            
            return;
        }
        
        // 添加队列
        moduleCache[ useKey ] = {
            length : namesCache.length,
            namesCache : namesCache,
            names : [ modNames ],
            urls : [ modUrls ],
            callback : fn,
            factorys : [],            
            deps : {}
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
        var baseUrl = options.baseUrl,
            isHttp = baseUrl.slice( 0, 4 ) === 'http';
            
        if( isHttp ){
            moduleOptions.baseUrl = baseUrl;
        }
        // 相对路径的baseUlr是基于HTML页面所在的路径(无论是http地址还是file地址)
        else{
            moduleOptions.baseUrl = easyModule.mergePath( baseUrl, document.location.href );
        }
        
        moduleOptions.charset = easyJS.merge( moduleOptions.charset, options.charset );
    },
    
    error : function( msg ){
        throw new Error( msg );
    }
    
});

// 生成euid
easyJS.euid = easyJS.guid();
modClassName = easyJS.guid( 'easyJS_mod_' );

var easyModule = {
    
    // 初始化模块加载器时获取baseUrl(既是当前js文件加载的url)
    init : function(){
        var i = 0,
            script, scripts, initMod, url;
        
        // firefox支持currentScript属性
        if( document.currentScript ){
            script = document.currentScript;
        }
        else{
            // 正常情况下，在页面加载时，当前js文件的script标签始终是最后一个
            scripts = document.getElementsByTagName( 'script' );            
            script = scripts[ scripts.length - 1 ];
        }           

        initMod = script.getAttribute( 'data-main' );
        url = script.hasAttribute ? script.src : script.getAttribute( 'src', 4 );        
        moduleOptions.baseUrl = url.slice( 0, url.lastIndexOf('/') + 1 );
        
        // 初始化时加载data-main中的模块
        if( initMod ){
            initMod = initMod.split( ',' );
            easyJS.use( initMod );
        }
        
        scripts = script = null;
    },
    
    // 获取当前运行脚本的文件的名称
    // 用于获取匿名模块的模块名
    getCurrentScript : function(){
        var script, scripts, i, stack;
            
        // 标准浏览器(IE10、Chrome、Opera、Safari、Firefox)通过强制捕获错误(e.stack)来确定为当前运行的脚本
        // http://www.cnblogs.com/rubylouvre/archive/2013/01/23/2872618.html        
        try{
            // 运行一个不存在的方法强制制造错误
            easyJS[ easyJS.euid ]();
        }
        // 捕获错误
        // safari的错误对象只有line,sourceId,sourceURL
        catch( e ){ 
            stack = e.stack;
        }
        
        if( stack ){        
            // 取得最后一行,最后一个空格或@之后的部分
            stack = stack.split( /[@ ]/g ).pop();
            // 去掉换行符
            stack = stack[0] === '(' ? stack.slice( 1, -1 ) : stack.replace( /\s/, '' );
            //去掉行号与或许存在的出错字符起始位置
            return stack.replace( /(:\d+)?:\d+$/i, '' ).match( rModId )[1];             
        }
        
        // IE6-8通过遍历script标签，判断其readyState为interactive来确定为当前运行的脚本
        scripts = head.getElementsByTagName( 'script' );
        i = scripts.length - 1;
        
        for( ; i >= 0; i-- ){
            script = scripts[i];
            if( script.className === modClassName && script.readyState === 'interactive' ){
                break;
            }
        }        
        
        return script.src.match( rModId )[1];
    },    
    
    // 将模块标识(相对路径)和基础路径合并成新的真正的模块路径(不含模块的文件名)
    mergePath : function( id, url ){
        var isHttp = url.slice( 0, 4 ) === 'http',
            domain = '',
            i = 0,
            protocol, isHttp, urlDir, idDir, dirPath, len, dir;

        protocol = url.match( rProtocol )[1];
        url = url.slice( protocol.length );
        
        // HTTP协议的路径含有域名
        if( isHttp ){
            domain = url.slice( 0, url.indexOf('/') + 1 );
            url = url.slice( domain.length );
        }
        
        // 组装基础路径的目录数组
        urlDir = url.split( '/' );
        urlDir.pop();
        
        // 组装模块标识的目录数组
        idDir = id.split( '/' );
        idDir.pop();    
        len = idDir.length;
        
        for( ; i < len; i++ ){
            dir = idDir[i];
            // 模块标识的目录数组中含有../则基础路径的目录数组删除最后一个目录
            // 否则直接将模块标识的目录数组的元素添加到基础路径的目录数组中        
            if( dir === '..' ){
                urlDir.pop();
            }
            else if( dir !== '.' ){
                urlDir.push( dir );
            }
        }

        // 基础路径的目录数组转换成目录字符串
        dirPath = urlDir.join( '/' );    
        // 无目录的情况不用加斜杠
        dirPath = dirPath === '' ? '' : dirPath + '/';        
        return protocol + domain + dirPath;
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
     *                  style.css => [ test, http://easyjs.org/js/style.css ]
     *                   ajax/xhr => [ xhr, http://easyjs.org/js/ajax/xhr.js ]
     *                    ../core => [ core, http://easyjs.org/core.js ]
     *                    test.js => [ test, http://easyjs.org/js/test.js ]
     *                       test => [ test, http://easyjs.org/js/test.js ]
     *          test.js?v20121202 => [ test, http://easyjs.org/js/test.js?v20121202 ]
     * =====================================================================
     */
    parseModId : function( id, url ){
        var isAbsoluteId = rProtocol.test( id ),        
            result = id.match( rModId ),
            modName = result[1],
            suffix = result[2] || '.js',
            search = result[3] || '',
            baseUrl, modUrl;
        
        // 模块标识为绝对路径时，标识就是基础路径
        if( isAbsoluteId ){
            url = id;
            id = '';
        }

        baseUrl = easyModule.mergePath( id, url );
        modUrl = baseUrl + modName + suffix + search;
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
        
        return [];
    },    
    
    /*
     * 测试该模块的依赖模块是否都已加载并执行完
     * @param { Object } 模块对象
     * @return { Boolean } 依赖模块是否都加载并执行完
     */    
    isLoaded : function( mod ){
        var deps = mod.deps,
            len = deps.length,
            module = easyJS.module,
            i = 0, depMod;

        for( ; i < len; i++ ){
            depMod = module[ deps[i] ];
            if( depMod.status !== 4 ){
                return false;
            }
        }
        
        return true;
    },
    
    factoryHandle : function( name, mod, factory, data ){
        // 模块解析完毕，所有的依赖模块也都加载完，但还未输出exports
        mod.status = 3;        

        var args = easyModule.getExports( mod.deps ),   
            exports = typeof factory === 'function' ? factory.apply( null, args ) : factory;
        
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
        
        if( data ){
            data.length--;
        }        
    },
    
    /*
     * 触发被依赖模块的factory
     * @param { Object } 模块的缓存对象
     */    
    fireFactory : function( useKey ){
        var data = moduleCache[ useKey ],
            factorys = data.factorys,
            result = factorys[0],            
            args, exports, name, toDepMod;   
            
        if( !result ){
            return;
        }
        
        name = result.name;
        toDepMod = easyJS.module[ name ];

        if( easyModule.isLoaded(toDepMod) ){ 
            factorys.shift();
            easyModule.factoryHandle( name, toDepMod, result.factory, data );            
            
            if( factorys.length ){
                easyModule.fireFactory( useKey );
            }         
        }     
    },
    
    /*
     * 模块加载完触发的回调函数
     * @param{ Object } 模块对象
     * @param{ Boolean } 是否为CSS模块
     */
    complete : function( mod ){
        var module = easyJS.module,
            useKey = mod.useKey,
            data = moduleCache[ useKey ],
            i = 0,
            j = 0,
            namesCache, args, len, cacheMod, name;  
            
        delete mod.useKey;    
            
        if( !data ){
            return;
        }

        // 队列没加载完将继续加载
        if( data.urls.length ){
            easyModule.load( useKey );
        }
        else if( !data.length ){
            namesCache = data.namesCache;                        
            len = namesCache.length;
            args = [];
            
            // 合并模块的exports为arguments
            for( ; i < len; i++ ){  
                name = namesCache[i];
                cacheMod = module[ name ];
                
                if( cacheMod.status !== 4 ){
                    easyJS.error( '[' + name + '] module failed to use.' );
                }
                args[ j++ ] = cacheMod.exports;
            }
            
            // 执行use的回调
            if( data.callback ){
                data.callback.apply( null, args );
            }
            
            // 删除队列数据
            delete moduleCache[ useKey ];            
        }        
    },
    
    /*
     * 创建script/link元素来动态加载JS/CSS资源
     * @param{ String } 模块的URL
     * @param{ String } 模块名
     * @param{ String } 用来访问存储在moduleCache中的数据的属性名
     * @return { HTMLElement } 用于添加到head中来进行模块加载的元素
     */
    create : function( url, name, useKey ){
        var charset = moduleOptions.charset[ name ],         
            mod = easyJS.module[ name ],
            script, link;
            
        mod.useKey = useKey;
        mod.status = 1;
        
        // CSS模块的处理
        if( ~url.indexOf('.css') ){
            link = document.createElement( 'link' );            
            link.rel = 'stylesheet';
            link.href = url;

            if( charset ){
                link.charset = charset;
            }
            
            link.onload = link.onerror = function(){
                link = link.onload = link.onerror = null;
                mod.status = 4;                
                moduleCache[ useKey ].length--;
                easyModule.fireFactory( useKey );
                easyModule.complete( mod );
            };            
            
            return link;
        }
        
        // JS模块的处理
        script = document.createElement( 'script' );
        script.className = modClassName;
        script.async = true;        
          
        
        if( charset ){
            script.charset = charset;
        }
        
        if( isScriptOnload ){
            script.onerror = function(){
                script.onerror = script.onload = null;
                head.removeChild( script );
                script = null;
                
                easyJS.error( '[' + name + '] module failed to load, the url is ' + url + '.' );
            };
        }

        script[ isScriptOnload ? 'onload' : 'onreadystatechange' ] = function(){
            if( isScriptOnload || rReadyState.test(script.readyState) ){ 
                script[ isScriptOnload ? 'onload' : 'onreadystatechange' ] = null;
                head.removeChild( script );
                script = null;
                // 加载成功
                easyModule.complete( mod );
            }
        };
        
        script.src = url;  
        return script;
    },
    
    /*
     * 加载模块
     * @param { String } 用来访问存储在moduleCache中的数据的属性名
     */ 
    load : function( useKey ){            
        var data = moduleCache[ useKey ],
            names = data.names.shift(),
            urls = data.urls.shift(),            
            len = urls.length,
            i = 0,
            script;       

        for( ; i < len; i++ ){
            script = easyModule.create( urls[i], names[i], useKey );
            head.insertBefore( script, head.firstChild );
        }
    }   
    
};

 /*
  * 定义模块的全局方法(AMD规范)
  * @param { String } 模块名
  * @param { Array } 依赖模块列表，单个可以用字符串形式传参，多个用数组形式传参
  * @param { Function } 模块的内容
  * factory的参数对应依赖模块的外部接口(exports)
  */
window.define = function( name, deps, factory ){      
    
    if( typeof name !== 'string' ){
        if( typeof name === 'function' ){
            factory = name;
        }  
        else{
            factory = deps;
            deps = name;
        }
        name = easyModule.getCurrentScript();
    }
    else if( deps !== undefined && factory === undefined ){
        factory = deps;
        deps = null;
    }

    var module = easyJS.module,
        mod = module[ name ],
        isRepeat = false,
        isLoaded = true,
        names = [],
        urls = [],
        insertIndex = 0,
        pullIndex = 0,
        useKey, data, modUrl, factorys, baseUrl, depMod, depName, result, exports, args, depsData, repeatDepsData, i, repeatName;
        
    // 在模块都合并的情况下直接执行factory
    if( !mod ){
        mod = module[ name ] = {};
        
        if( deps ){
            mod.deps = deps;
        }
        
        easyModule.factoryHandle( name, mod, factory );
        return;
    }
    
    useKey = mod.useKey;
    data = moduleCache[ useKey ];
    modUrl = mod.url;

    // 开始解析模块内容
    mod.status = 2;
    mod.deps = [];

    // 如果有依赖模块，先加载依赖模块
    if( deps && deps.length ){     
        // 依赖模块的baseUrl是当前模块的baseUrl
        baseUrl = modUrl.slice( 0, modUrl.lastIndexOf('/') + 1 );        
        factorys = data.factorys;
        depsData = data.deps[ name ] = {};

        // 遍历依赖模块列表，如果该依赖模块没加载过，
        // 则将该依赖模块名和模块路径添加到当前模块加载队列的数据去进行加载
        for( i = 0; i < deps.length; i++ ){
            result = easyModule.parseModId( deps[i], baseUrl );
            depName = result[0];             
            depMod = module[ depName ];
            mod.deps.push( depName );            
            depsData[ depName ] = true;

            if( depMod ){
                if( depMod.status !== 4 ){                
                    // 获取第一个重复依赖的模块名，会在稍后进行factorys的顺序调整
                    if( !isRepeat ){
                        isRepeat = true;
                        repeatName = depName;
                    }
                    isLoaded = false;    
                }              
                deps.splice( i--, 1 );
                continue;
            }
            else{
                depMod = module[ depName ] = {};
            }   
    
            isLoaded = false;
            data.length++;
            names[ names.length++ ] = depName;
            urls[ urls.length++ ] = depMod.url = result[1];
        }
        
        // 只要当前模块有一个依赖模块没加载完就将当前模块的factory添加到factorys中
        if( !isLoaded ){
            factorys.unshift({
                name : name, 
                factory : factory        
            });                    
        
            // 有重复依赖时将调整factorys的顺序
            if( repeatName ){
                repeatDepsData = data.deps[ repeatName ];
                for( i = factorys.length - 1; i >= 0; i-- ){
                    result = factorys[i].name;
                    if( result === repeatName ){
                        pullIndex = i;                         
                        if( !repeatDepsData ){
                            break;
                        }
                    }
                    
                    if( repeatDepsData && repeatDepsData[result] ){
                        insertIndex = i;
                        break;
                    }
                }

                // 将重复模块的factory插入到该模块最后一个依赖模块的factory后
                factorys.splice( insertIndex + 1, 0, factorys.splice(pullIndex, 1)[0] );
                // 将当前模块的factory插入到重复模块的factory后
                factorys.splice( insertIndex + 1, 0, factorys.shift() );
            }
        }
   
        if( names.length ){
            data.names.unshift( names );
            data.urls.unshift( urls );
        }
    }
    
    // 该模块无依赖模块就直接执行其factory
    if( isLoaded ){        
        easyModule.factoryHandle( name, mod, factory, data );
    }

    easyModule.fireFactory( useKey );
    
    // 无依赖列表将删除依赖列表的数组 
    if( !mod.deps.length ){
        delete mod.deps;
    }
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
        }
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


// ---------------------------------------------
// -------------@module lang-patch--------------
// ---------------------------------------------
 


var AP = Array.prototype,
    DP = Date.prototype,
    FP = Function.prototype,
    SP = String.prototype,
    
    hasOwnProperty = Object.prototype.hasOwnProperty;
    
if( !AP.indexOf ){
    /*
     * ECMAScript 5 15.4.4.14
     * 查找某数组元素在数组中的索引，不包含则返回-1
     * @param { Anything } 数组元素
     * @param { Number } 查找的起始索引，负数则是数组末尾的偏移量( -2 => len - 2 )
     * @return { String } 索引值
     */
    AP.indexOf = function( item, i ){
        var len = this.length;
            
        i = parseInt( i ) || 0;
            
        if( i < 0 ){
            i += len;
        }

        for( ; i < len; i++ ){
            if( this[i] === item ){
                return i;
            }
        }
        
        return -1;
    };
}

if( !AP.lastIndexOf ){
    // ECMAScript 5 15.4.4.15
    // lastIndexOf为indexOf的反转版，lastIndexOf是从右到左的查找顺序，indexOf是从左到右的查找顺序
    AP.lastIndexOf = function( item, i ){
        var len = this.length;
        
        i = parseInt( i ) || len - 1;
        
        if( i < 0 ){
            i += len;
        }
        
        for( ; i >= 0; i-- ){
            if( this[i] === item ){
                return i;
            }
        }
        
        return -1;
    };
}
    
if( !AP.every ){
    /*
     * ECMAScript 5 15.4.4.16
     * 遍历数组并执行回调，如果每个数组元素都满足回调函数的测试则返回true，否则返回false
     * @param { Function } 回调函数( argument : 数组元素, 数组索引, 数组 )
     * @param { Object } this的指向对象，默认为window
     * @return { Boolean } 每个数组元素是否通过回调的测试
     */
    AP.every = function( fn, context ){
        var len = this.length,
            i = 0;
    
        for( ; i < len; i++ ){
            if( !fn.call(context, this[i], i, this) ){
                return false;
            }
        }
        
        return true;
    };
}

if( !AP.some ){
    /*
     * ECMAScript 5 15.4.4.17
     * 遍历数组并执行回调，如果其中一个数组元素满足回调函数的测试则返回true，否则返回false
     * @param { Function } 回调函数( argument : 数组元素, 数组索引, 数组 )
     * @param { Object } this的指向对象，默认为window
     * @return { Boolean } 其中一个数组元素是否通过回调的测试
     */
    AP.some = function( fn, context ){
        var len = this.length,
            i = 0;
    
        for( ; i < len; i++ ){
            if( fn.call(context, this[i], i, this) ){
                return true;
            }
        }
        
        return false;
    };
}
    
if( !AP.forEach ){
    /*
     * ECMAScript 5 15.4.4.18     
     * 遍历数组并执行回调
     * @param { Function } 回调函数( argument : 数组元素, 数组索引, 数组 )
     * @param { Object } this的指向对象，默认为window
     */
    AP.forEach = function( fn, context ){        
        var len = this.length,
            i = 0;
            
        for( ; i < len; i++ ){
            fn.call( context, this[i], i, this );
        }
    };
}

if( !AP.map ){
    /*
     * ECMAScript 5 15.4.4.19
     * 遍历数组并执行回调，根据回调函数的返回值合并成一个新数组
     * @param { Function } 回调函数( argument : 数组元素, 数组索引, 数组 )
     * @param { Object } this的指向对象，默认为window
     * @return { Array } 新数组
     */
    AP.map = function( fn, context ){
        var len = this.length,
            arr = [],
            i = 0,
            j = 0;
        
        for( ; i < len; i++ ){
            arr[ j++ ] = fn.call( context, this[i], i, this );
        }
        
        return arr;
    };
}

if( !AP.filter ){
    /*
     * ECMAScript 5 15.4.4.20 
     * 遍历数组并执行回调，将满足回调函数测试的数组元素过滤到一个新的数组中，原数组保持不变。
     * @param { Function } 回调函数( argument : 数组元素, 数组索引, 数组 )
     * @param { Object } this的指向对象，默认为window
     * @return { Array } 新数组
     */
    AP.filter = function( fn, context ){
        var len = this.length,
            arr = [],
            i = 0,
            j = 0,
            result;

        for( ; i < len; i++ ){
            result = this[i];
            
            if( fn.call(context, result, i, this) ){
                arr[ j++ ] = result;
            }
        }
        
        return arr;        
    };
}
    
if( !AP.reduce ){
    /*
     * ECMAScript 5 15.4.4.21    
     * 遍历数组并执行回调，将previous元素与next元素传入回调函数中进行计算，
     * 回调的返回值作为previous元素继续与next元素再进行计算，最后返回计算结果
     * @param { Function } 回调函数( argument : previous, next, 数组索引, 数组 )
     * @param { Anything } previous的初始值，默认为数组的第一个元素，
     * 无参时从0索引开始遍历，有参时从1开始遍历
     * @return { Anything } 遍历数组后的计算结果
     */     
    AP.reduce = function( fn, result ){        
        var len = this.length,
            i = 0;
            
        if( result === undefined ){
            result = this[i++];
        }
        
        for( ; i < len; i++ ){
            result = fn( result, this[i], i, this );
        }
        
        return result;
    };
}

if( !AP.reduceRight ){
    // ECMAScript 5 15.4.4.22
    // 该方法是reduce的反转版，只是计算顺序是从右到左，reduce是从左到右
    AP.reduceRight = function( fn, result ){
        var len = this.length,
            i = len - 1;
            
        if( result === undefined ){
            result = this[i--];
        }
        
        for( ; i >= 0; i-- ){
            result = fn( result, this[i], i, this );
        }
        
        return result;
    };    
}

// 修复IE6-7的unshift不返回数组长度的BUG
if( [].unshift(1) !== 1 ){
    var unshift = AP.unshift;
    AP.unshift = function(){
        unshift.apply( this, arguments );
        return this.length;
    };
}

if( !Date.now ){
    Date.now = function(){
        return +new Date;
    };
    
    DP.getYear = function(){
        return this.getFullYear() - 1900;
    };
    
    DP.setYear = function( year ){
        return this.setFullYear( year );
    };
}

if( !FP.bind ){
    /*
     * ECMAScript 5 15.3.4.5
     * 创建一个新的绑定函数
     * @param { Object } 新函数的this指针
     * @param { agruments } 新函数的默认的参数
     * @return { Function } 返回新函数
     */
    FP.bind = function( context ){        
        if( arguments.length < 2 && context === undefined ){
            return this;
        }
        
        var self = this,
            Nop = function(){},
            args = AP.slice.call( arguments, 1 ),                        
            Bound = function(){
                var newArg = args.concat.apply( args, arguments );
                    context = this instanceof Nop && context ? this : context;
                    
                return self.apply( context, newArg );
            };
            
        Nop.prototype = this.prototype;
        Bound.prototype = new Nop();
        return Bound;
    };
}

if( !Object.keys ){
    /*
     * ECMAScript 5 15.2.3.14
     * 遍历对象，将对象的属性名组成数组返回( 不包含原型链上的属性名 )
     * @param { Object } 待遍历的对象
     * @return { Array } 属性名数组
     */
    Object.keys = function( obj ){
        var hasDontEnumBug = !({ toString: null }).propertyIsEnumerable( 'toString' ),
            arr = [],
            i = 0,
            j = 0,
            name, dontEnums, len;

        for( name in obj ){
            if( hasOwnProperty.call(obj, name) ){
                arr[ j++ ] = name;
            }
        }
        
        // 修复IE的fon in的BUG
        if( hasDontEnumBug ){
            dontEnums = 'propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor'.split( ',' );
            len = dontEnums.length;
            for( ; i < len; i++ ){
                name = dontEnums[i];
                if( hasOwnProperty.call(obj, name) ){
                    arr[ j++ ] = name;
                }
            }
        }
        
        return arr;
    };
}

if( !SP.trim ){
    // 字符串首尾去空格
    SP.trim = function(){
        // http://perfectionkills.com/whitespace-deviations/
        var whiteSpaces = [
                '\\s',
                '00A0', 
                '1680', 
                '180E', 
                '2000-\\u200A',
                '200B', 
                '2028', 
                '2029', 
                '202F', 
                '205F', 
                '3000'
            ].join('\\u'),
            
            trimLeftReg = new RegExp( '^[' + whiteSpaces + ']' ),
            trimRightReg = new RegExp( '[' + whiteSpaces + ']$' );
            
        return this.replace( trimLeftReg, '' ).replace( trimRightReg, '' );
    };
}


// ---------------------------------------------
// ---------------@module lang------------------
// ---------------------------------------------
 

    
var rValidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,    
    rValidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,    
    rValidbraces = /(?:^|:|,)(?:\s*\[)+/g,
    rSelectForm = /^(?:select|form)$/i,
    rValidchars = /^[\],:{}\s]*$/,    
    
    toString = Object.prototype.toString;

E.type = function( obj ){
    return obj === null ? 'null' :
        obj === undefined ? 'undefined' :
        toString.call( obj ).slice( 8, -1 ).toLowerCase();
};

//-----------------------------
//-----------类型判断----------
//-----------------------------

[ 'Array', 'Function', 'Object', 'RegExp' ].forEach(function( type ){
    E[ 'is' + type ] = function( obj ){
        return obj && toString.call( obj ) === '[object ' + type + ']';
    };
});

[ 'Boolean', 'Number', 'String' ].forEach(function( type ){
    E[ 'is' + type ] = function( obj ){
        return typeof obj === type.toLowerCase();
    };
});

// 标准浏览器使用原生的判断方法
if( Array.isArray ){
    E.isArray = Array.isArray;
}

E.mix( E, {

    // 判断是否为空对象
    isEmptyObject : function( obj ){
        var name;
        for( name in obj ){
            return false;
        }
        return true;
    },
    
    // 判断是否为纯粹的对象
    isPlainObject : function( obj ){
        if( !obj || !E.isObject(obj) ){
            return false;
        }
        var name,
            hasOwnProperty = Object.prototype.hasOwnProperty;
        
        try{
            for( name in obj ){
                if( !hasOwnProperty.call(obj,name) ){
                    return false;
                }
            }
        }
        catch( _ ){
          return false;
        }
          
        return true;
    },
    
    isWindow: function( obj ) {
        return obj && typeof obj === 'object' && 'setInterval' in obj;
    },

    /*
     * 遍历对象并执行回调
     * @param { Object/Array } 对象
     * @param { Function } 回调函数(如果回调函数的返回值为false将退出循环)
     * @param { Object } 上下文
     * @return { Object } 
     */
    each : function( obj, fn, context ){        
        var isObj = obj.length === undefined || typeof obj === 'function',
            i;            
        
        if( isObj ){
            for( i in obj ){
                if( fn.call(context, i, obj[i]) === false ){
                    break;
                }
            }
        }
        
        return obj;
    },
    
    /*
     * 将对象转换成真实数组
     * 常用于将arguments, NodeList等array-like对象转换成真实数组
     * @param { Anything } 任意类型的数据
     * @param { Array } 目标数组
     * @return { Array } 真实的数组
     */
    makeArray : function( source, target ){
        target = target || [];
        var i = 0,
            len = source.length;

        if( source !== null && source !== undefined ){
            if( E.isArray(source) && E.isArray(target) && !target.length ){
                return source;
            }    
            
            if( typeof len !== 'number' || 
                typeof source === 'string' || 
                E.isFunction(source) || 
                E.isRegExp(source) || 
                source === window ||
                // select元素有length属性，select[0]将直接返回第一个option
                // form元素也有length属性
                source.tagName && rSelectForm.test(source.tagName) ){
                    target[ target.length++ ] = source;
            }
            else{
                for( ; i < len; i++ ){
                    target[ target.length++ ] = source[i];
                }
            }
        }
        
        return target;
    },

    parseXML : function( data ) {
        var xml, tmp;
        try {
            // 标准浏览器
            if ( window.DOMParser ) { 
                tmp = new DOMParser();
                xml = tmp.parseFromString( data , 'text/xml' );
            }
            // IE6/7/8
            else{
                xml = new ActiveXObject( 'Microsoft.XMLDOM' );
                xml.async = 'false';
                xml.loadXML( data );
            }
        } catch( e ) {
            xml = undefined;
        }
        
        return xml;
    },
    
    parseJSON : function( data ) {
        if ( !data || !E.isString(data) ){
            return null;
        }

        data = data.trim();
        
        // 标准浏览器可以直接使用原生的方法
        if( window.JSON && window.JSON.parse ){
            return window.JSON.parse( data );
        }
        
        if ( rValidchars.test( data.replace( rValidescape, '@' )
            .replace( rValidtokens, ']' )
            .replace( rValidbraces, '')) ) {

            return (new Function( 'return ' + data ))();
        }
    },
    
    /*
     * 首字母大写转换
     * @param { String } 要转换的字符串
     * @return { String } 转换后的字符串 top => Top
     */    
    capitalize : function( str ){
        var firstStr = str.charAt(0);
        return firstStr.toUpperCase() + str.replace( firstStr, '' );
    },
    
    // 对数组进行去重
    distinct : function( arr ){
        var len = arr.length,
            newArr = [],
            obj = {},
            i = 0,            
            item, newItem;

        for( ; i < len; i++ ){
            // 利用object的key不相等来对数组进行去重
            item = arr[i];
            // key带上相应的数据类型来确保对字符串1和数字1的精确去重
            newItem = item + ( typeof item );
            
            if( obj[newItem] !== item ){
                newArr[ newArr.length++ ] = item;
                obj[ newItem ] = item;
            }
        }
        
        return newArr;
    },
    
    noop : function(){}
    
});


// ---------------------------------------------
// --------------@module support----------------
// ---------------------------------------------
 


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


// ---------------------------------------------
// ---------------@module data------------------
// ---------------------------------------------
 


E.cache = {};

var easyData = {

    /*
     * 获取和设置元素的缓存索引值，小于3的索引值都是为特殊元素准备的
     * window 的索引为 0，document 的索引为 1，
     * document.documentElement 的索引为2
     * @param { HTMLElement }
     * @param { Boolean } 为ture的时如果元素没有索引值将创建一个
     * @return { Number } 返回元素的索引值
     */
    getCacheIndex : function( elem, isSet ){
        if( elem.nodeType === 1 ){
            var euid = E.euid;
            return !isSet || euid in elem ? 
                elem[ euid ] : 
                ( elem[ euid ] = ++E.__uuid__ );        
        }
        
        return E.isWindow( elem ) ? 0 :
            elem.nodeType === 9 ? 1 :
            elem.tagName === 'HTML' ? 2 : -1;    
    },

    /*
     * 写入/获取缓存
     * @param { HTMLElement }
     * @param { String } 缓存的命名空间( data:外部调用, event:事件系统, anim:动画系统, null:无命名空间 )
     * @param { String } 缓存的key
     * @param { Anything } 缓存的值
     * @param { Boolean } 是否覆盖( true:覆盖, false:不覆盖，如果缓存的值是undefined将val作为缺省值写入 )
     * @return { Anything } 缓存的值
     */
    data : function( elem, type, name, val, overwrite ){
        var result,
            cache = E.cache,
            isNamespace = type !== null,
            isUndefined = val === undefined,
            index = easyData.getCacheIndex( elem, !isUndefined );
            
        if( index !== undefined ){
            if( !(index in cache) && !isUndefined ){
                cache[ index ] = {};
            }

            cache = cache[ index ];
            
            if( !cache ){
                return;
            }
            
            if( isNamespace ){
                if( !(type in cache) ){
                    if( isUndefined ){
                        return;
                    }
                
                    cache[ type ] = {};
                }
                
                result = cache[ type ][ name ];            
            }
            else{
                result = cache[ name ];    
            }
            
            if( isUndefined || (!overwrite && result !== undefined) ){
                return result;
            }

            if( overwrite || !isUndefined ){                
                isNamespace ? 
                    ( cache[ type ][ name ] = val ) : 
                    ( cache[ name ] = val );
                
                return val;
            }
        }            
    },

    /*
     * 移除缓存
     * @param { HTMLElement }
     * @param { String } 缓存的一级命名空间
     * @param { String } 缓存的key
     */    
    removeData : function( elem, type, name ){
        var index = easyData.getCacheIndex( elem ),
            cacheData = E.cache;
            
        if( index in cacheData ){
            // 有参数就删除指定的数据
            cacheData = cacheData[ index ];
            if( name ){
                if( type !== null ){
                    if( cacheData[type] ){
                        delete cacheData[ type ][ name ];
                    }
                }
                else{
                    delete cacheData[ name ];
                }
            }
            
            // 无参数或空对象都删除所有的数据
            if( !name || (type !== null && E.isEmptyObject(cacheData[type])) ){
                cacheData[ type ] = null;
                delete cacheData[ type ];
            }
            
            if( E.isEmptyObject(cacheData) ){
                delete E.cache[ index ];
                cacheData = undefined;
            }
            
            // 索引值小于3都无需删除DOM元素上的索引值
            if( index < 3 ){
                return;
            }
            
            // 缓存中无数据了则删除DOM元素上的索引值
            if( cacheData === undefined ){
                try{
                    delete elem[ E.euid ];
                }
                catch( _ ){
                    elem.removeAttribute( E.euid );
                }
            }
        }    
    },
    
    hasData : function( elem ){
        var index = easyData.getCacheIndex( elem );
        return !!( index !== undefined && E.cache[index] );
    }

};

E.mix( E.prototype, {

    data : function( name, val ){
        if( E.isPlainObject(name) ){
            E.each( name, function( name, val ){
                this.data( name, val );
            }, this );
            return this;
        }
        
        if( val === undefined ){
            return easyData.data( this[0], 'data', name );
        }
        
        for( var i = 0, len = this.length; i < len; i++ ){
            easyData.data( this[i], 'data', name, val, true );
        }
        
        return this;
    },
        
    removeData : function( name ){        
        for( var i = 0, len = this.length; i < len; i++ ){
            easyData.removeData( this[i], 'data', name );
        }
        
        return this;
    }
    
});


// ---------------------------------------------
// --------------@module selector---------------
// ---------------------------------------------
 


var hasDuplicate = false,    // 是否有重复的DOM元素
    hasParent = false,    // 是否检测重复的父元素
    baseHasDuplicate = true,    // 检测浏览器是否支持自定义的sort函数
    
    // 使用elem.getAttribute( name, 2 )确保这些属性的返回值在IE6/7下和其他浏览器保持一致
    rAttrUrl = /action|cite|codebase|data|href|longdesc|lowsrc|src|usemap/,
    
    rAttr = /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,
    rPseudo = /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/,
    rRelative = /[>\+~][^\d\=]/,
        
    // 使用elem.id比elem.getAttribute('id')的速度要快
    attrMap = {
        'class' : 'className',
        'for' : 'htmlFor',
        'id' : 'id',
        'title' : 'title',
        'type' : 'type'
    };
    
// 检测浏览器是否支持自定义的sort函数
[ 0, 0 ].sort(function(){
    baseHasDuplicate = false;
    return 0;
});
    
var easySelector = {

    /*
     * 对一组DOM元素按照在DOM树中的顺序进行排序
     * 同时删除重复或同级的DOM元素
     * @param { Array } DOM数组
     * @param { Boolean } 是否检测重复的父元素，如果该参数为true，
     * 将删除同级元素，只保留第一个
     * @return { Array } 
     */
    unique : function( nodelist, isParent ){
        if( nodelist.length < 2 ){
            return nodelist;
        }
        var i = 0,
            k = 1,
            len = nodelist.length;
            
        hasDuplicate = baseHasDuplicate;
        hasParent = isParent;
        
        // IE的DOM元素都支持sourceIndex
        if( nodelist[0].sourceIndex ){
            var arr = [],                  
                obj = {},
                elems = [],
                j = 0,
                index, elem;
            
            for( ; i < len; i++ ){
                elem = nodelist[i];
                index = ( hasParent ? elem.parentNode.sourceIndex : elem.sourceIndex ) + 1e8;    
                
                if( !obj[index] ){
                    ( arr[j++] = new String(index) ).elem = elem;
                    obj[index] = true;
                }
            }
            
            arr.sort();
            
            while( j ){
                elems[--j] = arr[j].elem;
            }
            
            arr = null;
            return elems;
        }
        // 标准浏览器的DOM元素都支持compareDocumentPosition
        else{
            nodelist.sort(function( a, b ){
                if( hasParent ){
                    a = a.parentNode;
                    b = b.parentNode;
                }
                
                if( a === b ){
                    hasDuplicate = true;
                    return 0;
                }

                return a.compareDocumentPosition(b) & 4 ? -1 : 1;
            });

            if( hasDuplicate ){
                for( ; k < nodelist.length; k++ ){
                    elem = nodelist[k];
                    if( hasParent ? elem.parentNode === nodelist[k - 1].parentNode : elem === nodelist[k - 1] ){
                        nodelist.splice( k--, 1 );
                    }
                }
            }
            
            return nodelist;
        }
    },
            
    getAttribute : function( elem, name ){
        return attrMap[ name ] ? elem[attrMap[name]] || null :
            rAttrUrl.test( name ) ? elem.getAttribute( name, 2 ) :
            elem.getAttribute( name );
    },
    
    // 查找nextSibling元素
    next : function( prev ){
        prev = prev.nextSibling;
        while( prev ){
            if( prev.nodeType === 1 ){
                return prev;
            }
            prev = prev.nextSibling;
        };
    },
    
    // 查找previousSibling元素
    prev : function( next ){
        next = next.previousSibling;
        while( next ){
            if( next.nodeType === 1 ){
                return next;
            }
            next = next.previousSibling;
        };
    },
    
    /*
     * 选择器的适配器
     * @param { String } 选择器字符串
     * @param { Object } 查找范围
     * @param { String } 关系选择器的第二级选择器
     * @return { Array } 
     * 无查找范围返回[ 选择器类型, 处理后的基本选择器, tagName ]
     * 有查找范围将返回该选择器的查找结果
     */
    adapter : function( selector, context, nextSelector ){
        var index, name, tagName, matches, type;
        
        type = nextSelector !== undefined ? 'RELATIVE' :
            ~selector.indexOf( ':' ) ? 'PSEUDO' :
            ~selector.indexOf( '#' ) ? 'ID' :
            ~selector.indexOf( '[' ) ? 'ATTR' :
            ~selector.indexOf( '.' ) ? 'CLASS' : 'TAG';            
        
        if( !context ){
            switch( type ){            
                case 'CLASS' :                 
                    index = selector.indexOf( '.' );                
                    name = ' ' + selector.slice( index + 1 ) + ' ';    
                    tagName = selector.slice( 0, index ).toUpperCase();                
                break;                
                
                case 'TAG' :                
                    name = selector.toUpperCase();                    
                break;

                case 'ID' :                
                    index = selector.indexOf( '#' );                
                    name = selector.slice( index + 1 );        
                    tagName = selector.slice( 0, index ).toUpperCase();                    
                break;
            }
            
            return [ type, name, tagName ];
        }
        
        return easySelector.finder[ type ]( selector, context, nextSelector );
    },

    indexFilter : function( name, i ){
        return name === 'even' ? i % 2 === 0 : 
            name === 'odd' ? i % 2 === 1 :
            ~name.indexOf( 'n' ) ? ( name === 'n' || i % parseInt(name) === 0 ) :
            parseInt( name ) === i;        
    }
    
};

easySelector.finder = {

    // id选择器
    ID : function( selector, context ){
        return context[0].getElementById( selector.slice(selector.indexOf('#') + 1) );
    },
    
    // class选择器
    CLASS : function( selector, context ){        
        var elems = [],
            index = selector.indexOf( '.' ),
            tagName = selector.slice( 0, index ) || '*',
            // 选择器两边加空格以确保完全匹配(如：val不能匹配value) 
            className = ' ' + selector.slice( index + 1 ) + ' ',
            i = 0, 
            l = 0,
            elem, len, name;
        
        context = easySelector.finder.TAG( tagName, context, true );            
        len = context.length;
        
        for( ; i < len; i++ ){
            elem = context[i];
            name = elem.className;
            if( name && ~(' ' + name + ' ').indexOf(className) ){
                elems[l++] = elem;
            }
        }

        elem = context = null;
        return elems;
    },
    
    // tag选择器
    TAG : function( selector, context, noCheck ){
        var elems = [],
            prevElem = context[0],
            contains = E.contains,
            makeArray = E.makeArray,
            len = context.length,
            i = 0,
            elem;

        // class选择器和context元素只有一个时不需要检测contains的情况
        noCheck = noCheck || len === 1;
        
        for( ; i < len; i++ ){
            elem = context[i];
            if( !noCheck ){
                // 检测contains情况确保没有重复的DOM元素
                if( !contains(prevElem, elem) ){
                    prevElem = elem;    
                    elems = makeArray( elem.getElementsByTagName(selector), elems );
                }
            }            
            else{
                elems = makeArray( elem.getElementsByTagName(selector), elems );
            }
        }
        
        prevElem = elem = context = null;
        return elems;
    },
    
    // 属性选择器
    ATTR : function( selector, context, isFiltered ){
        var elems = [],
            matches = selector.match( rAttr ),
            getAttribute = easySelector.getAttribute,
            attr = matches[1],
            symbol = matches[2] || undefined,
            attrVal = matches[5] || matches[4],            
            i = 0,
            l = 0,
            len, elem, val, matchAttr, sMatches, filterBase, name, tagName;            
            
        selector = selector.slice( 0, selector.indexOf('[') ) || '*';
        context = isFiltered ? context : easySelector.adapter( selector, context );
        len = context.length;
        sMatches = easySelector.adapter( selector );
        filterBase = easySelector.filter[ sMatches[0] ];
        name = sMatches[1];
        tagName = sMatches[2];       
        
        for( ; i < len; i++ ){
            elem = context[i];
            if( !isFiltered || filterBase(elem, name, tagName) ){
                val = getAttribute( elem, attr );        
                // 使用字符串的方法比正则匹配要快
                matchAttr = val === null ? 
                            symbol === '!=' && val !== attrVal :
                            symbol === undefined ? val !== null :
                            symbol === '=' ? val === attrVal :
                            symbol === '!=' ? val !== attrVal :
                            symbol === '*=' ? ~val.indexOf( attrVal ) :
                            symbol === '~=' ? ~( ' ' + val + ' ' ).indexOf( ' ' + attrVal + ' ' ) :
                            symbol === '^=' ? val.indexOf( attrVal ) === 0 :
                            symbol === '$=' ? val.slice( val.length - attrVal.length ) === attrVal :                            
                            symbol === '|=' ? val === attrVal || val.indexOf( attrVal + '-' ) === 0 :
                            false;
        
                if( matchAttr ){
                    elems[l++] = elem;
                }
            }
        }
        
        elem = context = null;    
        return elems;
    },
    
    // 关系选择器
    RELATIVE : function( selector, context, nextSelector ){
        var    matches = easySelector.adapter( nextSelector ),
            type = matches[0],
            filter = easySelector.filter[type] || type,
            name = matches[1] || nextSelector;
            
        return easySelector.filter.relatives[ selector ]( filter, name, matches[2], context );
    },
    
    // 伪类选择器
    PSEUDO : function( selector, context, isFiltered ){
        var elems = [],
            pMatches = selector.match( rPseudo ),
            pseudoType = pMatches[1],    
            filterName = pMatches[3],
            next = easySelector.next,
            prev = easySelector.prev,
            filter = easySelector.filter,
            sMatches, filterBase, name, selectorType, len, i,
            parent, child, elem, nextElem, siblingElem;
            
        selector = selector.slice( 0, selector.indexOf(':') ) || '*';
        context = isFiltered ? context : easySelector.adapter( selector, context );
        len = context.length;
        sMatches = easySelector.adapter( selector );
        selectorType = sMatches[0];
        filterBase = filter[ selectorType ];
        name = sMatches[1];
        
        // 处理带"-"的索引(位置)伪类选择器
        if( ~pseudoType.indexOf('-') ){
            var pseudoNames = pseudoType.split( '-' ),
                type = pseudoNames[0],
                extras = filterName ? filterName.match( /n\s?(\+|\-)\s?(\d+)/ ) : false,
                extra = extras ? parseInt( extras[2] ) : undefined,
                isChild = pseudoNames[pseudoNames.length -1] === 'child',
                isLast = pseudoNames[1] === 'last',
                first = isLast ? 'lastChild' : 'firstChild',
                sibling = isLast ? 'previousSibling' : 'nextSibling',
                add = isLast ? 'unshift' : 'push',
                filterFn, flag, index;
                
            if( selectorType !== 'TAG' && !isChild ) return elems;

            switch( type ){
                case 'nth' :
    
                    parent = [];
                    
                    for( i = 0; i < len; i++ ){
                        parent[ parent.length++ ] = context[i].parentNode;
                    }
                    
                    parent = easySelector.unique( parent );
                    
                    // 索引过滤器
                    filterFn = easySelector.indexFilter;

                    for( i = 0; child = parent[i++]; ){
                        elem = child[first];
                        index = 0;
                        
                        while( elem ){
                            if( elem.nodeType === 1 && (isChild || filterBase(elem, name)) ){
                                flag = filterFn( filterName, ++index );

                                if( !isChild || filterBase(elem, name) ){
                                    if( extras ){
                                        if ( (extras[1] === '+' ? index - extra : index + extra) % parseInt(filterName) === 0 ){
                                            elems[add]( elem );
                                        }
                                    }
                                    else if( flag ){
                                        elems[add]( elem );
                                    }
                                }
                            }
                            
                            elem = elem[sibling];
                        }
                    }
                    
                break;
                
                case 'only' : 
            
                    context = easySelector.unique( context, true );
                    len = context.length;
                    
                    for( i = 0; i < len; i++ ){
                        elem = context[i];
                        if( isChild ){
                            if( !next(elem) && !prev(elem) ){
                                elems[ elems.length++ ] = elem;
                            }
                        }
                        else{
                            index = 0;
                            nextElem = elem.nextSibling;
                                
                            while( nextElem ){
                                if( nextElem.nodeType === 1 && filterBase(nextElem, name) ){
                                    index += 1;
                                    break;
                                }                                
                                nextElem = nextElem.nextSibling;
                            }
                            
                            if( !index ){
                                elems[ elems.length++ ] = elem;
                            }
                        }
                    }
                    
                break;
                
                default :
                
                    filterFn = type === 'last' ? next : prev;                
            
                    for( i = 0; i < len; i++ ){
                        elem = context[i];
                        siblingElem = filterFn( elem );
                        flag = isChild ? 
                            !siblingElem :
                            ( !siblingElem || siblingElem.tagName !== name );
                            
                        if( flag && filterBase(elem, name) ){
                            elems[ elems.length++ ] = elem;                
                        }
                    }
            }
            
        }
        // 处理非索引伪类选择器
        else{
            if( filterName ){
                sMatches = easySelector.adapter( filterName );
            }
            
            for( i = 0; i < len; i++ ){
                elem = context[i];
                if( filter.pseudos[pseudoType](elem, sMatches[1], sMatches[2], filter[sMatches[0]]) ){
                    elems[ elems.length++ ] = elem;    
                }
            }
        }
    
        parent = child = elem = nextElem = siblingElem = context = null;
        return elems;
    }
};

easySelector.filter = {

    // ID过滤器    
    ID : function( elem, name, tagName ){
        var isTag = isTag = tagName === '' || elem.tagName === tagName;
        return isTag && elem.id === name;
    },
    
    // class过滤器
    CLASS : function( elem, name, tagName ){
        var className = elem.className,
            isTag = tagName === '' || elem.tagName === tagName;                
        return isTag && className && ~( ' ' + className + ' ' ).indexOf( name );
    },
    
    // tag过滤器
    TAG : function( elem, name ){
        return elem.tagName === name;
    },

    // 伪类选择器的过滤器
    pseudos : {
    
        empty : function( elem ){            
            return !elem.firstChild;
        },

        not : function( elem, name, tagName, filter ){
            return !filter( elem, name, tagName );
        },
        
        form : function( elem, attr, val ){
            return elem.tagName === 'INPUT' && elem.type !== 'hidden' && elem[attr] === val; 
        },    
        
        enabled : function( elem ){
            return this.form( elem, 'disabled', false );
        },
        
        disabled : function( elem ){
            return this.form( elem, 'disabled', true );
        },
        
        checked : function( elem ){
            return this.form( elem, 'checked', true );
        },
        
        selected : function( elem ){
            return elem.tagName === 'OPTION' && elem.selected === true;
        },

        hidden : function( elem ){            
            return ( !elem.offsetWidth && !elem.offsetHeight ) || ( elem.currentStyle && elem.currentStyle.display === "none" );
        },
        
        visible : function( elem ){
            return !this.hidden( elem );
        },

        animated : function( elem ){
            return easyData.data( elem, 'anim', 'animQueue' ) !== undefined;
        }
        
    },
        
    // 关系选择器的过滤器    
    relatives : {
        
        // 子节点        
        '>' : function( filter, name, tagName, context ){                
            var    isType = E.isString(filter),                
                elems = [],                    
                i = 0,
                l = 0,
                len = context.length,
                child, clen, children, j;            
            
            for( ; i < len; i++ ){
                children = context[i].childNodes;
                clen = children.length;
                
                for( j = 0; j < clen; j++ ){
                    child = children[j];
                    if( child.nodeType === 1 && (isType || filter(child, name, tagName)) ){
                        elems[l++] = child;    
                    } 
                }
            }

            child = children = context = null;
            return isType ? easySelector.finder[filter](name, elems, true) : elems;
        },    
        
        // 相邻节点
        '+' : function( filter, name, tagName, context ){
            var    isType = E.isString( filter ),
                elems = [],
                len = context.length,
                i = 0,
                l = 0,
                nextElem;
                
            for( ; i < len; i++ ){
                nextElem = easySelector.next( context[i] );
                if( nextElem && (isType || filter(nextElem, name, tagName)) ){
                    elems[l++] = nextElem;
                }
            }
            
            nextElem = context = null;
            return isType ? easySelector.finder[filter](name, elems, true) : elems;
        },
        
        // 同级节点
        '~' : function( filter, name, tagName, context ){
            var    isType = E.isString( filter ),
                elems = [],
                i = 0,
                l = 0,
                len, nextElem;

            context = easySelector.unique( context, true );
            len = context.length;
            
            for( ; i < len; i++ ){
                nextElem = context[i].nextSibling;                
                while( nextElem ){
                    if( nextElem.nodeType === 1 && (isType || filter(nextElem, name, tagName)) ){
                        elems[l++] = nextElem;
                    }
                    nextElem = nextElem.nextSibling;
                }
            }
    
            nextElem = context = null;
            return isType ? easySelector.finder[filter](name, elems, true) : elems;
        }        
        
    }    
};

    
E.mix( E, {
    
    unique : function( nodelist ){
        return easySelector.unique( nodelist );
    },
    
    // 检测a元素是否包含了b元素
    contains : function( a, b ){
        // 标准浏览器支持compareDocumentPosition
        if( a.compareDocumentPosition ){
            return !!( a.compareDocumentPosition(b) & 16 );
        }
        // IE支持contains
        else if( a.contains ){
            return a !== b && a.contains( b );
        }

        return false;
    },
    
    // DOM元素过滤器
    filter : function( source, selector ){
        var target = [],
            l = 0,
            matches, filter, type, name, elem, tagName, len, i;
            
        source = E.makeArray( source );
        len = source.length;
            
        if( E.isString(selector) ){
            matches = easySelector.adapter( selector );
            filter = easySelector.filter[ matches[0] ];
            name = matches[1];
            tagName = matches[2];
            if( !filter ){
                type = matches[0];
            }
            
            if( type ){
                target = easySelector.finder[ type ]( selector, source, true );
            }
            else{
                for( i = 0; i < len; i++ ){
                    elem = source[i];
                    if( filter(elem, name, tagName) ){
                        target[ l++ ] = elem;    
                    }                    
                }
            }
        }        
        else if( E.isFunction(selector) ){
            for( i = 0; i < len; i++ ){
                elem = source[i];
                if( selector.call(elem, i) ){
                    target[ l++ ] = elem;
                }
            }            
        }
        
        source = elem = null;
        return target;
    },

    query : function( selector, context ){
        context = context || document;
        
        if( !E.isString(selector) ){
            return context;
        }
        
        var elems = [],
            contains = E.contains,
            makeArray = E.makeArray,
            nodelist, selectors, splitArr, matchArr, splitItem, matchItem, prevElem,
            lastElem, nextMatch, matches, elem, len, i;
        
        // 标准浏览器和IE8支持querySelectorAll方法
        if( document.querySelectorAll ){
            try{                
                context = makeArray( context );
                len = context.length;
                prevElem = context[0];
                for( i = 0; i < len; i++ ){
                    elem = context[i];
                    if( !contains(prevElem, elem) ){
                        prevElem = elem;
                        elems = makeArray( elem.querySelectorAll(selector), elems );
                    }
                }
                prevElem = elem = context = null;
                return elems;                
            }
            catch( e ){};
        }
        
        splitArr = selector.split( ',' );
        len = splitArr.length;
        
        for( i = 0; i < len; i++ ){
            nodelist = [ context ];
            splitItem = splitArr[i];
            
            // 将选择器进行分割
            // #list .item a => [ '#list', '.item', 'a' ]
            if( rRelative.test(splitItem) ){
                splitItem = splitItem.replace( /[>\+~]/g, function( symbol ){
                    return ' ' + symbol + ' ';
                });
            }
            
            matchArr = splitItem.match( /[^\s]+/g );

            for( var j = 0, clen = matchArr.length; j < clen; j++ ){
                matchItem = matchArr[j];                                
                lastElem = makeArray( nodelist[ nodelist.length - 1 ] );
                
                // 关系选择器要特殊处理
                nextMatch = /[>\+~]/.test( matchItem ) ? matchArr[++j] : undefined; 
                elem = easySelector.adapter( matchItem, lastElem, nextMatch );    

                if( !elem ){
                    return elems;
                }
                
                nodelist[ nodelist.length++ ] = elem;
            }

            elems = makeArray( nodelist[nodelist.length - 1], elems );        
        }
        
        nodelist = lastElem = context = elem = null;
        // 逗号选择器要删除重复的DOM元素
        return len > 1 ? E.unique( elems ) : elems;
    }
    
});


// ---------------------------------------------
// ----------------@module node-----------------
// ---------------------------------------------
 


var rHtml5Tags = /abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video/i,
    rXhtml =  /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rSingleTag = /^<(\w+)\s*\/?>(?:<\/\1>)?$/,
    rCssJsTag = /(<(?:script|link|style))/ig,
    rTagName = /<([\w:]+)/,
    rTbody = /<tbody/i,
    
    slice = Array.prototype.slice,

    // 用于判断是否为可执行的script
    scriptTypes = {
        'text/javascript' : true,
        'text/ecmascript' : true,
        'application/ecmascript' : true,
        'application/javascript' : true, 
        'text/vbscript' : true
    },
    
    // 需要进行包裹的元素以及与之对应的包裹元素
    wrapMap = {
        option : [ 1, '<select multiple="multiple">', '</select>' ],
        legend : [ 1, '<fieldset>', '</fieldset>' ],
        thead : [ 1, '<table>', '</table>' ],
        tr : [ 2, '<table><tbody>', '</tbody></table>' ],
        td : [ 3, '<table><tbody><tr>', '</tr></tbody></table>' ],
        col : [ 2, '<table><tbody></tbody><colgroup>', '</colgroup></table>' ],
        area : [ 1, '<map>', '</map>' ],
        normal : [ 0, '', '' ]
    };
    
wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

var easyNode = {
    
    // 选取所有后代元素
    getAll : function( elem ){
        return elem.getElementsByTagName ? elem.getElementsByTagName( '*' ) :
            elem.querySelectorAll ? elem.querySelectorAll( '*' ) : [];
    },
    
    /*
     * 克隆元素时IE浏览器的一些BUG处理
     * @param { HTMLElement } 原DOM元素
     * @param { HTMLElement } DOM元素的副本
     */
    cloneFixAttrs : function( source, target ){
        // 文档碎片对象不需要修复
        if( target.nodeType === 1 ){
            var tagName = target.tagName,
                euid = E.euid;
        
            // IE6-8在克隆DOM元素时也会把通过attachEvent绑定的事件
            // 一起克隆，其他浏览器就不会，为了兼容性，使用IE特有
            // 的方法可以清除attributes，附带清除了事件，然后将源DOM
            // 的attirbutes再添加回来，此时不会再添加事件了
            if( target.clearAttributes ){
                // clearAttributes不会清除id和css样式
                target.clearAttributes();
                target.mergeAttributes( source );
            }
            
            // 清除克隆元素的缓存的索引值
            if( target.getAttribute(euid) ){      
                target.removeAttribute( euid );
            }

            // IE6-8没有复制其内部元素
            if( tagName === 'OBJECT' ){
                target.outerHTML = source.outerHTML;
            }
            else if( tagName === 'INPUT' &&
                    ( source.type === 'checkbox' || source.type === 'radio' )
                    ){
                    // IE6-7没有复制其checked值
                    target.checked = source.checked;
                    // IE9没有复制默认的value
                    if( target.value !== source.value ){
                        target.value = source.value;
                    }
            }
            // IE6-8没有复制选中状态
            else if( tagName === 'OPTION' ){
                target.selected = source.defaultSelected;
            }
            // IE6-8没有复制默认值
            else if( tagName === 'INPUT' || tagName === 'TEXTAREA' ){
                target.defaultValue = source.defaultValue;
            }
        }
    },
    
    /*
     * 克隆DOM元素的事件( 只是克隆使用easyJS的事件系统绑定的事件 )
     * @param { HTMLElement } 原DOM元素
     * @param { HTMLElement } DOM元素的副本
     */    
    cloneDataAndEvents : function( source, target ){
        if( !easyData.hasData(source) || target.nodeType !== 1 ){
            return;
        }
        
        var index = source[ E.euid ],
            cacheData = E.cache[ index ],
            data = cacheData.data,
            event = cacheData.event,
            name, type, selector, names, handles, result, namespace, extraData, i, len;

        // 克隆display的数据
        if( cacheData.display ){
            easyData.data( target, null, 'display', cacheData.display );
        }
            
        // 克隆普通的数据    
        for( name in data ){
            easyData.data( target, 'data', name, data[name] );
        }
        
        // 克隆事件
        for( name in event ){
            handles = event[ name ];
            // 分割name，可能有事件代理的绑定如：'#demo_list_click'
            names = name.split( '_' );
            // 有事件代理则取得选择器
            if( names.length > 1 ){
                type = names.pop();
                selector = names.join( '_' ); 
            }
            else{
                type = names[0];
            }
            
            i = 1;
            len = handles.length;
            
            // 遍历原DOM元素的事件处理函数绑定到DOM元素的副本中
            for( ; i < len; i++ ){
                result = handles[i];
                namespace = result.namespace;
                extraData = result.extraData;

                if( namespace ){
                    type += ( '.' + namespace );
                }
                
                if( !selector ){
                    E( target ).on( type, extraData, result.handle );
                }
                else{                    
                    E( target ).on( type, selector, extraData, result.handle );
                }
            }
        }
    },
    
    /*
     * 克隆DOM元素并修复一些克隆的BUG
     * @param { HTMLElement } 待克隆的DOM
     * @param { Boolean } 是否克隆该元素使用E.prototype.on方法绑定的事件
     * @param { Boolean } 是否克隆该元素的子元素的事件( 如无参数则用复制第二个参数 )
     * @return { HTMLElement } 克隆后的DOM元素副本
     */    
    clone : function( elem, dataAndEvents, deepDataAndEvents ){
        var doc = elem.ownerDocument,
            outerHTML = elem.outerHTML,
            tagName = elem.tagName,
            elems, div, clone, clones, i, len;

        // 修复IE6下克隆HTML5新元素时出现的一系列问题            
        if( tagName && rHtml5Tags.test(tagName) && outerHTML && !E.support.cloneHTML5 ){                
            div = doc.createElement( 'div' );                        
            doc.body.appendChild( div );        
            div.innerHTML = outerHTML;    
            doc.body.removeChild( div );    
        }                
        
        clone = div ? div.firstChild : elem.cloneNode( true );        
        
        if( (E.support.cloneEvent || !E.support.cloneChecked) &&
            (elem.nodeType === 1 || elem.nodeType === 11) ){

            // 移除克隆DOM元素的事件
            easyNode.cloneFixAttrs( elem, clone );
            elems = easyNode.getAll( elem );
            clones = easyNode.getAll( clone );
            len = elems.length;
            
            // 移除克隆DOM的后代元素的事件
            for( i = 0; i < len; i++ ){
                if( clones[i] ){
                    easyNode.cloneFixAttrs( elems[i], clones[i] );
                }
            } 
        }
    
        if( dataAndEvents ){
            easyNode.cloneDataAndEvents( elem, clone );
            
            if( deepDataAndEvents ){
                elems = easyNode.getAll( elem );
                clones = easyNode.getAll( clone );        
                len = elems.length;
                
                for( i = 0; i < len; i++ ){
                    easyNode.cloneDataAndEvents( elems[i], clones[i] );
                } 
            }
        }
        
        elems = div = clones = null;
        
        return clone;
    },    
    
    // 功能类似于easy模块中的init，但是返回值是纯数组
    getNodelist : function( arg, context ){
        var elems;
        if( typeof arg === 'string' ){
            elems = E.create( arg, context );
            return elems ? E.makeArray( elems ) : [ context.createTextNode( arg ) ];
        }
        
        if( arg.nodeType === 1 || arg.nodeType === 11 ){
            return [ arg ];
        }
        
        if( typeof arg.length === 'number' ){        
            return E.makeArray( arg );
        }

        return [];
    },
    
    // 清除缓存数据和事件
    cleanData : function( elems ){
        if( !elems.length ){
            elems = [ elems ];
        }
        
        var len = elems.length,
            i = 0,
            elem, index, cacheData, event, name, type, selector, names;
            
        for( ; i < len; i++ ){
            elem = elems[i];
            
            if( elem.nodeType !== 1 || !easyData.hasData(elem) ){
                continue;
            }
            
            index = elem[ E.euid ];
            cacheData = E.cache[ index ];
            event = cacheData.event;
                
            delete cacheData.data;
            delete cacheData.display;
            
            // 清除事件
            for( name in event ){
                // 分割name，可能有事件代理的绑定如：'#demo_list_click'
                names = name.split( '_' );
                // 有事件代理则取得选择器
                if( names.length > 1 ){
                    type = names.pop();
                    selector = names.join( '_' ); 
                }
                else{
                    type = names[0];
                }

                if( !selector ){
                    E( elem ).un( type );
                }
                else{                    
                    E( elem ).un( type, selector );
                }
            }
            
            if( E.isEmptyObject(cacheData) ){
                delete E.cache[ index ];
            }
        }

    },

    /*
     * DOM插入、包裹、替换的公用方法
     * @param { easyJS Object / String / HTMLElement / Nodelist } 
     * @param { Function } insert适配器
     * @param { Boolean } 是否反向操作
     * @param { Document } 根文档对象
     * @return { easyJS Object } 
     */        
    insert : function( target, fn, isReverse, context ){
        var source, tlen, slen, lastIndex, i, fragment,
            getNodelist = easyNode.getNodelist,
            elems = [];

        // 反向操作替换源元素和目标元素
        if( isReverse ){
            source = getNodelist( target[0], context );
            target = this;
        }
        else{
            source = this;
        }
        
        slen = source.length;
        tlen = target.length;
        lastIndex = slen - 1;

        for( i = 0; i < tlen; i++ ){
            elems = E.makeArray( getNodelist(target[i], context), elems );
        }
            
        // 只有一个元素直接赋值
        if( elems.length === 1 ){
            fragment = elems[0];
        }
        // 多个元素将先添加到文档碎片中
        else{
            fragment = context.createDocumentFragment();
            for( i = 0; i < elems.length; i++ ){
                fragment.appendChild( elems[i] );
            }            
        }
        // 先使用克隆的元素，最后一个才使用源元素    
        for( i = 0; i < slen; i++ ){
            fn.call( source[i], i === lastIndex ? fragment : easyNode.clone(fragment) );
        }
        
        fragment = elems = target = null;
        return this;
    },

    // insert适配器，各种DOM插入、包裹、替换使用的方法
    insertAdapder : {
        
        append : function( source, target ){
            source.appendChild( target );
            source = target = null;
        },
        
        prepend : function( source, target ){
            source.insertBefore( target, source.firstChild );
            source = target = null;
        },
        
        before : function( source, target ){
            source.parentNode.insertBefore( target, source );
            source = target = null;
        },
        
        after : function( source, target ){
            source.parentNode.insertBefore( target, source.nextSibling );
            source = target = null;
        },
        
        wrap : function( source, target ){
            var parent = source.parentNode;
            target = target.parentNode ? easyNode.clone( target ) : target;
            if( parent ){
                parent.insertBefore( target, source );
            }
            target.appendChild( source );
            source = target = parent = null;
        },
        
        unwrap : function( source ){
            var parent = source.parentNode,
                fragment = source.ownerDocument.createDocumentFragment(),
                child, ancestor;
                
            if( parent.nodeType === 1 && parent !== source.ownerDocument.body ){
                // 将所有source的父级元素的子元素添加到文档碎片中
                while( (child = parent.firstChild) ){
                    fragment.appendChild( child );
                }
                
                ancestor = parent.parentNode;            
                // 将文档碎片中的元素添加到父级元素的前面
                ancestor.insertBefore( fragment, parent );
                // 此时可以删除父元素了
                ancestor.removeChild( parent );
            }
            source = parent = fragment = ancestor = child = null;
        },
        
        replace : function( source, target ){
            source.parentNode.replaceChild( target, source );
            source = target = null;
        }
        
    },
    
    // Node过滤器
    filter : {
        
        /*
         * 父级元素过滤器
         * @param { String / Function } 过滤器名字、过滤器函数
         * 参数为字符串时，是属性或伪类选择器，只返回查找结果，不过滤，
         * 参数为过滤函数时，是基本选择器，查找的同时将进行过滤
         * @param { Boolean } 是否对查找结果进行过滤
         * @param { String } 处理后的基本选择器
         * @param { String } tagName
         * @param { Object } 查找范围
         */
        parent : function( filter, flag, name, tagName, context ){
            var isType = E.isString( filter ),
                elems = [],
                i = 0,
                l = 0,
                len, elem;

            // 同级元素先去重只保留第一个同级元素然后再查找父元素
            context = easySelector.unique( context, true );        
            len = context.length;        
            
            for( ; i < len; i++ ){
                elem = context[i].parentNode;
                while( elem ){                
                    if( elem.nodeType !== 11 && (flag || filter(elem, name, tagName)) ){
                        elems[ l++ ] = elem;
                        // 非伪类和属性选择器时查找到结果将直接break，parent始终只有一个元素
                        if( !isType ){
                            break;
                        }                    
                    }
                    // 如果有选择器，将一直查找到document，直到匹配成功
                    elem = elem.parentNode;
                }
            }
            
            elem = context = null;
            return elems;
        },
        
        // 子元素过滤器
        children : function( filter, flag, name, tagName, context ){
            var len = context.length,
                elems = [],
                i = 0,
                l = 0,
                len, clen, children, elem, j;    
                
            for( ; i < len; i++ ){
                // childNodes的结果中可能包含文本或其他类型的节点
                children = context[i].childNodes;
                clen = children.length;
                
                for( j = 0; j < clen; j++ ){
                    elem = children[j];
                    if( elem.nodeType === 1 && (flag || filter(elem, name, tagName)) ){
                        elems[ l++ ] = elem;
                    }                
                }
            }
            
            elem = children = context = null;
            return elems;
        },
        
        // 同级元素过滤器
        siblings : function( filter, flag, name, tagName, context ){
            var len = context.length,
                elems = [],
                i = 0,
                l = 0,
                elem, self;    

            for( ; i < len; i++ ){
                self = context[i];
                // 先查找到该元素的第一个同级元素
                elem = self.parentNode.firstChild;
                
                while( elem ){
                    // 需要过滤掉自身
                    if( elem.nodeType === 1 && elem !== self && (flag || filter(elem, name, tagName)) ){
                        elems[ l++ ] = elem;
                    }
                    // 使用next去遍历同级元素
                    elem = elem.nextSibling;
                }            
            }

            elem = context = null;
            return elems;
        }
        
    }
    
};

// next和prev过滤器的组装
E.each({    
    next : 'nextSibling',
    prev : 'previousSibling'    
}, function( key, val ){
    
    easyNode.filter[ key ] = function( filter, flag, name, tagName, context ){
        var isType = E.isString( filter ),
            len = context.length,
            elems = [],
            i = 0,
            l = 0,
            elem;

        for( ; i < len; i++ ){
            elem = context[i][val];
            while( elem ){                
                if( elem.nodeType === 1 && (flag || filter(elem, name, tagName)) ){
                    elems[ l++ ] = elem;
                    // 非伪类和属性选择器时查找到结果将直接break，next或prev始终只有一个元素
                    if( !isType ){
                        break;
                    }
                }                    
                elem = elem[val];
            }
        }

        elem = context = null;
        return elems;        
    };
    
});


E.mix( E, {

    /*
     * 使用HTML字符串创建DOM节点
     * @param { String } HTML字符串
     * @param { Document } 
     * @return { Array } DOM数组 
     */
    create : function( html, doc ){
        doc = doc || document;
        if( !html ) return;
        
        var tagName = html.match( rTagName ),
            div, fragment, wrap, depth, scripts, tbodys, tbody,
            noTbody, targetScript, sourceScript, attrs,
            attr, i, len, jLen, brs, br;
        
        if( tagName ){
            tagName = tagName[1];
        }
        else{
            return;
        }
        
        // 如果只是一个单独的标签直接创建一个DOM元素即可
        if( rSingleTag.test(html) ){
            return [ doc.createElement( tagName ) ];
        }
        // 非单独标签使用innerHTML来创建
        else{
            // <div/> => <div></div>
            html = html.replace( rXhtml, '<$1><' + '/$2>' );            
            div = doc.createElement( 'div' );
            fragment = doc.createDocumentFragment();
            // 一些特殊的元素不能直接innerHTML，需要在外部包裹一个元素
            wrap = wrapMap[ tagName ] || wrapMap.normal;    
            depth = wrap[0];
            
            // 使用innerHTML创建script、link、style元素在IE6/7下
            // 会报错，在该元素前加一个DOM元素可以避免报错
            if( !E.support.htmlSerialize ){
                html = html.replace( rCssJsTag, '<br class="easyJS_fix"/>$1' );
            }

            fragment.appendChild( div );
            div.innerHTML = wrap[1] + html + wrap[2];

            // 去掉外部包裹的元素
            while( depth-- ){
                div = div.lastChild;
            }

            // IE6/7在创建table元素时会自动添加一个tbody标签
            // 需要将自动创建的tbody删除
            if( !E.support.tbody ){
                noTbody = !rTbody.test( html );
                tbodys = div.getElementsByTagName( 'tbody' );                    
                len = tbodys.length;    
                
                if( len && noTbody ){
                    for( i = 0; i < len; i++ ){
                        tbody = tbodys[i];
                        // 自动创建的tbody肯定没有子元素
                        if( !tbody.childNodes.length ){
                            tbody.parentNode.removeChild( tbody );
                        }
                    }
                }
            }
            
            scripts = div.getElementsByTagName( 'script' );
            
            // 使用innerHTML创建的script无法直接执行
            // 需要重新创建一个script元素，再将原来的script元素替换
            if( scripts.length ){
                targetScript = doc.createElement( 'script' );                    
                len = scripts.length;    
                    
                for( i = 0; i < len; i++ ){
                    sourceScript = scripts[i];
                    // 判断script元素的type属性是否为可执行的script类型
                    if( scriptTypes[ sourceScript.type.toLowerCase() ] || !sourceScript.type ){
                        attrs = sourceScript.attributes;
                        jLen = attrs.length;
                        // 原来script元素的attributes属性也要复制过来
                        for( var j = 0; j < jLen; j++ ){
                            attr = attrs[j];
                            // 浏览器默认添加的attributes属性不需要复制
                            if( attr.specified ){
                                targetScript[ attr.name ] = [ attr.value ];
                            }
                        }
                        
                        targetScript.text = sourceScript.text;
                        sourceScript.parentNode.replaceChild( targetScript, sourceScript );
                    }
                }
            }
            
            // 将之前添加在script、link、style元素前的DOM元素删除
            if( !E.support.htmlSerialize ){
                brs = div.getElementsByTagName( 'br' );                
                len = brs.length;
                
                for( i = 0; i < len; i++ ){
                    br = brs[i];
                    if( br.className === 'easyJS_fix' ){
                        br.parentNode.removeChild( br );
                    }
                }
            }
            
            scripts = tbodys = tbody = targetScript = sourceScript = brs = br = null;
            return div.childNodes;
        }
    }
    
});


E.mix( E.prototype, {

    forEach : function( fn ){
        var len = this.length,
            i = 0;
            
        for( ; i < len; i++ ){
            fn.call( this[i], i, this );
        }
        
        return this;
    },
    
    find : function( selector ){        
        if( typeof selector === 'string' ){            
            return E.makeArray( E.query(selector, this), E() );                    
        }
    },
    
    slice : function( start, end ){
        if( end === undefined ){
            end = this.length;
        }

        return E.makeArray(slice.call(this, start, end), E());
    },
    
    first : function(){
        return E( this[0] );
    },
    
    last : function(){
        return E( this[this.length - 1] );
    },
    
    eq : function( index ){
        return index === -1 ? this.slice( index ) : this.slice( index, +index + 1 );
    },
    
    filter : function( selector ){        
        return E.makeArray( E.filter(this, selector), E() );
    },
    
    is : function( selector ){
        return this.filter( selector ).length > 0;
    },
    
    not : function( selector ){
        if( !selector ){
            return this;
        }
        
        var matches = easySelector.adapter( selector ),
            filter = easySelector.filter[ matches[0] ],
            name = matches[1],
            tagName = matches[2],
            elems = E();
            
        if( !filter ){
            return this;
        }    
        
        this.forEach(function(){
            if( !filter(this, name, tagName) ){
                elems[ elems.length++ ] = this;
            }
        });
        
        return elems;        
    },    
        
    empty : function(){
        return this.forEach(function(){            
            easyNode.cleanData( easyNode.getAll(this) );            
            
            while( this.firstChild ){
                this.removeChild( this.firstChild );
            }
        });
    },
    
    remove : function( selector, keepData ){
        var elems = E.isString( selector ) ? this.find( selector ) : this;
        
        elems.forEach(function(){
            if( !keepData ){
                easyNode.cleanData( this );
                easyNode.cleanData( easyNode.getAll( this ) );
            }
            
            if( this.parentNode ){
                this.parentNode.removeChild( this );
            }
        });
        
        return this;
    },
    
    clone : function( dataAndEvents, deepDataAndEvents ){
        dataAndEvents = dataAndEvents || false;
        deepDataAndEvents = deepDataAndEvents !== undefined ? deepDataAndEvents : dataAndEvents;        
        var len = this.length,
            elems = [],
            i = 0;
            
        for( ; i < len; i++ ){
            elems[ elems.length++ ] = easyNode.clone( this[i], dataAndEvents, deepDataAndEvents );
        }
        
        return E( elems );
    },
    
    text : function( text ){
        if( text === undefined ){
            var elem = this[0];            
            text = elem.tagName === 'SCRIPT' ?
                elem.text :
                'textContent' in elem ?
                elem.textContent :
                'innerText' in elem ?
                elem.innerText :
                '';
            
            elem = null;
            return text.replace( /\r\n/g, '' );
        }
        
        if( E.isString(text) || E.isNumber(text) ){
            text += '';
            return this.empty().append( text );
        }
    },
    
    html : function( content ){
        if( content === undefined ){
            var elem = this[0];
            return elem && elem.nodeType === 1 ?
                elem.innerHTML :
                null;
        }
        
        if( E.isNumber(content) ){
            content += '';
        }
        
        if( E.isString(content) &&
            // 排除掉script、link、style元素
            // 排除掉不能wrap的元素
            !rCssJsTag.test(content) &&                             
            !wrapMap[ (content.match(rTagName) || ['', ''])[1].toLowerCase() ] ){
            
            // <div/> => <div></div>
            content = content.replace( rXhtml, '<$1><' + '/$2>' );            
            
            try{
                this.forEach(function(){
                    if( this.nodeType === 1 ){
                        this.innerHTML = content;
                    }
                });
            }
            catch( _ ){
                this.empty().append( content );
            }            
        }
        else{
            this.empty().append( content );
        }
        
        return this;
    },
        
    index : function(){
        var elem = this[0],
            prev = elem.previousSibling,
            i = 0;
        // 查找previousSibling元素直到firstChild，
        // 符合要求的previousSibling元素计数的结果即为index
        while( prev ){
            if( prev.nodeType === 1 ){
                i++;
            }
            prev = prev.previousSibling;
        }
        elem = prev = null;
        return i;
    }

});

// DOM插入、包裹、替换的原型方法组装
[ 'append', 'prepend', 'before', 'after', 'appendTo', 'prependTo', 'beforeTo', 'afterTo', 'wrap', 'unwrap', 'replace' ].forEach(function( type ){
    
    var index = type.indexOf( 'To' ),
        flag = index !== -1,
        name = flag ? type.substring( 0, index ) : type; 
        
    E.prototype[ type ] = function(){
        var arg = arguments[0],
            context = this[0].ownerDocument;
        
        if( arg === undefined && type !== 'unwrap' ){
            return this;
        }
        
        return easyNode.insert.call( this, arguments, function( elem ){
            easyNode.insertAdapder[ name ]( this, elem );
        }, flag, context );
    };
    
});

// 关系查找器的原型方法组装
[ 'children', 'parent', 'prev', 'next', 'siblings' ].forEach(function( key ){    

    E.prototype[ key ] = function( selector ){
        var flag = false,
            isType = false,
            context = E.makeArray( this ),
            matches, filter, name, tagName, type, elems;
            
        // parent、next、prev的查找结果始终是唯一的，
        // 在没有选择器的情况下，不进行过滤，查找到第一个结果就返回    
        if( !selector ){
            flag = true;
        }
        else{
            matches = easySelector.adapter( selector );
            filter = easySelector.filter[ matches[0] ] || matches[0];
            name = matches[1];
            tagName = matches[2];
            // filter为字符串时，将使用属性或伪类选择器来进行查找
            if( E.isString(filter) ){
                isType = true;
                flag = true;
            }
        }
        
        // filter为字符串时，只查找结果，不过滤
        // filter为过滤函数时，一次性返回结果
        elems = easyNode.filter[ key ]( filter, flag, name, tagName, context );
        
        // filter为字符串，将查找结果再次进行过滤
        elems = isType ? 
            easySelector.finder[ filter ]( selector, elems, true ) : 
            elems;

        // siblings的查找结果需要去重
        if( key === 'siblings' ){
            elems = easySelector.unique( elems );
        }
        
        context = null;
        
        // 逗号选择器的结果查找父元素可能存在重复的结果需要去重
        return E.makeArray( (key === 'parent' && selector ?
            easySelector.unique(elems) :
            elems), E() );
    };
    
});


// ---------------------------------------------
// ---------------@module attr------------------
// ---------------------------------------------
 


var hasAttribute = document.documentElement.hasAttribute,
    noButtonValue = !E.support.buttonValue,
    
    rBoolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
    rFocusable = /^(?:button|input|object|select|textarea)$/i,
    rClickable = /^a(?:rea)?$/i,
    
    attrHooks = {},
    propHooks = {},
    boolHooks = {},
    valHooks = {},
    
    attrFix = {
        'for' : 'htmlFor',
        'class' : 'className'
    },
    
    propFix = {
        enctype : 'encoding'
    };

// IE6-7中button元素的value和innerText纠缠不清    
valHooks.button = {
    get : function( elem ){
        if( noButtonValue && elem.tagName === 'BUTTON' ){
            return elem.getAttributeNode( 'value' ).nodeValue || '';        
        }
        return 'value' in elem ?
            elem.value :
            '';
    },
    set : function( elem, val ){
        if( noButtonValue && elem.tagName === 'BUTTON' ){
            elem.getAttributeNode( 'value' ).nodeValue = val;
        }
        else{
            elem.value = val;
        }
    }
};

attrHooks.value = {
    get : function( elem ){
        var val = valHooks.button.get( elem );
        val = val === '' ? null : val;
        return val;
    }    
};

attrHooks.value.set = valHooks.button.set;

// get tabindex在各浏览器中有一系列的兼容问题
attrHooks.tabindex = {
    get : function( elem ){
        var attrNode = elem.getAttributeNode( 'tabindex' ),
            tagName = elem.tagName;
            
        return attrNode && attrNode.specified ?
            attrNode.value :
            rFocusable.test( tagName ) || rClickable.test( tagName ) && elem.href ?
                0 :
                null;                    
    }
};

propHooks.tabIndex = {
    get : function( elem ){
        var index = attrHooks.tabindex.get( elem );
        index = index === null ? -1 : index;
        return parseInt( index, 10 );
    }
};

// IE6-7 set tabindex时有问题
if( !E.support.attrTabindex ){
    attrHooks.tabindex.set = function( elem, val ){
        elem.getAttributeNode( 'tabindex' ).nodeValue = val;
    };
}

// 使用elem.getAttribute( name, 2 )确保这些属性的返回值在IE6/7下和其他浏览器保持一致
[ 'action', 'cite', 'codebase', 'href', 'longdesc', 'lowsrc', 'src', 'usemap' ].forEach(function( name ){
    attrHooks[ name ] = {
        get : function( elem ){
            return elem.getAttribute( name, 2 );
        }
    };
});

// 处理boolean attributes的兼容问题
boolHooks = {
    // 如果存在该attribute，返回同名值( checked="checked" )
    get : function( elem, name ){
        var attrNode,
            property = easyAttr.prop( elem, name );

        return property === true || !E.isBoolean( property ) && ( attrNode = elem.getAttributeNode(name) ) && attrNode.nodeValue !== false ?
            name.toLowerCase() :
            undefined;
    },
    set : function( elem, val, name ){
        // 如果val为false，移除该attribute
        if( val === false ){
            E( elem ).removeAttr( name );
        }
        // 如果val不为false，设置同名值( checked="checked" )
        else{
            if( name in elem ){
                elem[ name ] = true;
            }
            elem.setAttribute( name, name.toLowerCase() );
        }
    }
};

valHooks.option = {
    get : function( elem ){
        var val = elem.attributes.value;
        return !val || val.specified ? elem.value : elem.text;
    }
};

valHooks.select = {
    get : function( elem ){
        var index = elem.selectedIndex,
            // 单选框的type属性为select-one
            // 多选框的type属性为select-multiple
            one = elem.type === 'select-one',    
            options = elem.options,
            vals = [],
            val, max, option, i;
        
        if( index < 0 ){
            return '';
        }
        // 单选框返回的是单个val字符串
        // 复选框返回的是多个val数组
        i = one ? index : 0;
        max = one ? index + 1 : options.length;
        for( ; i < max; i++ ){
            option = options[i];
            // 遍历option元素的时候需要过滤掉disabled的元素
            if ( option.selected && (E.support.optDisabled ? !option.disabled : option.getAttribute('disabled') === null) &&
                    (!option.parentNode.disabled || option.parentNode.tagNmae !== 'OPTGROUP' ) ) {
                
                val = E( option ).val();
                
                if( one ){
                    return val;
                }
                
                vals.push( val );
            }
        }
        
        if ( one && !vals.length && options.length ) {
            return E( options[ index ] ).val();
        }

        return vals;
    }
};

// 让所有浏览器都默认返回checkbox和radio的value为'on'
if( !E.support.checkOn ){
    [ 'checkbox', 'radio' ].forEach(function( name ){
        valHooks[ name ] = {
            get : function( elem ){
                var val = elem.value;
                return val === '' ? 'on' : val;
            }
        };
    });
}

var easyAttr = {

    // get/set attribute
    attr : function( elem, name, val ){
        var nodeType = elem ? elem.nodeType : undefined,
            hooks;
            
        if( !nodeType || nodeType === 3 || nodeType === 8 || nodeType === 2 ){
            return '';
        }    
        
        // IE6-7把property当arrtibute用，需要进行修复
        if( !hasAttribute ){
            name = attrFix[ name ] || name;
        }
        
        hooks = rBoolean.test( name ) ? boolHooks : attrHooks[ name ];
        // getAttribute
        if( val === undefined ){
            if( hooks && hooks.get ){
                return hooks.get( elem, name );
            }
            val = elem.getAttribute( name );
            return val;
        }
        // setAttribute
        else{
            if( hooks && hooks.set ){
                hooks.set( elem, val, name );
            }
            else{
                elem.setAttribute( name, val );
            }
        }
    },

    // get/set property
    prop : function( elem, name, val ){
        var nodeType = elem ? elem.nodeType : undefined,
            hooks;
            
        if( !nodeType || nodeType === 3 || nodeType === 8 || nodeType === 2 ){
            return;
        }    
            
        if( !hasAttribute ){
            name = propFix[ name ] || name;
        }        
        hooks = propHooks[ name ];
        // getProperty
        if( val === undefined ){
            if( hooks && hooks.get ){
                return hooks.get( elem, name );
            }
            return elem[ name ];
        }
        // setProperty
        else{
            if( hooks && hooks.set ){
                hooks.set( elem, val, name );
            }
            else{
                elem[ name ] = val;
            }
        }    
    }

};

E.mix( E.prototype, {
        
    hasClass : function( name ){        
        var len = this.length,
            i = 0,
            elem, className;
            
        for( ; i < len; i++ ){
            elem = this[i];
            
            if( elem.nodeType === 1 ){
                className = elem.className;
                if( className && ~(' ' + className + ' ').indexOf(' ' + name + ' ') ){
                    return true;
                }
            }  
        }
        
        return false;
    },
    
    addClass : function( name ){
        name += '';
        var arr = name.split( ' ' ),
            len = arr.length;
            
        return this.forEach(function(){
            if( this.nodeType === 1 ){
                var className = this.className,
                    newClassName = className,
                    i = 0,
                    result;
                    
                if( !className ){
                    this.className = name;
                }
                else{
                    className = ' ' + className + ' ';
                    for( ; i < len; i++ ){
                        result = arr[i];
                        // 检测当前元素是否已存在该className，确保不重复添加
                        if( !~className.indexOf(' ' + result + ' ') ){
                            newClassName += ' ' + result;
                        }
                    }
                    
                    this.className = newClassName;
                }
            }
        });
    },
    
    removeClass : function( name ){        
        var arr, len, removeAll;
        
        if( E.isString(name) ){
            arr = name.split( ' ' );
            len = arr.length;
        }
        else{
            removeAll = true;
        }
        
        return this.forEach(function(){
            if( this.nodeType === 1 ){
                var className = this.className,
                    i = 0;
                if( className ){
                    if( removeAll ){
                        this.className = '';
                    }
                    else{
                        className = ' ' + className + ' ';
                        for( ; i < len; i++ ){
                            // 替换成空格是防止替换后2个相邻的className粘在一起
                            className = className.replace( ' ' + arr[i] + ' ', ' ' );
                        }
                        
                        this.className = className.trim();                    
                    }
                }
            }
        });    
    },
    
    replaceClass : function( source, target ){
        if( E.isString(source) && E.isString(target) ){
            source = ' ' + source + ' ';
            target = ' ' + target + ' ';
            
            return this.forEach(function(){
                if( this.nodeType === 1 ){
                    var className = ' ' + this.className + ' ';
                    // 确保当前元素没有目标className，避免重复
                    if( !~className.indexOf(target) ){
                        className = className.replace( source, target );
                        this.className = className.trim();
                    }
                }                
            });    
        }
    },
    
    toggleClass : function( name ){
        name += '';
        var arr = name.split( ' ' ),
            len = arr.length;
            
        return this.forEach(function(){
            if( this.nodeType === 1 ){
                var className = this.className,
                    i = 0,
                    result;
                    
                if( !className ){
                    this.className = name;
                }
                else{
                    className = ' ' + className + ' '
                    for( ; i < len; i++ ){
                        result = arr[i];
                        // 替换成和后置空格是防止替换后2个相邻的className粘在一起
                        className = ~className.indexOf( result ) ? 
                            className.replace( ' ' + result + ' ', ' ' ) :
                            className + result + ' ';
                    }
                    this.className = className.trim();
                }
            }
        });
    },
    
    removeAttr : function( name ){
        var arr = name.split( ' ' ),
            len = arr.length;
        
        return this.forEach(function(){
            if( this.nodeType === 1 ){
                var i = 0,
                    result;

                for( ; i < len; i++ ){
                    result = arr[i];
                    this.removeAttribute( result );
                    // attributes值为boolean类型时需要将值设置成false
                    if( rBoolean.test(result) && result in this ){
                        this[ result ] = false;
                    }
                }
            }
        });
    },
    
    removeProp : function( name ){
        var arr = name.split( ' ' ),
            len = arr.length;
            
        return this.forEach(function(){
            if( this.nodeType === 1 ){
                var i = 0,
                    result;
                    
                for( ; i < len; i++ ){
                    result = arr[i];
                    
                    try{
                        delete this[ result ];
                    }
                    catch( _ ){
                        this.removeAttribute( result );
                    };
                }
            }
        });
    },
    
    val : function( value ){
        var elem, hooks, tagName, type;
        // getValue
        if( value === undefined ){
            elem = this[0];
            tagName = elem.tagName.toLowerCase();
            type = elem.type;
            hooks = valHooks[ tagName ] || valHooks[ type ];
                
            if( hooks && hooks.get ){
                return hooks.get( elem );
            }
            value = elem.value;
            return E.isString( value ) ?
                value.replace( /\r/g, '' ) :    // 替换换行符
                value === null ?
                    '' :
                    value;
        }
        
        // setValue       
        return this.forEach(function( i ){
            elem = E( this );
                
            if( this.nodeType !== 1 ){
                return;
            }
            // value需要转换成字符串
            value = value == null ?
                '' :
                E.isNumber( value ) ?
                value + '' :
                value;
            
            tagName = this.tagName.toLowerCase();
            type = this.type;
            hooks = valHooks[ tagName ] || valHooks[ type ];

            if( hooks && hooks.set ){                
                hooks.set( this, value );
            }
            else{
                this.value = value;
            }
        });
    }

});

[ 'attr', 'prop' ].forEach(function( methodName ){    
    E.prototype[ methodName ] = function( name, val ){
        if( E.isString(name) ){
            // get
            if( val === undefined ){
                return easyAttr[ methodName ]( this[0], name );
            }
            
            var isFunction = E.isFunction( val );
            // set        
            return this.forEach(function( i ){
                val = isFunction ?
                    val.call(this, i, E(this)[methodName](name)) :
                    val;
                    
                easyAttr[ methodName ]( this, name, val );
            });
        }
        
        if( E.isPlainObject(name) ){
            E.each( name, function( name, val ){
                this[ methodName ]( name, val );
            }, this );
            return this;
        }        
    };    
});


// ---------------------------------------------
// ----------------@module css------------------
// ---------------------------------------------
 


var rPosition = /^(?:left|right|top|bottom)$/i,
    rBorderWidth = /^border(\w)+Width$/,
    rNumpx = /^-?\d+(?:px)?$/i,
    rAlpha = /alpha\([^)]*\)/i,        
    rNum = /^-?\d/,
    
    isECMAStyle = !!(document.defaultView && document.defaultView.getComputedStyle),
    cssHooks = {},
    
    // 对float进行处理，标准浏览器和IE在float的表现上不一致
    cssFix = {
        'float' : isECMAStyle ? 'cssFloat' : 'styleFloat'
    },
    
    // 计算元素宽高时需要用到的辅助参数
    sizeParams = {
        'Width' : [ 'Left', 'Right' ],
        'Height' : [ 'Top', 'Bottom' ]
    },
    
    // 计算元素的定位的位置时需要用到的辅助参数
    posParams = {
        left : [ 'left' ],
        top : [ 'top' ],
        right : [ 'left', 'Width' ],
        bottom : [ 'top', 'Height' ]
    },
        
    // 显示隐藏元素的CSS类
    cssShow = {
        visibility : 'hidden',
        display : 'block'
    },
    
    // IE6-8获取backgroundPosition的值时可能是方位值，需要转换
    bgPosition = {
        left : '0%',
        right : '100%',
        top : '0%',
        bottom : '100%',
        center : '50%'
    }, 
    
    // 颜色名称对应的RGB颜色值
    colorMap = {
        'black'   :  'rgb(0, 0, 0)', 
        'silver'  :  'rgb(192, 192, 192)', 
        'gray'    :  'rgb(128, 128, 128)', 
        'white'   :  'rgb(255, 255, 255)', 
        'maroon'  :  'rgb(128, 0, 0)', 
        'red'     :  'rgb(255, 0, 0)', 
        'purple'  :  'rgb(128, 0, 128)', 
        'fuchsia' :  'rgb(255, 0, 255)', 
        'green'   :  'rgb(0, 128, 0)', 
        'lime'    :  'rgb(0, 255, 0)', 
        'olive'   :  'rgb(128, 128, 0)', 
        'yellow'  :  'rgb(255, 255, 0)', 
        'navy'    :  'rgb(0, 0, 128)', 
        'blue'    :  'rgb(0, 0, 255)', 
        'teal'    :  'rgb(0, 128, 128)', 
        'aqua'    :  'rgb(0, 255, 255)'
    },
    
    cssPrefix = (function(){
        var browser = E.browser;
        
        return ( browser.ie && parseInt(browser.version) > 8 ) ? 'ms' :
            ( browser.chrome || browser.safari )  ? 'webkit' :
            browser.firefox ? 'Moz' :
            browser.opera ? 'O' : '';
    })(),
        
    getComputedStyle,
    currentStyle,
    getStyle;

var easyStyle = {
    
    /*
     * 视情况给CSS3的属性名添加私有前缀
     * @param{ String } CSS属性名
     * @param{ Object } 内联样式对象
     * @return { String } 处理后的CSS属性名
     * transform in firefox => MozTransform
     * transform in webkit => webkitTransform
     * transform in ie => msTransform
     * transform in opera => OTransform
     */
    fixName : function( name, style ){
        if( name in style ){
            return name;
        }
        
        var newName = cssPrefix + E.capitalize( name );
        
        if( newName in style ){
            return newName;
        }
        
        return name;
    },
        
    // 获取当前帧的窗口(window)元素
    getWindow : function( elem ){
        return E.isWindow( elem ) ?
            elem :
            elem.nodeType === 9 ?
                elem.defaultView || elem.parentWindow :
                false;
    },

    /*    
     * 获取元素的尺寸
     * outer包含padding和border
     * inner包含padding
     * normal = outer - border - padding
     * @param { HTMLElement } DOM元素
     * @param { String } Width/Height
     * @param { String } Outer/inner
     * @return { Number/String } 
     */
    getSize : function( elem, type, extra ){
        var val = elem[ 'offset' + type ];
        type = sizeParams[ type ];
        
        if( extra === 'outer' ){
            return val;
        }
        // inner = outer - border
        val -= parseFloat( getStyle(elem, 'border' + type[0] + 'Width') ) + 
            parseFloat( getStyle(elem, 'border' + type[1] + 'Width') );
        
        if( extra === 'inner' ){
            return val;
        }
        // normal = inner - padding
        val -= parseFloat( getStyle(elem, 'padding' + type[0]) ) +
            parseFloat( getStyle(elem, 'padding' + type[1]) );

        return val + 'px';
    },
    
    /*    
     * 将元素从隐藏状态切换到显示状态，执行回调后再隐藏元素
     * @param { HTMLElement } DOM元素
     * @param { Function } 回调
     * @return { Number/String } 
     */
    swap : function( elem, fn ){
        var obj = {},
            name, val;
            
        if( elem.offsetWidth ){
            val = fn();
        }
        else{            
            // 元素如果隐藏状态需要先切换到显示状态才能取其尺寸
            for( name in cssShow ){
                obj[ name ] = elem.style[ name ];
                elem.style[ name ] = cssShow[ name ];
            }
            
            val = fn();
            // 取得尺寸后仍将元素隐藏
            for( name in obj ){
                elem.style[ name ] = obj[ name ];
            }        
        }
        
        return val;
    },
    
    /*    
     * 解析颜色值，统一输出RGB格式的颜色值
     * @param { String } 颜色值
     * @return { String } RGB颜色值
     */
    parseColor : function( val ){
        var    len, r, g, b;
        
        if( ~val.indexOf('rgb') ){
            return val;
        }
        
        if( colorMap[val] ){
            return colorMap[ val ];
        }
        
        // 十六进制的颜色值转换 #000 => rgb(0, 0, 0)
        if( ~val.indexOf('#') ){
            len = val.length;
            if( len === 7 ){
                r = parseInt( val.slice(1, 3), 16 );
                g = parseInt( val.slice(3, 5), 16 );
                b = parseInt( val.slice(5), 16 );
            }
            else if( len === 4 ){
                r = parseInt( val.charAt(1) + val.charAt(1), 16 );
                g = parseInt( val.charAt(2) + val.charAt(2), 16 );
                b = parseInt( val.charAt(3) + val.charAt(3), 16 );
            }
            
            return 'rgb(' + r + ', ' + g + ', ' + b + ')';
        }

        return '';
    },
    
    /*    
     * 获取元素在设置了position后其精确的定位值
     * @param { easyJS Object } 
     * @return { String } 定位的属性名
     */        
    getPosition : function( elem, name ){
        var posType = getStyle( elem[0], 'position' );
        
        // static
        if( posType === 'static' ){
            return 'auto';
        }
        
        // relative
        if( posType === 'relative' ){
            return '0px';
        }
        
        var posName = posParams[ name ][0],
            upName = E.capitalize( posName ),
            offset = elem.offset()[ posName ],        
            isSub = name === 'right' || name === 'bottom',
            borderWidth = 0,
            offsetParent, parent, parentOffset, posSize;
            
        if( posType === 'absolute' ){
            offsetParent = elem[0].offsetParent;
            
            if( offsetParent.tagName === 'BODY' || offsetParent.tagName === 'HTML' ){                
                offsetParent = window;
            }
            
            parent = E( offsetParent );
            
            if( !E.isWindow(offsetParent) ){
                borderWidth = parseFloat( getStyle(parent[0], 'border' + upName + 'Width') );
            }
            
            parentOffset = parent.offset()[ posName ] + borderWidth; 
        }
        // fixed
        else{
            parent = E( window );
            parentOffset = parent[ 'scroll' + upName ]();
        }

        offset -= parentOffset; 
        
        // right = offsetParent.innerWidth - self.outerWidth - left 
        // bottom = offsetParent.innerWidth - self.outerWidth - top 
        if( isSub ){            
            posSize = posParams[ name ][1];
            return parent[ 'inner' + posSize ]() - elem[ 'outer' + posSize ]() - offset + 'px';
        }

        // top、left
        return offset + 'px';       
    }
    
};

    
if( isECMAStyle ){
    getComputedStyle = function( elem, name ){
        var doc = elem.ownerDocument,
            defaultView = doc.defaultView,
            val;
            
        if( defaultView ){
            val = defaultView.getComputedStyle( elem, null )[ name ];
        }

        // 取不到计算样式就取其内联样式
        if( val === '' ){
            val = elem.style[ name ];
        }
        return val;
    };
}
else{    
    // IE6-8不支持opacity来设置透明度，只能用filter:alpha(opacity=100)
    cssHooks.opacity = {
        get : function( elem ){
            var filter = elem.currentStyle ? elem.currentStyle.filter : elem.style.filter || '';
                
            return ~filter.indexOf( 'opacity' ) ? 
                filter.match( /\d+/ )[0] / 100 + '' :
                '1';            
        },
        
        set : function( elem, val ){
            var style = elem.style,
                filter = elem.currentStyle ? elem.currentStyle.filter : style.filter || '';
    
            // IE在设置透明度的时候需要触发hasLayout
            style.zoom = 1;            
            val = parseFloat( val );
            // IE6-8设置alpha(opacity=100)会造成文字模糊
            val = val >= 1 || isNaN( val ) ? '' : 'alpha(opacity=' + val * 100 + ')';
         
            style.filter = filter === '' && val === '' ? '' :
                rAlpha.test( filter ) ?
                filter.replace( rAlpha, val ) :
                filter + ' ' + val;
        }
    };
    
    // IE6-8只能单独获取backgroundPositionX和backgroundPositionY
    cssHooks.backgroundPosition = {
        get : function( elem ){
            var x = getStyle( elem, 'backgroundPositionX' ),
                y = getStyle( elem, 'backgroundPositionY' );
        
            return ( bgPosition[x] || x ) + ' ' + ( bgPosition[y] || y );
        }
    }
        
    currentStyle = function( elem, name ){
        var val = elem.currentStyle && elem.currentStyle[ name ],
            style = elem.style,
            left, rsLeft;
        
        // 取不到计算样式就取其内联样式
        if( val === null ){
            val = style[ name ];
        }
        
        // 将IE中的字体大小的各种单位统一转换成px：12pt => 16px
        if( !rNumpx.test(val) && rNum.test(val) ){
            left = style.left;
            rsLeft = elem.runtimeStyle && elem.runtimeStyle.left;
            
            if( rsLeft ){
                elem.runtimeStyle.left = elem.currentStyle.left;
            }
            
            style.left = name === 'fontSize' ? '1em' : ( val || 0 );
            val = style.pixelLeft + 'px';
            
            style.left = left;
            if ( rsLeft ) {
                elem.runtimeStyle.left = rsLeft;
            }
        }
        
        // IE6-8中borderWidth如果为0px返回的是medium，需进行修复
        if( val === 'medium' && rBorderWidth.test(name) ){
            return '0px';
        }
        
        return val;
    };
}

// 获取简写格式的方位值
// 可以这样获取 elem.css( 'margin' ) => 5px 5px 5px 5px
E.each({

    padding : 'paddingTop paddingRight paddingBottom paddingLeft',    
    margin : 'marginTop marginRight marginBottom marginLeft',    
    borderWidth : 'borderTopWidth borderRightWidth borderBottomWidth borderLeftWidth',    
    borderColor : 'borderTopColor borderRightColor borderBottomColor borderLeftColor',    
    borderRadius : 'borderTopLeftRadius borderTopRightRadius borderBottomRightRadius borderBottomLeftRadius'
    
}, function( name, vals ){
    vals = vals.split( ' ' );
    cssHooks[ name ] = {
        get : function( elem ){
            return getStyle( elem, vals[0] ) + ' ' +
                getStyle( elem, vals[1] ) + ' ' +
                getStyle( elem, vals[2] ) + ' ' +
                getStyle( elem, vals[3] );            
        }
    };    
});

if( E.browser.opera ){
    cssHooks.textShadow = {
        get : function( elem ){
            var val = getStyle( elem, 'textShadow' );
            if( val && val !== 'none' ){
                return val.replace( /(.+)(rgb.+)/, '$2' + ' $1' );
            }
        }
    };    
}

getStyle = getComputedStyle || currentStyle;

// 获取z-index时如果值为auto统一返回0
cssHooks.zIndex = {
    get : function( elem ){
        var val = getStyle( elem, 'zIndex' );
        return val === 'auto' ? 0 : val;
    }
};

// width、height、outerWidth、outerHeight、innerWidth、innerHeight的原型方法拼装
[ 'width', 'height' ].forEach(function( name ){
    var upName = E.capitalize( name );
        
    cssHooks[ name ] = {
        get : function( elem ){
            var docElem;
            
            if( !elem ){
                return;
            }
            
            if( E.isWindow(elem) ){
                return elem.document.documentElement[ 'client' + upName ];
            }
    
            if( elem.nodeType === 9 ){      
                docElem = elem.documentElement;
                return Math.max( docElem['scroll' + upName], docElem['client' + upName] ) ;
            }
            
            return easyStyle.swap( elem, function(){
                var val = getStyle( elem, name );

                // IE6-8没有显式的指定宽高会返回auto，此时需要计算
                return val === 'auto' ? easyStyle.getSize( elem, upName ) : val;
            });
        }
    };
    
    // width、height方法直接调用css('width')、css('height')，性能更好
    E.prototype[ name ] = function(){
        return parseFloat( cssHooks[name].get(this[0]) );
    };    
        
    [ 'outer', 'inner' ].forEach(function( name ){
        E.prototype[ name + upName ] = function(){
            var elem = this[0],
                docElem;
                
            if( !elem ){
                return;
            }
            
            if( E.isWindow(elem) ){
                return elem.document.documentElement[ 'client' + upName ];
            }
            
            if( elem.nodeType === 9 ){      
                docElem = elem.documentElement;
                return Math.max( docElem['scroll' + upName], docElem['client' + upName] ) ;
            }
            
            return easyStyle.swap( elem, function(){
                return easyStyle.getSize( elem, upName, name );
            });
        };
    });

});

E.mix( E.prototype, {
    
    css : function( name, val ){
        if( E.isPlainObject(name) ){
            E.each( name, function( name, val ){
                this.css( name, val );
            }, this );
            return this;
        }
        
        // 将中划线转换成驼峰式 如：padding-left => paddingLeft
        name = cssFix[ name ] || 
            name.replace( /\-([a-z])/g, function( _, word ){
                return word.toUpperCase();
            });
            
        var hooks = cssHooks[ name ],
            offset, parentOffset, elem;
        
        if( val === undefined ){
            elem = this[0];
            name = easyStyle.fixName( name, elem.style );
            
            if( elem && elem.nodeType === 1 ){                
                if( hooks && hooks.get ){
                    return hooks.get( elem );
                }    
                
                val = getStyle( elem, name );    
                
                // 处理top、right、bottom、left为auto的情况
                if( rPosition.test(name) && val === 'auto' ){                    
                    return easyStyle.getPosition( this, name );
                }
                
                // 统一输出RGB的颜色值以便计算
                if( /color/i.test(name) ){
                    return easyStyle.parseColor( val );
                }
                
                return val;    
            }
        }
        
        val += ''; 
        
        return this.forEach(function(){
            if( this.nodeType === 1 ){                
                var style = this.style;
                if( hooks && hooks.set ){
                    hooks.set( this, val );
                }
                else{
                    name = easyStyle.fixName( name, style );
                    style[ name ] = val;
                }
            }
        });
    },
        
    offset : function( isContainer ){        
        var offset = { top : 0, left : 0 },
            elem = this[0],
            box;        
            
        if( !elem || elem.nodeType !== 1 ){
            return offset;
        }
        
        // 如果是在一个非window的有滚动条容器中，则使用原生的offsetTop、offsetLeft
        if( isContainer ){
            return {
                top : elem.offsetTop,
                left : elem.offsetLeft
            };
        }
        
        // IE浏览器中如果DOM元素未在DOM树中，使用getBoundingClientRect将会报错
        if( E.browser.ie ){
            try{
                box = elem.getBoundingClientRect();
            }
            catch( _ ){
                return offset;
            }
        }
    
        var doc = elem.nodeType === 9 ? elem : elem.ownerDocument,
            docElem = doc.documentElement,
            body = doc.body,
            box = box || elem.getBoundingClientRect(),        
            clientTop = docElem.clientTop || body.clientTop || 0,
            clientLeft = docElem.clientLeft || body.clientLeft || 0,
            scrollTop = docElem.scrollTop || body.scrollTop,
            scrollLeft = docElem.scrollLeft || body.scrollLeft;            
        
        doc = docElem = body = null;
        
        return {
            top : Math.round( box.top ) + scrollTop - clientTop,
            left : Math.round( box.left ) + scrollLeft - clientLeft
        };
    }
    
});

// scrollTop和scrollLeft的原型方法拼装
[ 'Left', 'Top' ].forEach(function( name ){    
    var method = 'scroll' + name;
    E.prototype[ method ] = function( val ){
        var elem, win;
        // get scrollTop/scrollLeft
        if( val === undefined ){
            elem = this[0];
            if( !elem ){
                return null;
            }
            win = easyStyle.getWindow( elem );

            return win ? 
                win.document.documentElement[ method ] || win.document.body[ method ] :
                elem[ method ];
        }
        // set scrollTop/scrollLeft
        else{
            return this.forEach(function(){
                win = easyStyle.getWindow( this );

                if( win ){
                    win.document.documentElement[ method ] = win.document.body[ method ] = val;
                }
                else{
                    this[ method ] = val;
                }
            });
        }    
    };
});


// ---------------------------------------------
// ---------------@module event-----------------
// ---------------------------------------------
 


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


// ---------------------------------------------
// --------------@module promise----------------
// ---------------------------------------------
 


var pmeCache = {};

E.Promise = function(){
    var i = 0,
        uuid = E.guid(),
        args, list, sourceUuid, len, targetCache, sourceCache;
        
    targetCache = pmeCache[ uuid ] = {};        
    list = arguments.length === 0 ? [ this ] : Array.prototype.concat.apply( [], arguments[0] );
    len = list.length;        
    
    // 为promiseList中的promise实例添加uuid，这样才能在cache中找到自己
    for( ; i < len; i++ ){
        sourceUuid = list[i].uuid;
        // 如果实例中已有uuid，则先删除后添加
        if( sourceUuid ){            
            sourceCache = pmeCache[ sourceUuid ];
            
            // 同步的函数执行过快，会过早改变状态
            // 复制原cache中的resolve参数到新cache中
            if( 'resolveArgs' in sourceCache ){
                targetCache.resolveArgs = [];
                targetCache.resolveArgs[i] = sourceCache.resolveArgs[0];
            }

            if( 'rejectArgs' in sourceCache ){
                targetCache.rejectArgs = [];
                targetCache.rejectArgs[i] = sourceCache.rejectArgs[0];                
            }
            
            sourceCache = null;
            delete pmeCache[ sourceUuid ];
        }
        
        list[i].uuid = uuid;
    }
    
    // 缓存promiseList
    targetCache.list = list;    
    this.uuid = uuid;    
    // 未完成状态
    this.state = 'pending';
};

E.Promise.prototype = {

    // 执行已完成状态
    resolve : function( arg ){
        var data = pmeCache[ this.uuid ],
            isAllResolved = true,
            list, i, len, pme, resolves, resolveArgs;
            
        if( data ){
            // 已完成状态
            this.state = 'resolved';
            resolveArgs = data.resolveArgs;
            
            if( !resolveArgs ){
                resolveArgs = data.resolveArgs = [];
            }            
            
            list = data.list;
            len = list.length;
            
            // 所有的promise实例都是完成状态才能执行then
            for( i = 0; i < len; i++ ){
                pme = list[i];
                if( pme.state !== 'resolved' ){
                    isAllResolved = false;
                }
                
                // 缓存resolve的参数，将该参数传送给回调，并确保参数传递的先后次序
                if( pme === this ){
                    resolveArgs[i] = arg;
                }
            }            
            
            resolves = data.resolves;

            // 执行已完成的回调
            if( isAllResolved && resolves ){                
                len = resolves.length;
                for( i = 0; i < len; i++ ){
                    resolves[i].apply( null, resolveArgs );
                }
                
                delete pmeCache[ this.uuid ];
            }
        }
    },
    
    // 执行已拒绝状态
    reject : function( arg ){
        var data = pmeCache[ this.uuid ],
            isRejected = false,
            list, i, len, pme, rejectes, rejectArgs;
            
        if( data ){
            list = data.list;
            len = list.length;        
            rejectArgs = data.rejectArgs;
            
            if( !rejectArgs ){
                rejectArgs = data.rejectArgs = [];
            }
            
            // 确保reject只执行一次
            // 检查是否有未完成状态的promise实例
            // 有就说明已执行过
            for( i = 0; i < len; i++ ){
                pme = list[i];
                if( pme.state === 'rejected' ){
                    isRejected = true;
                }
                else{
                    pme.state = 'rejected';
                }
                
                if( pme === this ){
                    rejectArgs[i] = arg;
                }
            }
            
            rejectes = data.rejectes;
            
            // 执行已拒绝的回调
            if( !isRejected && rejectes ){                
                len = rejectes.length;
                for( i = 0; i < len; i++ ){
                    rejectes[i].apply( null, rejectArgs );
                }
                
                delete pmeCache[ this.uuid ];
            }
        }
    },
    
    // 添加已完成和已拒绝的回调
    then : function( resolved, rejected ){
        var data = pmeCache[ this.uuid ],
            isAllResolved = true,
            isRejected = false,
            i = 0,
            list, len, state;

        if( data ){
            list = data.list;
            len = list.length;
            
            for( ; i < len; i++ ){
                state = list[i].state;
                if( state !== 'resolved' ){
                    isAllResolved = false;
                    
                    if( state === 'rejected' ){
                        isRejected = true;
                    }
                }
            }
            
            if( resolved ){
                // 同步直接执行
                if( isAllResolved ){
                    resolved.apply( null, data.resolveArgs );
                }
                // 异步添加队列
                else{
                    if( !data.resolves ){
                        data.resolves = [];
                    }                    
                    data.resolves.push( resolved );
                }                
            }
            
            if( rejected ){
                // 同步直接执行
                if( isRejected ){
                    rejected.apply( null, data.rejectArgs );
                }
                // 异步添加队列
                else{
                    if( !data.rejectes ){
                        data.rejectes = [];
                    }                        
                    data.rejectes.push( rejected );
                }
            }
        }
        
        return this;
    }    
};

E.when = function(){
    return new E.Promise( arguments );
};


// ---------------------------------------------
// ---------------@module anim------------------
// ---------------------------------------------
 


var rUnit = /^[-\d.]+/,
    rColorVals = /\d+/g,
    rOperator = /(?:[+-]=)/,
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
    },
    
    // windows8开始面板的滑动切换效果
    doubleSqrt : function( t ){
        return Math.sqrt(Math.sqrt(t));
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

        compute : function( sv, ev, unit, e ){
            var cp = easyAnim.compute;
            return cp( sv, ev, unit, e, 'x' ) + ' ' +
                cp( sv, ev, unit, e, 'y' );
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
        
        compute : function( sv, ev, unit, e ){
            var cp = easyAnim.compute;
            return 'rgb(' + cp( sv, ev, unit, e, 'r', 0 ) + ', ' +
                cp( sv, ev, unit, e, 'g', 0 ) + ', ' +
                cp( sv, ev, unit, e, 'b', 0 ) + ') ' +
                cp( sv, ev, unit, e, 'x' ) + ' ' +
                cp( sv, ev, unit, e, 'y' ) + ' ' +
                cp( sv, ev, unit, e, 'fuzzy' );
        },
        
        set : function( elem, val, unit ){
            elem.style.textShadow = 'rgb(' + val.r + ',' + val.g + ',' + val.b + ') ' +
                val.x + unit.x + ' ' +
                val.y + unit.y + ' ' +
                val.fuzzy + unit.fuzzy;
        }
    }
    
};

[ 'scrollTop', 'scrollLeft' ].forEach(function( name ){

    animHooks[ name ] = {
        parse : function( val ){
            return { val : parseInt( val ) };
        },
        
        compute : function( sv, ev, _, e ){
            return sv + ( ev - sv ) * e;
        },
        
        set : function( elem, val, unit ){
            E( elem )[ name ]( val );      
        }
    };

});

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
        
        compute : function( sv, ev, unit, e ){
            var cp = easyAnim.compute;
            return cp( sv, ev, unit, e, 'top' ) + ' ' +
                cp( sv, ev, unit, e, 'right' ) + ' ' +
                cp( sv, ev, unit, e, 'bottom' ) + ' ' +
                cp( sv, ev, unit, e, 'left' );
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
        compute : function( sv, ev, _, e ){
            var r = ( sv.r + (ev.r - sv.r) * e ).toFixed(0), 
                g = ( sv.g + (ev.g - sv.g) * e ).toFixed(0), 
                b = ( sv.b + (ev.b - sv.b) * e ).toFixed(0);
            
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
        
        target.endProps = source.to || source;
        target.startProps = source.from;
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
    compute : function( sv, ev, unit, e, name, n ){
        if( n === undefined ){
            n = 7;
        }
        return ( sv[name] + (ev[name] - sv[name]) * e ).toFixed(n) + unit[name];
    },
    
    /*
     * 解析CSS属性值
     * @param { String } CSS属性
     * @param { String } CSS属性值
     * @return { Object } 
     * { val : 属性值, unit : 单位, compute : 计算方法, set : 设置方法 }
     */
    parseStyle : function( prop, value, isEnd ){
        value += '';
        var VAL = isEnd ? 'endVal' : 'startVal',
            special = animHooks[ prop ],            
            result = {},
            specialResult;

        if( special ){
            specialResult = special.parse( value );
            result[ VAL ] = specialResult.val;
            
            if( isEnd ){
                result.unit = specialResult.unit;
                result.compute = special.compute;
                result.set = special.set;
            }
        }
        else{
            result[ VAL ] = parseFloat( value );
            
            if( isEnd ){
                result.unit = value.replace( rUnit, '' );
                
                // 总距离 * ( (当前时间 - 开始时间) / 总时间 ) = 当前距离
                // 计算属性值时精度将直接影响到动画效果是否流畅toFixed(7)明显比toFixed(0)要流畅
                result.compute = function( sv, ev, unit, e ){
                    return ( sv + (ev - sv) * e ).toFixed(7) + unit;
                };
                
                result.set = function( elem, val, unit ){
                    E( elem ).css( prop, val + unit );      
                };
            }
        }
        
        return result;
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
    start : function( animData, len ){        
        var self = this,
            elem = this.elem,
            timer = easyAnim.data( elem, 'timer' );
        
        this.len = len;
        this.animData = animData;
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
            animData = this.animData,
            endTime = this.endTime,                     
            // 当前帧的时间
            elapsedTime = +new Date(),         
            // 时间比 => 已耗时 / 总时间
            t = elapsedTime < endTime ? ( elapsedTime - this.startTime ) / this.duration : 1,
            e = this.easing( t ),
            i = 0,
            p, sv, ev, unit, value, data;
            
        if( type ){
            style.overflow = 'hidden';
            
            if( type === 'show' ){
                style.display = 'block';
            }
        }

        for( p in animData ){
            i++;
            data = animData[p]; 
            sv = data.startVal;  // 动画开始时的属性值             
            ev = data.endVal;  // 动画结束时的属性值
            unit = data.unit;  // 属性值的单位
            
            if( elapsedTime < endTime && !end ){
                // 开始值和结束值是一样的无需处理
                if( sv === ev ){
                    continue;
                }
                
                value = data.compute( sv, ev, unit, e );
                
                switch( p ){                    
                    case 'opacity' :
                        $elem.css( p, value );
                    break;
                    
                    case 'scrollTop' : 
                        $elem.scrollTop( value );
                    break;
                    
                    case 'scrollLeft' :
                        $elem.scrollLeft( value );
                    break;
                    
                    default :
                        style[p] = value;
                }
            }
            // 动画结束时还原样式
            else{                
                if( type ){
                    style.overflow = '';
                
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
                    data.set( elem, ev, unit );     
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
                endProps = options.endProps,
                startProps = options.startProps,
                isInit = startProps !== undefined,                
                elem = this,
                animData = {},
                len = 0,
                pattern, anim, type, complete;

            // 获取常见动画模式的属性值
            if( E.isFunction(endProps) ){
                pattern = endProps();
                type = pattern.type;
                endProps = easyAnim.createProps( elem, pattern.props, type );
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
                var parse = easyAnim.parseStyle,
                    elem = E( this ),                    
                    p, sv, ev, temp, startVal;
                
                for( p in endProps ){
                    len++;
                    // 显示类动画先将开始时的CSS属性值重置为0
                    if( type === 'show' ){                        
                        elem.css( p, p === 'opacity' ? '0' : '0px' );
                    }
                    
                    sv = isInit ? startProps[p] :
                        p === 'scrollTop' ? elem.scrollTop() :                        
                        p === 'scrollLeft' ? elem.scrollLeft() :                        
                        elem.css( p );
                        
                    ev = endProps[p];
                    
                    if( !sv && sv !== 0 ){
                        continue;
                    }
                    
                    // 处理 += / -= 的动画
                    if( rOperator.test(ev) ){
                        temp = ev.slice(2);
                        
                        ev = ev.charAt(0) === '+' ?
                            parseFloat( sv ) + parseFloat( temp ) : // +=
                            parseFloat( sv ) - parseFloat( temp );  // -=
                            
                        ev = ev + temp.replace( rUnit, '' );
                    }

                    animData[p] = E.merge( parse(p, sv, false), parse(p, ev, true) );   
                    
                    // 如果有初始值，则设置动画开始时的初始值
                    if( isInit ){
                        startVal = startProps[p] || '';
                        if( p === 'scrollTop' ){
                            elem.scrollTop( startVal );
                        }
                        else if( p === 'scrollLeft' ){
                            elem.scrollLeft( startVal );
                        }                        
                        else{
                            elem.css( p, startVal );
                        }
                    }
                }
                
                // 开始动画                
                anim.start( animData, len );
            });
            
            // 添加反向的动画队列
            if( options.reverse === true ){
                easyAnim.queue( this, function(){
                    var p, startVal, data;
                    
                    // 反向动画交换属性值
                    for( p in animData ){
                        data = animData[p];
                        startVal = data.startVal;                    
                        data.startVal = data.endVal;
                        data.endVal = startVal;       
                    }
                    
                    anim.start( animData, len );
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
                    oldDisplay = easyData.data( this, null, 'display' );
                    
                // 无缓存则缓存当前显示模式    
                if( !oldDisplay ){
                    oldDisplay = easyData.data( this, null, 'display', currentDisplay );
                }
                
                // 原始模式为none的时设置block来显示，非none时则用原始模式
                this.style.display = oldDisplay === 'none' ? 'block' : oldDisplay;         
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
                var currentDisplay = E( this ).css( 'display' ),
                    oldDisplay = easyData.data( this, null, 'display' );
                    
                // 无缓存则缓存当前显示模式     
                if( !oldDisplay ){
                    oldDisplay = easyData.data( this, null, 'display', currentDisplay );
                }
                
                this.style.display = 'none';
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


// ---------------------------------------------
// ---------------@module ajax------------------
// ---------------------------------------------
 


var rInput = /^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,    
    rLocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,
    rUrl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,
    rHeaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg,
    rSelectTextarea = /^(?:select|textarea)/i,
    rNoContent = /^(?:GET|HEAD)$/,    
    rJsre = /(\=)\?(&|$)|\?\?/i,
    rCRLF = /\r?\n/g,
    rNotwhite = /\S/,
    rSpaces = /\s+/,
    rQuery = /\?/,    
    r20 = /%20/g,

    allTypes = [ '*/' ] + [ '*' ],
    lastModified = {},
    etag = {},
    
    ajaxLocation,
    ajaxLocParts,
    isLocal;

try {
    ajaxLocation = window.location.href;
} catch( e ) {
    // IE浏览器新建的a标签的href属性就是document.location
    ajaxLocation = document.createElement( 'a' );
    ajaxLocation.href = '';
    ajaxLocation = ajaxLocation.href;
}    

ajaxLocParts = ajaxLocation.toLowerCase().match( rUrl ) || [];
isLocal = rLocalProtocol.test( ajaxLocParts[1] );

// 默认的参数
var ajaxOptions = {
    type : 'GET',
    contentType : 'application/x-www-form-urlencoded; charset=UTF-8',
    async : true,
    jsonp : 'callback',
    parseData : true,
    global : true,
        
    converters : {
        text : {
            json : E.parseJSON,
            html : true,
            text : true,
            xml : E.parseXML
        }
    },
    
    accepts : {
        xml : 'application/xml, text/xml',
        html : 'text/html',
        text : 'text/plain',
        json : 'application/json, text/javascript',
        '*': allTypes
    },
    
    contents : {
        xml : /xml/,
        html : /html/,
        json : /json/
    },
    
    // 创建原生的XHR
    xhr : 'ActiveXObject' in window ? function(){
        // IE创建原生的XHR
        // 非本地请求才尝试使用XMLHttpRequest
        if( !isLocal && 'XMLHttpRequest' in window ){
            return new XMLHttpRequest();
        }
        
        try{
            return new ActiveXObject( 'Microsoft.XMLHTTP' );
        }
        catch(_){}
    } :
    // 非IE创建原生的XHR
    function(){
        return new XMLHttpRequest();
    }
    
};

var easyAjax = {
    
    /*
     * 将对象转换成字符串    
     * @param { String } name的前缀
     * @param { Array / Object } 待转换的数据
     * @return { String } 转换后的字符串
     */
    buildParam : function( prefix, obj ){
        var arr = [],
            i = 0,
            leftBrackets = '%5B',
            rightBrackets = '%5D',
            len, name, result;
            
        prefix = encodeURIComponent( prefix );    
        
        // { a : [ 1, 2, 3 ] } => a[]=1&a[]=2&a[]=3
        if( E.isArray(obj) ){
            len = obj.length;
            
            for( ; i < len; i++ ){            
                arr[ arr.length++ ] = prefix + leftBrackets + rightBrackets + '=' + encodeURIComponent( obj[i] );
            }
        }
        // { a : { b : 1, c : 2 } } => a[b]=1&a[c]=2
        else if( E.isPlainObject(obj) ){
            for( name in obj ){
                arr[ arr.length++ ] = prefix + leftBrackets + encodeURIComponent( name ) +  rightBrackets + '=' + encodeURIComponent( obj[name] );
            }
        }
        else{
            arr[ arr.length++ ] = prefix + '=' + encodeURIComponent( obj );
        }
        
        return arr.join( '&' );
    },
    
    /*
     * 全局回调的触发器
     * @param { String } 回调类型( start, success, failure, end )
     * @param { Object } easyXHR
     * @param { Object } ajax options
     * @param { String } 错误信息
     */
    trigger : function( type, xhr, options, error ){
        var cacheData = E.cache;
        
        if( cacheData.ajax ){        
            cacheData = cacheData.ajax;
            
            if( cacheData[type] ){
                cacheData = cacheData[ type ];
                
                for( var i = 0; i < cacheData.length; i++ ){
                    cacheData[i]( xhr, options, error );
                }
            }
        }
    },
        
    /*
     * 合并以及处理ajax的各种参数
     * @param { Object } 配置的参数
     * @return { Object } 合并和处理好的参数
     */
    mergeOptions : function( options ){                
        // 合并参数    
        options = E.merge( ajaxOptions, options );
        var parts;
        
        if( options.dataType === 'script' ){
            options.type = 'GET';
            options.cache = options.cache || false;
        }
    
        // 判断跨域
        if( !options.crossDomain ){
            parts = options.url.toLowerCase().match( rUrl );
            // 根据域名、http协议、http的端口号来判断是否跨域请求
            // 其中http的端口号为80、https的端口号是443
            options.crossDomain = !!( parts &&
                ( 
                  parts[1] !== ajaxLocParts[1] ||
                  parts[2] !== ajaxLocParts[2] ||
                  ( parts[3] || (parts[1] === 'http:' ? 80 : 443) ) !==
                  ( ajaxLocParts[3] || (ajaxLocParts[1] === 'http:' ? 80 : 443) ) 
                )
            );
        }
        
        // 将key/value值转换成编码过的URI
        if( options.data && options.parseData && E.isPlainObject(options.data) ){
            options.data = E.param( options.data );
        }
        
        options.type = options.type.toUpperCase();
        
        // 判断请求类型，如果是GET或HEAD，hasContent = false
        options.hasContent = !rNoContent.test( options.type );
        
        if( !options.hasContent ){
            // GET或HEAD类型的请求是通过URL的形式来发送数据的
            // 而POST请求是通过send()来发送数据
            if( options.data ) {
                options.url += ( rQuery.test(options.url) ? '&' : '?' ) + options.data;
                delete options.data;
            }
            
            options.ifModifiedKey = options.url;
            
            // 如果不缓存数据，需要在URL后再加上随机数
            if( options.cache === false ){
                options.url += ( rQuery.test(options.url) ? '&' : '?' ) + '_=' + Date.now();
            }        
        }
        
        
        options.dataTypes = ( options.dataType.trim() || '*' ).toLowerCase().split( rSpaces );    
        options.context = options.context || options;    
        
        // dataType为JSONP或url含有'=?'即判定为JSONP的请求
        // JSONP时很多参数要做另外的处理
        if( options.dataType === 'jsonp' || 
            options.dataType !== false && rJsre.test(options.url) ){
            
            options.type = 'GET';
            
            if( options.crossDomain ){
                var jsonpCallback = options.jsonpCallback || E.guid(),
                    replace = '$1' + jsonpCallback + '$2',
                    response;
                    
                // 将url中的'=?'中的'?'替换成全局回调函数名                        
                if( rJsre.test(options.url) ){
                    options.url = options.url.replace( rJsre, replace );
                }
                // 无全局回调函数名时添加一个，默认为callback
                else{
                    options.url += '&' + options.jsonp + '=' + jsonpCallback;
                }
                
                // 无缓存时添加时间戳
                options.url += options.cache ? '' : '&_=' + Date.now();
                options.converters.script = {};
                options.dataTypes = [ 'script', 'json' ];
                options.dataType = 'script';   
            
                // 全局回调函数
                window[ jsonpCallback ] = function( r ){                    
                    options.converters.script.json = function(){
                        if( !r ){
                            throw( 'not call jsonpCallback : ' + jsonpCallback );
                        }
                        return r;            
                    };
                    
                    // 执行完回调即删除该回调
                    try{
                        window[ jsonpCallback ] = null;
                        delete window[ jsonpCallback ];
                    }
                    catch(_){}                   
                };         
            }
            else{
                options.dataType = 'json';
            }
        }
        
        return options;
    },

    /*
     * 根据参数转换数据格式，默认的格式是text
     * @param { Object } easyXHR
     * @param { Object } ajax options
     * @return { String / XML / JSON } 转换后的数据
     */
    getResponseData : function( xhr, options ){
        var text = xhr.responseText,
            xml = xhr.responseXML,
            cConverts = options.converters,
            contents = options.contents,
            dataTypes = options.dataTypes,
            responseData, type, contentType, prevType, result, converter, i;

        if( text || xml ){
            contentType = options.mimeType || xhr.getResponseHeader( 'Content-Type' );

            if( dataTypes[0] === '*' ){
                dataTypes.shift();
            }

            if( !dataTypes.length ){
                for( type in contents ){
                    if( contents[type].test(contentType) && dataTypes[0] !== type ){
                        dataTypes.unshift( type );
                        break;
                    }
                }
            }
        
            dataTypes[0] = dataTypes[0] || 'text';    

            // 默认为text
            if( dataTypes[0] === 'text' && text !== undefined ){
                responseData = text;
            }
            // xml
            else if( dataTypes[0] === 'xml' && xml !== undefined ){
                responseData = xml;
            } 
            else{            
                result = [ 'text', 'xml' ];    
                for( i = 0; i < result.length; i++ ){                    
                    (function( prevType ){
                        var type = dataTypes[0],
                            converter = cConverts[prevType] && cConverts[prevType][type];
                            
                        if( converter ){
                            dataTypes.unshift( prevType );
                            responseData = prevType === 'text' ? text : xml;
                        }
                    })( result[i] );
                }
            }
        }
        
        prevType = dataTypes[0];

        for( i = 1; i < dataTypes.length; i++ ){
            type = dataTypes[i];
            converter = cConverts[prevType] && cConverts[prevType][type];
            if( !converter ){
                throw "no covert for " + prevType + " => " + type;
            }
            responseData = converter( responseData );
            prevType = type;
        }

        return responseData;
    }
    
};

var transports = {

    // 普通的get和post请求使用的传送器
    xhrTransport : {

        send : function( options, fire, easyXHR, headers ){
            var self = this,
                xhr = options.xhr(),
                i,
                params = {                
                    easyXHR : easyXHR,
                    options : options,
                    fire : fire,
                    xhr : xhr
                };
    
            if( options.crossDomain && !('withCredentials' in xhr) ){
                return;
            }
            
            // 建立请求保存请求所需要的参数             
            if( options.username ){
                xhr.open( options.type, options.url, options.async, options.username, options.password )
            }
            else{
                xhr.open( options.type, options.url, options.async );
            }
            
            // 用于设置原生xhr的属性
            if( options.xhrFields ){
                for( i in options.xhrFields ){
                    xhr[i] = options.xhrFields[i];
                }
            }
            
            // 如果有mimeType参数，则覆盖掉
            if( options.mimeType && xhr.overrideMimeType ){
                xhr.overrideMimeType( options.mimeType );
            }
            
            // 设置XMLHttpRequest的标志请求头
            if( !headers['X-Requested-With'] ){
                headers['X-Requested-With'] = 'XMLHttpRequest';
            }
            
            // 设置被缓存的请求头
            try {
                for( i in headers ) {
                    xhr.setRequestHeader( i, headers[i] );
                }
            } 
            catch(_){}
            
            // 发送请求
            xhr.send( (options.hasContent && options.data) || null );
            
            // 回调
            if( !options.async ){
                self.callback( null, false, params );
            }
            else if( xhr.readyState === 4 ){
                setTimeout(function(){
                    self.callback( null, false, params );
                }, 0 );
            }
            else{
                xhr.onreadystatechange = function(){
                    self.callback( null, false, params );
                }    
            }
        },
        
        callback : function( _, isAbort, params ){
            try{
                var xhr = params.xhr,
                    easyXHR = params.easyXHR,
                    status, xml, statusText, responseHeaders;

                if( isAbort || xhr.readyState === 4 ){
                    xhr.onreadystatechange = E.noop;
                    // 中断请求
                    if( isAbort && xhr.readyState !== 4 ){
                        try{
                            if( xhr.abort ){
                                xhr.abort();
                            }
                        }
                        catch(_){}
                    }
                    // 接收HTTP状态码和响应数据
                    else{
                        responseHeaders = xhr.getAllResponseHeaders();
                        status = xhr.status;
                        xml = xhr.responseXML;
                            
                        if( xml && xml.documentElement ){
                            easyXHR.responseXML = xml;
                        }
                        
                        easyXHR.responseText = xhr.responseText;

                        try{
                            statusText = xhr.statusText;
                        }
                        catch( e ){
                            statusText = '';
                        }
                        
                        if( !status && isLocal && params.options.crossDomain ){
                            status = easyXHR.responseText ? 200 : 404;
                        }
                        else if( status === 1223 ){
                            status = 204;
                        }
                        
                        // 触发请求结束的回调
                        params.fire( status, statusText, responseHeaders );
                    }
                }    
            }
            catch( firefoxAccessException ){
                xhr.onreadystatechange = E.noop;
                if ( !isAbort ){
                    params.fire( -1, firefoxAccessException, responseHeaders );
                }
            }
        }        
    },
    
    // script和jsonp使用的传送器
    script : {        
    
        send : function( options, fire ){
            var self = this,
                script = document.createElement( 'script' ),
                head = document.head || 
                    document.getElementsByTagName( 'head' )[0] || 
                    document.documentElement,
                    
                params = {
                    script : script,
                    head : head,
                    fire : fire                    
                };
            
            script.async = 'async';
            script.src = options.url;
            
            if( options.scriptCharset ){
                script.charset = options.scriptCharset;
            }
            
            script.onerror = script.onload = script.onreadystatechange = function( e ){
                e = e || window.event;
                self.callback( (e.type || 'error').toLowerCase(), false, params );
            };
            
            // 开始加载script数据
            head.insertBefore( script, head.firstChild );            
        },
        
        callback : function( event, isAbort, params ){
            var head = params.head,
                script = params.script,
                fire = params.fire;
                
            if( isAbort || 
                !script.readyState || 
                /loaded|complete/.test(script.readyState) ||
                event === 'error' ){
                
                script.onerror = script.onload = script.onreadystatechange = null;
                // 加载完script文件后就删除该文件
                // 只要加载并执行就在页面中生效了，删除不碍事
                if( head && script.parentNode ){
                    head.removeChild( script );
                }

                // 如果没有中止请求且没有报错
                if( !isAbort && event !== 'error' ){
                    fire( 200, 'success' );
                }
                // IE6/7/8判断不出
                else if( event === 'error' ){
                    fire( 500, 'scripterror' );
                }
            }
        }        
    }
    
};

E.mix( E, {

    ajax : function( options ){
        if( !options.url ){
            return;
        }
        
            // 合并配置参数和默认参数
        var o = easyAjax.mergeOptions( options ),
			contentType = o.contentType,			
			responseHeadersString = '',		
			promise = new E.Promise(),
            dataType = o.dataType,            
            accepts = o.accepts,
			requestHeaders = {},	
            context = o.context,			
            global = o.global,
			statusText = '',
			status = 0, 
            state = 0,                 
            // 实例化传送器 根据dataType来判断使用合适的传送器
            // 默认使用xhr传送器
            transport = transports[dataType] || transports.xhrTransport,
			
            responseHeaders, responseXML, responseText, timeoutTimer, ifModifiedKey, i;

        // 模拟的xhr对象
        var easyXHR = {
        
            readyState: 0,

            // 设置请求头
            setRequestHeader : function( name, value ){
                if ( !state ) {
                    requestHeaders[ name ] = value;
                }
                return this;
            },
            
            // 返回所有的字符串格式的响应头
            getAllResponseHeaders : function(){
                return state === 2 ? responseHeadersString : null;
            },        
            
            // 建立响应头的哈希表
            getResponseHeader : function( key ){
                var matches;
                if ( state === 2 ) {
                    if ( !responseHeaders ) {
                        responseHeaders = {};
                        while( (matches = responseHeadersString.match(rHeaders)) ) {
                            responseHeaders[ matches[1] ] = matches[2];
                        }
                        matches = responseHeaders[key];
                    }
                }
                
                return matches === undefined ? null : matches;
            },

            // 覆盖响应头的 content-type，可配合 start 回调函数使用，可以在请求发起前修改 content-type
            overrideMimeType : function( type ) {
                if ( !state ) {
                    o.mimeType = type;
                }
                return this;
            },

            // 中断请求
            abort : function( statusText ){
                statusText = statusText || 'abort';
                if( transport ){
                    transport.callback( false, true );
                }
                fire( 0, statusText );
                return this;                
            }        
            
        };
        
        /*
         * 请求结束后根据请求状态触发相关的回调
         * @param { Number } HTTP的状态码  
         * @param { String } 状态文本
         * @param { String } 所有的响应头文本信息
         */
        var fire = function( status, statusText, headers ){
            if( state === 2 ){
                return;
            }

            var isSuccess, responseData, _lastModified, _etag;    
            
            if( timeoutTimer ){
                clearTimeout( timeoutTimer );
            }            
            
            state = 2;
            transport = null;    
            easyXHR.readyState = 4;

            if( status >= 200 && status < 300 || status === 304 ){
                if( o.ifModified ){
                    if( (_lastModified = easyXHR.getResponseHeader('Last-Modified')) ){
                        lastModified[ ifModifiedKey ] = _lastModified;
                    }
                    if( (_etag = easyXHR.getResponseHeader('Etag')) ){
                        etag[ ifModifiedKey ] = _etag;
                    }
                }
            
                if( status === 304 ){
                    statusText = 'notmodified';
                    isSuccess = true;
                }
                else{
                    try{
                        responseData = easyAjax.getResponseData( easyXHR, o );
                        statusText = 'success';
                        isSuccess = true;
                    }
                    catch( e ){
                        statusText = 'parsererror : ' + e;
                    }
                }
            }
            else if( status < 0 ){
                status = 0;
            }            

            easyXHR.status = status;
            easyXHR.statusText = statusText;            
            responseHeadersString = headers || '';
			// 将模拟的xhr对象合并到promise实例中	
			E.mix( promise, easyXHR );
			
            // 请求成功的回调
            if( isSuccess ){
				promise.resolve([ responseData, statusText, easyXHR ]);				
                if( o.success ){
                    o.success.call( context, responseData, statusText, easyXHR );
                }
                
                // 触发ajaxSuccess的全局回调
                if( global ){
                    easyAjax.trigger( 'success', easyXHR, o );
                }
            } 
            // 请求失败的回调
            else{
				promise.reject([ statusText, easyXHR ]);
                if( o.failure ){
                    o.failure.call( context, statusText, easyXHR );
                }
                
                // 触发ajaxFailure的全局回调
                if( global ){
                    easyAjax.trigger( 'failure', easyXHR, o, statusText );
                }
            }

            // 请求完成的回调
            if( o.end ){
                o.end.call( context, statusText, easyXHR );
            }
            
            // 触发ajaxEnd的全局回调
            if( global ){
                easyAjax.trigger( 'end', easyXHR, o );
            }
        };
            
        // 设置请求头的信息
        if( o.data && o.hasContent && contentType !== false || options.contentType ){
            easyXHR.setRequestHeader( 'Content-type', contentType );
        }
        
        if( o.ifModified ){
            ifModifiedKey = o.ifModifiedKey || o.url;
            
            if( lastModified[ifModifiedKey] ){
                easyXHR.setRequestHeader( 'If-Modified-Since', lastModified[ifModifiedKey] );
            }
            
            if( etag[ifModifiedKey] ){
                easyXHR.setRequestHeader( 'If-None-Match', etag[ifModifiedKey] );
            }
        }

        // 设置accept的请求头
        easyXHR.setRequestHeader(
            'Accept',
            accepts[dataType] ?
                accepts[dataType] + (dataType === '*' ? '' : ', ' + allTypes + '; q=0.01' ) :
                accepts['*']
        );
        
        for( i in o.headers ){
            easyXHR.setRequestHeader( i, o.headers[i] );
        }
        
        // 触发ajaxStart全局回调
        if( global ){ 
            easyAjax.trigger( 'start', easyXHR, o );
        }
        
        // 请求开始的回调，如果回调返回false，则中断请求
        if ( o.start && (o.start.call(context, easyXHR) === false || state === 2) ) {
            return easyXHR.abort();
        }
        
        easyXHR.readyState = 1;
        
        if( o.async && o.timeout > 0 ){
            timeoutTimer = setTimeout(function(){
                easyXHR.abort( 'timeout' );
            }, o.timeout );
        }

        // 传送器开始发送请求
        transport.send( o, fire, easyXHR, requestHeaders );		
        return promise;
    },

    getJSON: function( url, data, callback ){
        return this.get( url, data, callback, 'json' );
    },

    // 将对象转换成字符串
    param : function( obj ){
        var arr = [],
            i = 0,
            len, name, result;
            
        if( E.isArray(obj) ){
            len = obj.length;
            for( ; i < len; i++ ){
                result = obj[ i ];                
                arr[ arr.length++ ] = encodeURIComponent( result.name ) + '=' + encodeURIComponent( result.value );
            }
        }
        else if( E.isPlainObject(obj) ){
            for( name in obj ){
                arr[ arr.length++ ] = easyAjax.buildParam( name, obj[name] );
            }
        }
        
        return arr.join( '&' ).replace( r20, '+' );
    }
    
});

// get、post静态方法的拼装
[ 'get', 'post' ].forEach(function( name ){
    E[ name ] = function( url, data, fn, type ){    
        if( typeof data === 'function' ){
            type = type || fn;
            fn = data;
            data = undefined;
        }
        
        return E.ajax({
            type : name,
            url : url,
            data : data,
            success : fn,
            dataType : type
        });
    };
});

E.mix( E.prototype, {
    
    // 将form的数据转换成字符串
    serialize : function(){        
        return E.param( this.serializeArray() );
    },
    
    // 将form的数据转换成对象
    serializeArray : function(){        
        var elems = [],
            arr = [],
            j = 0,
            elem, len, val, i, allElements;
            
        // 查找form中的所有表单元素然后合并成一个easyJS对象
        this.forEach(function(){
            if( this.tagName === 'FORM' ){
                allElements = this.elements;
                len = allElements.length;
                
                for( i = 0; i < len; i++ ){
                    elems[ elems.length++ ] = allElements[i];
                }
            }
        });        
        
        // 过滤无数据的表单元素
        elems = E.filter( elems, function(){
            return this.name && !this.disabled &&
                ( this.checked || rSelectTextarea.test(this.tagName) || rInput.test(this.type) );
        });
        
        len = elems.length;
        
        // 将表单元素的name和value合并
        for( i = 0; i < len; i++ ){
            elem = elems[i];
            val = E.makeArray( E(elem).val() );
            
            for( var j = 0; j < val.length ; j++ ){
                arr = E.makeArray({ name : elem.name, value : val[j].replace( rCRLF, '\r\n' ) }, arr );
            }
        }
        
        return arr;
    }
    
});



})( window );