// 样式操作模块的测试
define( 'cssCheck', ['check'], function( Check ){

return function(){
    var check = new Check( 'cssBox' ),
        title = E( '.wrapper h1' ),
        attrDiv = E( '#attrDiv' );

    // width
    check.run( 'width', function(){
        return title.width();
        })
        .equal( 750 );
    
    // outerWidth
    check.run( 'outerWidth', function(){
        return title.outerWidth();
        })
        .equal( 750 );
        
    // innerWidth
    check.run( 'innerWidth', function(){
        return title.innerWidth();
        })
        .equal( 750 );
        
    // height
    check.run( 'height', function(){
        return title.height();
        })
        .equal( 50 );
    
    // outerHeight
    check.run( 'outerHeight', function(){
        return title.outerHeight();
        })
        .equal( 62 );
        
    // innerHeight
    check.run( 'innerHeight', function(){
        return title.innerHeight();
        })
        .equal( 60 );
        
    // css    
    check.run( 'set css 1', function(){
            attrDiv.css({ 'padding' : '10px', 'float' : 'left' });
            return attrDiv.css( 'float' );
        }).equal( 'left' );
        
    check.run( 'get css 1', function(){
            return attrDiv.css( 'padding' );
        }).equal( '10px 10px 10px 10px' );
        
    check.run( 'set css 2', function(){
            attrDiv.css( 'color', '#000' )
            return attrDiv.css( 'color' );
        }).equal( 'rgb(0, 0, 0)' );
        
    check.run( 'get css 2', function(){
            return attrDiv.css( 'fontSize' );
        }).equal( '13px' );
        
    // offset
    check.run( 'offset', function(){
            return title.offset().top;
        }).equal( 50 );
    
    // 输出结果
    check.output();
};

});


