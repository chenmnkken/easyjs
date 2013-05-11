/*
 * 将多个JS文件合并成一个JS文件
 * @param{ Object } 压缩的参数
 * path : 需要合并的JS文件所在的路径
 * names : 需要合并的JS文件名
 * output : 输出合并后的JS文件路径
 * encoding : 文件编码
 * format : 在合并文件时，用于格式化文件的函数
 * comboComplete : 合并完后，输出文件前的回调
 * compressComplete : 压缩完后，输出文件前的回调
 * uglifyUrl : uglify的路径
 */ 

var combo = function( options ){
    options.encoding = ( options.encoding || 'UTF-8' ).toUpperCase();
    
    var fs = require( 'fs' ),
        names = options.names.split( ' ' ),
        isUTF8 = options.encoding === 'UTF-8',
		output = options.output,
		outputPath = output.slice( 0, output.lastIndexOf('/') ),
        paths = [],
        contents = '',
        conten, uglify, jsp, pro, ast;
		
	// 删除build文件夹下原来的所有文件
	fs.readdirSync( outputPath ).forEach(function( file ){
		var path = outputPath + '/' + file;
		
		try{
			fs.unlinkSync( path );
			console.log( 'Delete the[' + path + '] success' );
		}
		catch( error ){
			console.log( 'Delete file ' + error );
            return;
		}
	});

	console.log( '======================================' );
	    
    // 计算 paths 
    names.forEach(function( name ){
        paths.push( options.path + name + '.js' );
    });
        
    // 合并文本内容
    paths.forEach(function( path ){
        // 读取
        try{
            content = fs.readFileSync( path, options.encoding );
        }
        catch( error ){
            console.log( 'Read file ' + error );
            return;
        }
        
        // utf-8 编码格式的文件可能会有 BOM 头，需要去掉
        if( isUTF8 && content.charCodeAt(0) === 0xFEFF ){
            content = content.slice( 1 );
        }
        
        // 格式化
        if( options.format ){
            content = options.format( content );
        }
        
        // 合并
        contents += content + '\n';
        console.log( 'Combo the [' + path + '] success.' );
    });    

    // 合并好文本内容后的回调
    if( options.comboComplete ){
        contents = options.comboComplete( contents );
    }

    console.log( '======================================\n' +
    'All of [' + paths.length + '] files combo success.\n' +
    '======================================' );
	    
    // 写入文件
    try{
        fs.writeFileSync( output, contents, options.encoding );
    }
    catch( error ){
        console.log( 'Output file ' + error );
        return;
    }
    
    // 压缩文件
    uglify = require( options.uglifyUrl );
    jsp = uglify.parser;
    pro = uglify.uglify;            
    
    ast = jsp.parse( contents );
    ast = pro.ast_mangle( ast ); 
    ast = pro.ast_squeeze( ast ); 
    contents = pro.gen_code( ast );    
    
    // 合并好文本内容后的回调
    if( options.compressComplete ){
        contents = options.compressComplete( contents );
    }    
    
    // 写入文件
    try{
        fs.writeFileSync( options.minOutput, contents, options.encoding );
    }
    catch( error ){
        console.log( 'Output file ' + error );
        return;
    }    
    
    console.log( 'Compress success, output [' + options.minOutput + '].' );
};

exports.combo = combo;