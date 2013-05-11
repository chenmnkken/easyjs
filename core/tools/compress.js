/*
 * 压缩JS
 * @param{ Object } 压缩的参数
 * compilerPath : compiler.jar的路径
 * input : 需要压缩的JS文件路径
 * output : 输出压缩后的JS文件路径
 * encoding : 文件编码
 * callback : 压缩完后，输出文件前的回调
 */ 

var compress = function( options ){
    options.encoding = ( options.encoding || 'UTF-8' ).toUpperCase();
    
    var spawn = require( 'child_process' ).spawn,
        fs = require( 'fs' ),
        encoding = options.encoding,
        isUTF8 = encoding === 'UTF-8',
        args = [ '-jar', options.compilerPath, '--charset', encoding, '--compilation_level', 'SIMPLE_OPTIMIZATIONS' ],
            
        compiler = spawn( 'java', args ),
        stdout = '', 
        stderr = '',
        content;

    compiler.stdout.setEncoding( encoding );
    compiler.stderr.setEncoding( encoding );
    
    // 获取AST
    compiler.stdout.on( 'data', function( data ){
        stdout += data;
    });
    
    // 获取错误信息
    compiler.stderr.on( 'data', function( data ){
        stderr += data;
    });

    compiler.on( 'exit', function( code ){
        var error;
        
        if( code !== 0 ){
            error = new Error( stderr );
            error.code = code;
            console.log( error );
        }
        else{
            // 压缩好文本内容后的回调
            if( options.callback ){
                stdout = options.callback( stdout );
            }

            console.log( 'Compress the [' + options.input + '] success.' );
        
            // 写入文件
            fs.writeFile( options.output, stdout, encoding, function( error ){                
                console.log( 'Output ' + (error ? 'error :' + error : 'the [' + options.output + '] success.') );
            });
        }
    });
    
    // 读取文本内容
    try{
        content = fs.readFileSync( options.input, encoding );
    }
    catch( error ){
        console.log( 'Read file error :' + error );
    }
    
    compiler.stdin.end( content );
};

exports.compress = compress;
