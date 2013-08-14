/*
 * easyCombo v0.2 for easy.js
 * 2013-07-01
 */
var rExistId = /define\(\s*['"][^\[f'"\{]+['"]\s*,?/,
    rProtocol = /^(http(?:s)?\:\/\/|file\:.+\:\/)/,
    rModId = /([^\/?]+?)(\.(?:js|css))?(\?.*)?$/,     
    rRightEnd = /,?\s*(function\s*\(.*|\{.*)/,    
    rPullDeps = /((?:define|E\.use)\(.*)/g,    
    rDeps = /(define\([^\[f\{]*\[)([^\]]+)/,
    rDefine = /define\(/,    

    fs = require( 'fs' ),
    depsCache = {},    

    define = function( name, deps ){
        if( Array.isArray(name) ){
            deps = name;
        }
        
        return deps;     
    },

    // 将模块标识(相对路径)和基础路径合并成新的真正的模块路径(不含模块的文件名)
    mergePath = function( id, url ){
        var isHttp = url.slice( 0, 4 ) === 'http',
            protocol = '',
            domain = '',
            i = 0,
            protocol, isHttp, urlDir, idDir, dirPath, len, dir, matches;

        matches = url.match( rProtocol );
        
        if( matches ){
            protocol = matches[1];
            url = url.slice( protocol.length );
        }
        
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

    // 解析模块标识，返回模块名和模块路径
    parseModId = function( id, url ){
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

        baseUrl = mergePath( id, url );
        modUrl = baseUrl + modName + suffix + search;
        return [ modName, modUrl ];
    },
    
    // 分析模块的依赖，将依赖模块的模块标识组成一个数组以便合并
    parseDeps = function( key, mods, encoding ){    
        var cache = depsCache[ key ],
            deps = [];
        
        mods.forEach(function( mod ){
            var baseUrl = mod.slice( 0, mod.lastIndexOf('/') + 1 ),
                content, literals;          

            // 读取文件
            try{
                content = fs.readFileSync( mod, encoding );
            }
            catch( error ){
                console.log( 'Read file ' + error );
                return;
            }
            
            // 将define(), use()用正则提取出来
            literals = content.match( rPullDeps );

            literals.forEach(function( literal ){
                var arr;
                // define('hello', ['hello1'], function(){  =>  define('hello', ['hello1'])
                // use('hello', function(){  =>  use('hello')
                literal = literal.replace(rRightEnd, ')');
                
                // 然后用eval去执行处理过的define和use获取到依赖模块的标识
                arr = eval( literal );
                
                if( arr && arr.length ){
                    // 为依赖模块解析真实的模块路径
                    arr.forEach(function( item, i ){
                        var result = parseModId( item, baseUrl );
                        arr[i] = result[1];
                    });
                
                    deps = deps.concat( arr );
                }
            });
        });

        if( deps.length ){            
            cache.ids = deps.concat( cache.ids );
            
            // 递归调用直到所有的依赖模块都添加完
            parseDeps( key, deps, encoding );
        }
    },
    
    formatDeps = function( _, define, deps ){
        var arr = deps.split( ',' ),
            len = arr.length,
            i = 0,
            item, index;
            
        for( ; i < len; i++ ){
            item = arr[i];
            item = item.replace( /['"]/g, '' ).trim();
            index = item.lastIndexOf( '/' );
            arr[i] = ~index ? item.slice( index + 1 ) : item;
        }

        return define + "'" + arr.join("','") + "'";
    },    
    
    // 合并内容
    comboContent = function( key, baseUrl, encoding, format ){
        var cache = depsCache[ key ],
            unique = cache.unique,
            ids = cache.ids;
            
        ids.forEach(function( id ){
            var result = parseModId( id, baseUrl ),
                name = result[0],
                url = result[1],
                content = fs.readFileSync( url, encoding );

            // 非use()的情况下防止重复合并
            if( !~content.indexOf('use(') ){
                if( unique[name] ){
                    return;
                }
            
                unique[ name ] = true;                 
            }                
        
            // utf-8 编码格式的文件可能会有 BOM 头，需要去掉
            if( encoding === 'UTF-8' && content.charCodeAt(0) === 0xFEFF ){
                content = content.slice( 1 );
            }
            
            // 格式化
            if( typeof format === 'function' ){
                content = format( content );
            }
            
            // 为匿名模块添加模块名
            if( !rExistId.test(content) ){  
                content = content.replace( rDefine, "define('" + name + "'," );
            }
            
            // 格式化依赖模块列表 ['../hello5'] => ['hello5']
            content = content.replace( rDeps, formatDeps );
            
            // 合并
            cache.contents += content + '\n';       
            console.log( 'Combo the [' + url + '] success.' );  
        });        
    },
    
    // 写入文件
    writeFile = function( key, mod, uglifyUrl ){
        var output = mod.output,
            contents = depsCache[ key ].contents,
            uglify, jsp, pro, ast;

        // 压缩文件
        if( uglifyUrl ){
            uglify = require( uglifyUrl );
            jsp = uglify.parser;
            pro = uglify.uglify;            
            
            ast = jsp.parse( contents );
            ast = pro.ast_mangle( ast ); 
            ast = pro.ast_squeeze( ast ); 
            contents = pro.gen_code( ast );
        }
        
        // 合并好文本内容后的回调
        if( typeof complete === 'function' ){
            contents = complete( contents );
        }        
            
        // 写入文件
        try{
            fs.writeFileSync( output, contents, mod.encoding );
        }
        catch( error ){
            console.log( 'Output file ' + error );
            return;
        }    
        
        console.log( 'Output the [' + output + '] success.' );
        delete depsCache[ key ];
    };
    
var E = easyJS = {
    use : function( ids ){
        return typeof ids === 'string' ? [ ids ] : ids;
    }
};

var easyCombo = function( options ){
    var modules = options.modules,
        baseUrl = options.baseUrl;
        
    modules.forEach(function( mod ){
        var encoding = mod.encoding = ( mod.encoding || 'UTF-8' ).toUpperCase(),
            randomKey = ( +new Date() + '' ) + ( Math.random() + '' ).slice( -8 );

        depsCache[ randomKey ] = {
            ids : [],
            unique : {},
            contents : ''
        };
            
        mod.input.forEach(function( id ){
            var result = parseModId( id, baseUrl ),
                modUrl = result[1];
        
            depsCache[ randomKey ].ids.push( modUrl );
            parseDeps( randomKey, [modUrl], encoding );
        });

        comboContent( randomKey, baseUrl, encoding, mod.format );
        writeFile( randomKey, mod, options.uglifyUrl );
    });    
};

exports.easyCombo = easyCombo;