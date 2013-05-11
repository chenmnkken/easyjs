// 语言扩展模块的测试
define( 'langCheck', ['check'], function( Check ){

return function(){
    var check = new Check( 'langBox' );
    
    check.run( 'capitalize', function(){ 
            return E.capitalize( 'top' ); 
        })
        .equal( 'Top' );    
        
    check.run( 'each', function(){
            var arr = [];
            E.each({ foo : 'bar' }, function( name, val ){
                arr.push( name );
                arr.push( val );
            });

            return arr;
        })
        .like( [ 'foo', 'bar' ] );
        
    check.run( 'isArray', function(){
            return E.isArray([]);
        })
        .equal( true );
        
    check.run( 'isBoolean', function(){
            return E.isBoolean( false );
        })
        .equal( true );
    
    check.run( 'isEmptyObject', function(){
            return E.isEmptyObject( { foo : 'bar' } );
        })
        .equal( false );
    
    check.run( 'isFunction', function(){
            return E.isFunction( function(){} );
        })
        .equal( true );    
    
    check.run( 'isNumber', function(){
            return E.isNumber( 25 );
        })
        .equal( true );    
        
    check.run( 'isObject', function(){
            var C = function(){},
                b;
                
            C.prototype = { getName : function(){} };    
            b = new C();
            
            return E.isObject( b );
        })
        .equal( true );
        
    check.run( 'isPlainObject', function(){
            var C = function(){},
                b;
                
            C.prototype = { getName : function(){} };    
            b = new C();
            
            return E.isPlainObject( b );
        })
        .equal( false );
        
    check.run( 'isRegExp', function(){
            return E.isRegExp( /\d+/ );
        })
        .equal( true );
        
    check.run( 'isString', function(){
            return E.isString( 'hello' );
        })
        .equal( true );
        
    check.run( 'isWindow', function(){
            return E.isWindow( window );
        })
        .equal( true );
        
    check.run( 'makeArray 1', function(){
            return E.makeArray( 'hello' );
        })
        .like( ['hello'] );
        
    check.run( 'makeArray 2', function(){
            return E.makeArray( 'world', ['hello'] );
        })
        .like( ['hello', 'world'] );
        
    check.run( 'parseJSON', function(){
            var jsonData = '[{"restore":false,"name":"foo"},{"restore":true,"name":"bar"}]';
            return E.parseJSON( jsonData )[0].name;
        })
        .equal( 'foo' );    
        
    check.run( 'parseXML', function(){
            var xmlData = '<target name="branche"><echo message="${project.code}" /></target>',
                doc = E.parseXML( xmlData ),
                target = doc.getElementsByTagName( 'target' )[0],
                name = target.getAttribute( 'name' );
                
            return name;
        })
        .equal( 'branche' );
        
    check.run( 'Array.prototype.every', function(){
            var flag = [ 1, 3, 5, 7 ].every(function( item ){    
                return item < 10;
            });

            return flag;
        })
        .equal( true );    
        
    check.run( 'Array.prototype.forEach', function(){
            var arr = [];
            [ 'hello', 'world' ].forEach(function( item, index ){
                arr.push( item );
                arr.push( index );
            });
            
            return arr;
        })
        .like( ['hello', 0, 'world', 1] );
        
    check.run( 'Array.prototype.indexOf', function(){
            return [ 1, 3, 5, 7 ].indexOf( 5 );
        })
        .equal( 2 );
        
    check.run( 'Array.prototype.lastIndexOf', function(){
            return [ 5, 1, 3, 5, 7 ].lastIndexOf( 5 );
        })
        .equal( 3 );
        
    check.run( 'Array.prototype.map', function(){
            var arr = [ 1, 3, 5, 7 ],
                newArr = arr.map(function( item ){
                    return item + 1;
                });
                
            return newArr;
        })
        .like( [2, 4, 6, 8] );
        
    check.run( 'Array.prototype.reduce', function(){                
            return [ 1, 3, 5, 7 ].reduce(function( prev, next ){
                return prev + next;
            }, 10 );
        })
        .equal( 26 );
        
    check.run( 'Array.prototype.reduceRight', function(){                
            return [ 'hello', 'world' ].reduceRight(function( next, prev ){
                return next + prev;
            }, 'easy.js' );
        })
        .equal( 'easy.jsworldhello' );
        
    check.run( 'Array.prototype.some', function(){                
            return [ 1, 3, 5, 7 ].some(function( item ){    
                return item === 5;
            });
        })
        .equal( true );
        
    check.run( 'Function.prototype.bind', function(){                
            var list = function(){
                    return Array.prototype.slice.call(arguments);
                },
             
            list1 = list( 1, 2, 3 ),
            leadingZeroList = list.bind( undefined, 37 ),
            list2 = leadingZeroList();
            
            return list2;
        })
        .like( [37] );
        
    check.run( 'Object.keys', function(){                
            return Object.keys({ name : 'easy.js', msg : 'is very easy to use' });
        })
        .like( ['name', 'msg'] );
        
    check.run( 'String.prototype.trim', function(){                
            return ' hello '.trim();
        })
        .equal( 'hello' );

    // 输出结果
    check.output();
};

});