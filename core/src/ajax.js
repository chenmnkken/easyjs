// ---------------------------------------------
// ---------------@module ajax------------------
// ---------------------------------------------
 
define([ 'attr', 'promise' ], function(){

'use strict';

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

});