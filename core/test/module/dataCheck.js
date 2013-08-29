// 数据存储模块的测试
define( 'dataCheck', ['check'], function( Check ){

return function(){
    var check = new Check( 'dataBox' ),
        elem = E( '#dataBox' );
    
    check.run( 'data 1', function(){
            elem.data( 'name', 'easy.js' );
            elem.data( 'foo', 'bar' );
            
            return elem.data( 'name' );
        })
        .equal( 'easy.js' );

    check.run( 'removeData 1', function(){
            elem.removeData( 'name' );
            return elem.data( 'name' );
        })
        .equal( undefined );

    check.run( 'data 2', function(){            
            return elem.data( 'foo' );
        })
        .equal( 'bar' );    

    check.run( 'removeData 2', function(){
            elem.removeData( 'foo' );
            return elem.data( 'foo' );
        })
        .equal( undefined );        

    // 输出结果
    check.output();
};

});