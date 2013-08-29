// 属性操作模块的测试
define( 'attrCheck', ['check'], function( Check ){

return function(){
    var check = new Check( 'attrBox' ),
        attrDiv = E( '#attrDiv' ),
        attrInput1 = E( '#attrInput1' ),
        attrCheck1 = E( '#attrCheck1' ),
        attrCheck2 = E( '#attrCheck2' ),
        attrRadio1 = E( '#attrRadio1' ),
        attrRadio2 = E( '#attrRadio2' );
        
    // addClass
    check.run( 'addClass 1', function(){
            attrDiv.addClass( 'test1 test2' );
            return attrDiv[0].className;
        })
        .equal( 'test1 test2' );
        
    check.run( 'addClass 2', function(){
            attrDiv.addClass( 'test2' );
            return attrDiv[0].className;
        })
        .equal( 'test1 test2' );
        
    check.run( 'addClass 3', function(){
            attrDiv.addClass( 'test3' );
            return attrDiv[0].className;
        })
        .equal( 'test1 test2 test3' );
        
    // hasClass    
    check.run( 'hasClass', function(){        
            return attrDiv.hasClass( 'test3' );
        })
        .equal( true );
    
    // removeClass    
    check.run( 'removeClass', function(){        
            attrDiv.removeClass( 'test3' );
            return attrDiv.hasClass( 'test3' );
        })
        .equal( false );
    
    // replaceClass    
    check.run( 'replaceClass', function(){        
            attrDiv.replaceClass( 'test2', 'test3' );
            return attrDiv.hasClass( 'test2' );
        })
        .equal( false );
    
    // toggleClass    
    check.run( 'toggleClass', function(){        
            attrDiv.toggleClass( 'test2' );
            return attrDiv.hasClass( 'test2' );
        })
        .equal( true );
    
    // attr    
    check.run( 'get attr 1', function(){        
            return attrDiv.attr( 'gameid' );
        })
        .equal( 'hello' );
        
    check.run( 'set attr 1', function(){        
            attrDiv.attr( 'gameid', 'hello world' );
            return attrDiv.attr( 'gameid' );
        })
        .equal( 'hello world' );
        
    check.run( 'get attr 2', function(){        
            return attrCheck1.attr( 'checked' );
        })
        .equal( 'checked' );
        
    check.run( 'set attr 2', function(){        
            attrCheck2.attr( 'checked', 'checked' );
            return attrCheck2.attr( 'checked' );
        })
        .equal( 'checked' );
        
    // removeAttr
    check.run( 'removeAttr', function(){        
            attrCheck2.removeAttr( 'checked' );
            return attrCheck2.attr( 'checked' );
        })
        .equal( undefined );    
        
    // prop    
    check.run( 'set prop 1', function(){        
            attrDiv.prop( 'areaid', 'hello' );
            return attrDiv.prop( 'areaid' );
        })
        .equal( 'hello' );

    check.run( 'get prop 1', function(){        
            return attrRadio1.prop( 'checked' );
        })
        .equal( true );
        
    check.run( 'get prop 2', function(){        
            return attrRadio2.prop( 'checked' );
        })
        .equal( false );
        
    check.run( 'set prop 2', function(){        
            attrRadio2.prop( 'checked', true );
            return attrRadio2.prop( 'checked' );
        })
        .equal( true );
        
    check.run( 'set prop 3', function(){        
            attrRadio1.prop( 'checked', false );
            return attrRadio1.prop( 'checked' );
        })
        .equal( false );
        
    // removeProp
    check.run( 'removeProp 1', function(){        
            attrDiv.removeProp( 'areaid', 'hello' );
            return attrDiv.prop( 'areaid' );
        })
        .equal( undefined );
        
    // val
    check.run( 'get val', function(){        
            return attrInput1.val();
        })
        .equal( 'hello' );    
        
    check.run( 'set val', function(){    
            attrInput1.val( 'hello world' );
            return attrInput1.val();
        })
        .equal( 'hello world' );
    
    
    // 输出结果
    check.output();
};

});
