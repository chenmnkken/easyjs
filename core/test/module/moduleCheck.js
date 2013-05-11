// 模块加载的测试
define( 'moduleCheck', ['check'], function( Check ){

return function(){        
    var check = new Check( 'moduleBox' );
        
    E.use( ['../assets/test1', '../assets/test2'], function( str1, str2 ){
        check.run( 'module load', function(){
                return str1 + ', ' + str2; 
            })
            .equal( 'test1 is done, deps : [ test3 ], test2 is done, deps : [ test3, test4 ]' );    

        check.output();
    });
};
    
});