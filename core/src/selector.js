// ---------------------------------------------
// --------------@module selector---------------
// ---------------------------------------------
 
define([ 'data' ], function( easyData ){

'use strict';

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

// @exports
return easySelector;    

});