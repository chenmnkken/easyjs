// 种子模块的测试
define( 'easyCheck', ['check'], function( Check ){

return function(){
    var check = new Check( 'easyBox' ),
        a = { name : 'test1' },
        b = { foo : 'bar', name : 'easy.js', value : 'test2' };
    
    // merge
    check.run( 'merge', function(){ 
            return E.merge( a, b ); 
        })
        .like({ 
            name : 'easy.js', 
            foo : 'bar', 
            value : 'test2' 
        });
    
    // mix 覆盖
    check.run( 'mix override', function(){ 
            return E.mix( a, b ); 
        })
        .like({ 
            name : 'easy.js', 
            foo : 'bar', 
            value : 'test2' 
        });
    
    // mix 不覆盖
    check.run( 'mix none override', function(){ 
            return E.mix( a, { name : 'test1' }, false ); 
        })
        .like({ 
            name : 'easy.js', 
            foo : 'bar', 
            value : 'test2' 
        });
    
    // mix 白名单
    check.run( 'mix whitelist', function(){ 
            return E.mix( a, { foo : 'bar', value : 'test3' }, ['foo'] ); 
        })
        .like({ 
            name : 'easy.js', 
            foo : 'bar', 
            value : 'test2' 
        });
            
    // 版本        
    check.run( 'version', function(){
            return E.version; 
        })
        .equal( '1.1.2' );
    
    // 输出结果
    check.output();
};

});