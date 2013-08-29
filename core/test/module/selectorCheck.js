// 选择器模块的测试
define( 'selectorCheck', ['check'], function( Check ){

return function(){
    var check = new Check( 'selectorBox' ),
        list = E.query( '#queryList1' )[0];
    
    check.run( 'query', function(){            
            return E.query( 'li.item1', list )[0].className
        })
        .equal( 'item1' );

    check.run( 'filter', function(){
            return E.filter( E.query( 'li', list ), '.item3' )[0].className;
        })
        .equal( 'item3' );

    check.run( 'contains', function(){            
            return E.contains( E.query('#sandbox')[0], list );
        })
        .equal( true );        

    // 输出结果
    check.output();
};

});