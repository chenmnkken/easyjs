// ---------------------------------------------
// ----------------@module node-----------------
// ---------------------------------------------
 
define([ 'support', 'data', 'selector' ], function( _, easyData, easySelector ){

'use strict';

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

});