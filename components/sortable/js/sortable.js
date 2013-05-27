/*
* Sortable components v0.1.0 for easy.js
*
* Copyright (c) 2013 Yiguo Chan
* Released under the MIT Licenses
*
* Mail : chenmnkken@gmail.com
* Date : 2013-5-11 
*/
define(['../../drop/js/drop'], function(){

'use strict';

var defaults = {       
    connect    :   null,      // String 允许符合选择器匹配的拖放排序列表插入到当前拖放排序列表中
    disable    :   null       // String 禁止拖拽列表中符合该选择器匹配的子元素进行拖放排序操作
};

var Drag = E.ui.Drag,
    Drop = E.ui.Drop,

    easySortable = {

        start : function( e ){
            E( e.drag ).css({
                opacity : '0.3',
                zIndex : '10000'
            });        
        },
        
        end : function( e ){
            var dragElem = E( e.drag );
            dragElem.css( 'zIndex', '' )
                .anim({
                    to : { opacity : 1 },
                    complete : function(){
                        dragElem.css( 'opacity', '' );
                    }
                });    
        },
        
        enter : function( o, e ){
            var dragElem = e.drag,
                dropElem = e.drop,
                dragParent = dragElem.parentNode,
                $drag = E( dragElem ),
                $drop = E( dropElem ),
                dragIndex = $drag.index(),
                dropIndex = $drop.index(),
                connect = $drop.data( 'sortConnect' ),
                isPrev = false,
                sibling;
                
            if( dropElem.parentNode === dragParent ){          
                // 如果是非相邻的2个元素进行排序，需要先记录drop元素的兄弟元素    
                if( o.drops.length > 2 && Math.abs(dragIndex - dropIndex) > 1 ){
                    sibling = $drop.next();
                    
                    if( !sibling.length ){
                        sibling = $drop.prev();
                        isPrev = true;
                    }
                }
                
                $drag[ dragIndex < dropIndex ? 'before' : 'after' ]( dropElem );
                
                // 根据drop元素的兄弟元素的位置来插入drag元素
                if( sibling ){
                    sibling[ isPrev ? 'after' : 'before' ]( dragElem ); 
                }
            }
            else if( connect && Drop.filter(dragParent, connect) ){
                $drop.before( dragElem );
                $drag.data( 'sortConnect', connect );
            }
            else{
                return;
            }
            
            // drop元素的位置变更后需要重新更新dropCache中的位置值
            Drop.refresh( $drop );
            o.target.fire( 'moved', { drag : dragElem, drop : dropElem });
        }

    };

var Sortable = function( target, options ){
    target = E( target ).eq( 0 );
    options = options || {};
    
    var o = E.merge( defaults, options ),        
        elems = target.children(),
        connect = o.connect,
        drags = [],
        drops = [],
        i = 0,
        len;
        
    o.drags = drags;
    o.drops = drops;    
    o.target = target;

    elems.forEach(function(){
        var elem = E( this );
        if( !o.disable || !elem.is(o.disable) ){        
            drags.push( 
                new Drag( this, {
                    refresh : false,
                    proxy : true
                }) 
            );
            
            drops.push(
                new Drop( this )
            );
            
            if( connect ){
                elem.data( 'sortConnect', connect );
            }
        }
    });
    
    drags.forEach(function( drag, i ){                    
        drag.on( 'dragstart', easySortable.start )
            .on( 'dragend', easySortable.end );

        drops[i].on( 'dropenter', function( e ){
            easySortable.enter( o, e );
        });
    });
    
    this.__o__ = o;
};

Sortable.prototype = {
    
    destroy : function(){
        if( !this.__o__ ){
            return;
        }
        
        var o = this.__o__;
        
        o.drags.forEach(function( drag, i ){
            drag.destroy();
            o.drops[i].destroy();
        });
        
        o.target.un( 'moved' );        
        o = o.drags = o.drops = null;
        delete this.__o__;
    },
    
    on : function( type, fn ){
        if( !this.__o__ ){
            return;
        }
        
        var self = this;        
        this.__o__.target.on( type, function( e, drag, drop ){
            e.drag = e.extraData.drag;
            e.drop = e.extraData.drop;
            delete e.extraData;
            e.type = type;
            fn.call( self, e );
            e.stopPropagation();
        });
        
        return this;
    },
    
    un : function( type ){
        if( this.__o__ ){
            this.__o__.target.un( type );
        }
        
        return this;
    }
};

E.ui.Sortable = Sortable;

});