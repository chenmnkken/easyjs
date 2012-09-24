/*
 * 将多个JS文件合并成一个JS文件
 * @param{ Object } 压缩的参数
 * path : 需要合并的JS文件所在的路径
 * names : 需要合并的JS文件名
 * output : 输出合并后的JS文件路径
 * encoding : 文件编码
 * format : 在合并文件时，用于格式化文件的函数
 * complete : 合并完后，输出文件前的回调
 */ 

var combo = function( options ){
	options.encoding = ( options.encoding || 'UTF-8' ).toUpperCase();
	
	var fs = require( 'fs' ),
		names = options.names.split( ' ' ),
		isUTF8 = options.encoding.to === '',
		paths = [],
		contents = '',
		content;
	
	// 计算 paths 
	names.forEach(function( name ){
		paths.push( options.path + name + '.js' );
	});
		
	// 合并文本内容
	paths.forEach(function( path ){
		// 读取
		content = fs.readFileSync( path, options.encoding, function( error ){
			if( error ){
				console.log( 'Combo error : ' + error );
			}
		});
		
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
	if( options.complete ){
		contents = options.complete( contents );
	}

	console.log( '======================================\n' +
	'All of [' + paths.length + '] files combo success.\n' +
	'======================================' );
	
	// 写入文件
	fs.writeFileSync( options.output, contents, options.encoding, function( error ){
		console.log( 'Output ' + (error ? 'error :' + error : 'the [' + options.output + '] success.') );
	});
};

exports.combo = combo;