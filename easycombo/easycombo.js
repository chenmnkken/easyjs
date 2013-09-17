/*
 * easyCombo v1.1.0 for easy.js
 * 2013-09-17
 */
var rExistId = /define\(\s*['"][^\[\('"\{]+['"]\s*,?/,
    rProtocol = /^(http(?:s)?\:\/\/|file\:.+\:\/)/,
    rModId = /([^\\\/?]+?)(\.(?:js|css))?(\?.*)?$/,     
    rRightEnd = /,?\s*(function\s*\(.*|\{.*)/,    
    rPullDeps = /((?:define|E\.use|easyJS\.use)\(.*)/g,    
    rDeps = /((?:define|E\.use|easyJS\.use)\([^\[\(\{]*\[)([^\]]+)/,
    rDefine = /define\(/,    

    fs = require( 'fs' ),
    path = require( 'path' ),
    depsCache = {},    

    define = function( name, deps ){
        if( Array.isArray(name) ){
            deps = name;
        }
        
        return deps;     
    },
    
    // 分析模块的依赖，将依赖模块的模块标识组成一个数组以便合并
    parseDeps = function( key, mods, encoding ){    
        var cache = depsCache[ key ],
            deps = [];
        
        mods.forEach(function( modUrl ){
            var baseUrl = path.resolve( modUrl, '..' ),
                content, literals;          
            
            if( !~modUrl.indexOf('.js') ){
                modUrl += '.js'
            }

            // 读取文件
            try{
                content = fs.readFileSync( modUrl, encoding );
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
                        arr[i] = path.resolve( baseUrl, item );
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
            var modName = id.match( rModId )[1],
                modUrl = path.resolve( __dirname, id ),
                content;
                
            if( !~modUrl.indexOf('.js') ){
                modUrl += '.js'
            }
               
            content = fs.readFileSync( modUrl, encoding );

            // 非use()的情况下防止重复合并
            if( !~content.indexOf('use(') ){
                if( unique[modUrl] ){
                    return;
                }
            
                unique[ modUrl ] = true;                 
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
                content = content.replace( rDefine, "define('" + modName + "'," );
            }
            
            // 格式化依赖模块列表 ['../hello5'] => ['hello5']
            content = content.replace( rDeps, formatDeps );            
            
            // 合并
            cache.contents += content + '\n';       
            console.log( 'Combo the [' + modName + '] success.' );  
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
        baseUrl = path.resolve();
        
    modules.forEach(function( mod ){
        var encoding = mod.encoding = ( mod.encoding || 'UTF-8' ).toUpperCase(),
            randomKey = ( +new Date() + '' ) + ( Math.random() + '' ).slice( -8 );

        depsCache[ randomKey ] = {
            ids : [],
            unique : {},
            contents : ''
        };
            
        mod.input.forEach(function( id ){
            var modUrl = path.resolve( baseUrl, id );
        
            depsCache[ randomKey ].ids.push( modUrl );
            parseDeps( randomKey, [modUrl], encoding );
        });

        comboContent( randomKey, baseUrl, encoding, mod.format );
        writeFile( randomKey, mod, options.uglifyUrl );
    });   
};

exports.easyCombo = easyCombo;