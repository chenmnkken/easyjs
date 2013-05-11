// 节点操作模块的测试
define( 'nodeCheck', ['check'], function( Check ){

return function(){
    var check = new Check( 'nodeBox' );
    
    // after
    check.run( 'after( htmlString )', function(){
            return E( '#afterBox1' ).after( '<p>paragraph1</p>' ).next()[0].tagName;
        })
        .equal( 'P' );
    
    check.run( 'after( element )', function(){
            return E( '#afterLink1' ).after( E.query('#afterSpan1')[0] ).next()[0].id;
        })
        .equal( 'afterSpan1' );
    
    check.run( 'after( easyJS Object )', function(){
            return E( '#afterLink2' ).after( E.query('#afterSpan2') ).next()[0].id;
        })
        .equal( 'afterSpan2' );
        
    check.run( 'after( elements )', function(){
            E( '#afterList2 dd:last-child' ).after( E('#afterList1 dd') );
            return E( '#afterList2' ).children().length;
        })
        .equal( 5 );
        
    check.run( 'after( args... )', function(){
            return E( '#afterBox2' ).after( E.query('#afterSpan3'), E.query('#afterEm1'), E.query( '#afterLink3' ) ).next()[0].id;            
        })
        .equal( 'afterSpan3' );
        
    // afterTo 
    check.run( 'afterTo( element )', function(){
            E( '#afterToEm1' ).afterTo( E.query('#afterToBox2')[0] );
            return E( '#afterToBox2' ).next()[0].id;
        })
        .equal( 'afterToEm1' );    
        
        
    // before
    check.run( 'before( htmlString )', function(){
            return E( '#beforeBox1' ).before( '<p>paragraph1</p>' ).prev()[0].tagName;
        })
        .equal( 'P' );
        
    // beforeTo
    check.run( 'beforeTo( elements )', function(){
            E( '<a href="#">new link </a>' ).beforeTo( E.query('#beforeToList1 span') );
            return E( '#beforeToList1 a' ).length;
        })
        .equal( 2 );
        
    // append 
    check.run( 'append( easyJS Object )', function(){
            return E( '#appendLink2' ).append( E('#appendSpan2') ).children( 'span' ).length;
        })
        .equal( 1 );
        
    // prepend 
    check.run( 'prepend( args... )', function(){
            return E( '#prependBox1' ).prepend( E.query('#prependSpan1'), E.query('#prependEm1'), E.query( '#prependLink1' ) ).children().length;
        })
        .equal( 3 );
        
    // prependTo 
    check.run( 'prependTo( elements )', function(){
            E( '<span>new span</span>' ).prependTo( E.query('#prependToBox1')[0] );
            return E( '#prependToBox1 span' ).text();
        })
        .equal( 'new span' );

    // children
    check.run( 'children()', function(){
            return E( '#queryList1' ).children().length;
        })
        .equal( 4 );    
        
    check.run( 'children( selector )', function(){
            return E( '#queryList1' ).children( '.item3' )[0].className;
        })
        .equal( 'item3' );
        
    // find
    check.run( 'find', function(){
            return E( '#queryList1' ).find( 'li.item3' )[0].className;
        })
        .equal( 'item3' );
        
    // next
    check.run( 'next()', function(){
            return E( '#queryList1 li:first-child' ).next()[0].className;
        })
        .equal( 'item2' );
        
    check.run( 'next( selector )', function(){
            return E( '#queryList1 li:first-child' ).next( 'li.item3' )[0].className;
        })
        .equal( 'item3' );
        
    // prev
    check.run( 'prev()', function(){
            return E( '#queryList1 li:last-child' ).prev()[0].className;
        })
        .equal( 'item3' );
        
    check.run( 'prev( selector )', function(){
            return E( '#queryList1 li:last-child' ).prev( 'li.item2' )[0].className;
        })
        .equal( 'item2' );
        
    // parent
    check.run( 'parent', function(){
            return E( '#queryList1 .item1' ).parent()[0].id;
        })
        .equal( 'queryList1' );
        
    // siblings
    check.run( 'siblings', function(){
            return E( '#queryList1 .item1' ).siblings().length;
        })
        .equal( 3 );
        
    // clone
    check.run( 'clone', function(){
            E( 'p.clonePara1' ).clone().appendTo( E.query('#cloneBox1') );
            return E( 'p.clonePara1' ).length;
        })
        .equal( 2 );
        
    check.run( 'clone(true)', function(){
            var p = E( 'p.clonePara2' ),
                clone;
                
            p.data( 'cloneTest', 1 );            
            clone = p.clone( true ).appendTo( E.query('#cloneBox1') );
            
            return E( 'p.clonePara2' ).length + clone.data( 'cloneTest' );
        })
        .equal( 3 );
        
    // create
    check.run( 'create', function(){
            return E( '#createBox1' ).append( E.create('<p>test1</p>') ).children().length;
        })
        .equal( 1 );
        
    // empty
    check.run( 'empty', function(){
            return E( '#emptyList1' ).empty().children().length;
        })
        .equal( 0 );
        
    // eq
    check.run( 'eq', function(){
            return E( '#queryList1 li' ).eq(0)[0].className;
        })
        .equal( 'item1' );
        
    // filter
    check.run( 'filter', function(){
            return E( '#queryList1 li' ).filter( '.item4' )[0].className;
        })
        .equal( 'item4' );
        
    // first
    check.run( 'first', function(){
            return E( '#queryList1 li' ).first()[0].className;
        })
        .equal( 'item1' );
        
    // last
    check.run( 'last', function(){
            return E( '#queryList1 li' ).last()[0].className;
        })
        .equal( 'item4' );
        
    // forEach
    check.run( 'forEach', function(){
            var arr = [];
            E( '#queryList1 li' ).forEach(function(){
                arr.push( this.innerHTML.trim() );
            });
            
            return arr;
        })
        .like( ['test1', 'test2', 'test3', 'test4'] );
        
    // html
    check.run( 'html()', function(){
            return E( '#htmlBox1' ).html().toLowerCase();
        })
        .equal( '<p>para1</p>' );
        
    check.run( 'html( htmlString )', function(){
            E( '#htmlBox1' ).html( '<p>para2</p>' );
            return E( '#htmlBox1' ).html().toLowerCase();
        })
        .equal( '<p>para2</p>' );
        
    check.run( 'html( element )', function(){
            E( '#htmlBox1' ).html( E.query('#htmlPara3')[0] );
            return E.create(E('#htmlBox1').html())[0].id;
        })
        .equal( 'htmlPara3' );
        
    check.run( 'html( easyJS Object )', function(){
            E( '#htmlBox1' ).html( E('#htmlPara4') );
            return E.create(E('#htmlBox1').html())[0].id;
        })
        .equal( 'htmlPara4' );
        
    // index
    check.run( 'index', function(){
            return E( '#queryList1 .item3' ).index();
        })
        .equal( 2 );    
        
    // is
    check.run( 'is', function(){
            return E( '#queryList1 li:first-child' ).is( '.item1' );
        })
        .equal( true );         
        
    // not
    check.run( 'not', function(){
            return E( '#queryList1 li' ).not( '.item3' ).length;
        })
        .equal( 3 );    
        
    // slice
    check.run( 'slice', function(){
            return E( '#queryList1 li' ).slice( 1 ).length;
        })
        .equal( 3 );
        
    // replace
    check.run( 'replace( htmlString )', function(){
            return E( '#replaceBox1' ).replace( '<p id="replacePara1">para1</p>' ).parent().length;
        })
        .equal( 0 );
        
    // text
    check.run( 'text()', function(){
            return E( '#queryList1 li:first-child' ).text().trim();
        })
        .equal( 'test1' );    

    check.run( 'text( content )', function(){
            E( '#queryList1 li:first-child' ).text( 'test text' );
            return E( '#queryList1 li:first-child' ).text();
        })
        .equal( 'test text' );        
        
    // wrap
    check.run( 'wrap', function(){
            return E( '#wrapPara1' ).wrap( '<div/>' ).parent()[0].className;
        })
        .equal( '' );

    // wrap
    check.run( 'unwrap', function(){
            return E( '#wrapPara1' ).unwrap().parent()[0].id;
        })
        .equal( 'sandbox' );

    // remove
    check.run( 'remove', function(){
            return E( '#emptyList1' ).remove().parent().length;
        })
        .equal( 0 );    
    
    // 输出结果
    check.output();
};

});
