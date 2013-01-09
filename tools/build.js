var version = '0.8.0',
    licenses = 'MIT and GPL Licenses',
    rDefine = /define\(.+\r\n/,
    date = new Date(),
    timeStamp = date.getFullYear() + '-' + 
                ( date.getMonth() + 1 ) + '-' + 
                date.getDate() + ' ' + 
                date.getHours() + ':' + 
                date.getMinutes() + ':' + 
                date.getSeconds();

// 合并        
require( './combo' ).combo({
    path : '../src/',
    names : 'easy lang-patch lang support data selector node attr css event promise anim ajax',
    output : '../build/easy-' + version + '.js',
    format : function( content ){
        if( rDefine.test(content) ){
            // 去掉各模块的use strict
            content = content.replace( /['"]use strict['"];*\r\n/, '' );
            
            // 去掉 define 的调用
            content = content.replace( rDefine, '' );
        }
        
        // 去掉 exports
        if( ~content.indexOf('// @exports') ){
            content = content.replace( /\/\/\s@exports(.|\r\n)+/, '' );
        }
        // 去掉 define 的结束符
        else{
            content = content.slice( 0, content.lastIndexOf('})') );
        }
        
        return content;
    },
    complete : function( content ){
        var copyright = '/*\n' +
                         '* easy.js v' + version + '\n' +
                         '*\n' +
                         '* Copyright (c) 2012 Yiguo Chen\n' +
                         '* Released under the ' + licenses + '\n' +
                         '*\n' +
                         '* Mail : chenmnkken@gmail.com\n' +
                         '* Date : ' + timeStamp + '\n' +
                         '*/\n\n';
                         
        // 设置版本号
        content = content.replace( /@version@/, version );
        return copyright + content + '\n})( window );';
    }
});

// 压缩
require( './compress' ).compress({
    compilerPath : '../../compiler.jar',
    input : '../build/easy-' + version + '.js',
    output : '../build/easy-' + version + '.min.js',
    callback : function( content ){
        return '/* easy.js v' + version + ' | '+ licenses + ' | ' + timeStamp + ' */\n' + content;
    }
});