// ---------------------------------------------
// --------------@module promise----------------
// ---------------------------------------------
 
define(function(){

'use strict';

var pmeCache = {};

E.Promise = function(){
    var i = 0,
        uuid = E.guid(),
        args, list, sourceUuid, len, targetCache, sourceCache;
        
    targetCache = pmeCache[ uuid ] = {};        
    list = arguments.length === 0 ? [ this ] : Array.prototype.concat.apply( [], arguments[0] );
    len = list.length;        
    
    // 为promiseList中的promise实例添加uuid，这样才能在cache中找到自己
    for( ; i < len; i++ ){
        sourceUuid = list[i].uuid;
        // 如果实例中已有uuid，则先删除后添加
        if( sourceUuid ){            
            sourceCache = pmeCache[ sourceUuid ];
            
            // 同步的函数执行过快，会过早改变状态
            // 复制原cache中的resolve参数到新cache中
            if( 'resolveArgs' in sourceCache ){
                targetCache.resolveArgs = [];
                targetCache.resolveArgs[i] = sourceCache.resolveArgs[0];
            }

            if( 'rejectArgs' in sourceCache ){
                targetCache.rejectArgs = [];
                targetCache.rejectArgs[i] = sourceCache.rejectArgs[0];                
            }
            
            sourceCache = null;
            delete pmeCache[ sourceUuid ];
        }
        
        list[i].uuid = uuid;
    }
    
    // 缓存promiseList
    targetCache.list = list;    
    this.uuid = uuid;    
    // 未完成状态
    this.state = 'pending';
};

E.Promise.prototype = {

    // 执行已完成状态
    resolve : function( arg ){
        var data = pmeCache[ this.uuid ],
            isAllResolved = true,
            list, i, len, pme, resolves, resolveArgs;
            
        if( data ){
            // 已完成状态
            this.state = 'resolved';
            resolveArgs = data.resolveArgs;
            
            if( !resolveArgs ){
                resolveArgs = data.resolveArgs = [];
            }            
            
            list = data.list;
            len = list.length;
            
            // 所有的promise实例都是完成状态才能执行then
            for( i = 0; i < len; i++ ){
                pme = list[i];
                if( pme.state !== 'resolved' ){
                    isAllResolved = false;
                }
                
                // 缓存resolve的参数，将该参数传送给回调，并确保参数传递的先后次序
                if( pme === this ){
                    resolveArgs[i] = arg;
                }
            }            
            
            resolves = data.resolves;

            // 执行已完成的回调
            if( isAllResolved && resolves ){                
                len = resolves.length;
                for( i = 0; i < len; i++ ){
                    resolves[i].apply( null, resolveArgs );
                }
                
                delete pmeCache[ this.uuid ];
            }
        }
    },
    
    // 执行已拒绝状态
    reject : function( arg ){
        var data = pmeCache[ this.uuid ],
            isRejected = false,
            list, i, len, pme, rejectes, rejectArgs;
            
        if( data ){
            list = data.list;
            len = list.length;        
            rejectArgs = data.rejectArgs;
            
            if( !rejectArgs ){
                rejectArgs = data.rejectArgs = [];
            }
            
            // 确保reject只执行一次
            // 检查是否有未完成状态的promise实例
            // 有就说明已执行过
            for( i = 0; i < len; i++ ){
                pme = list[i];
                if( pme.state === 'rejected' ){
                    isRejected = true;
                }
                else{
                    pme.state = 'rejected';
                }
                
                if( pme === this ){
                    rejectArgs[i] = arg;
                }
            }
            
            rejectes = data.rejectes;
            
            // 执行已拒绝的回调
            if( !isRejected && rejectes ){                
                len = rejectes.length;
                for( i = 0; i < len; i++ ){
                    rejectes[i].apply( null, rejectArgs );
                }
                
                delete pmeCache[ this.uuid ];
            }
        }
    },
    
    // 添加已完成和已拒绝的回调
    then : function( resolved, rejected ){
        var data = pmeCache[ this.uuid ],
            isAllResolved = true,
            isRejected = false,
            i = 0,
            list, len, state;

        if( data ){
            list = data.list;
            len = list.length;
            
            for( ; i < len; i++ ){
                state = list[i].state;
                if( state !== 'resolved' ){
                    isAllResolved = false;
                    
                    if( state === 'rejected' ){
                        isRejected = true;
                    }
                }
            }
            
            if( resolved ){
                // 同步直接执行
                if( isAllResolved ){
                    resolved.apply( null, data.resolveArgs );
                }
                // 异步添加队列
                else{
                    if( !data.resolves ){
                        data.resolves = [];
                    }                    
                    data.resolves.push( resolved );
                }                
            }
            
            if( rejected ){
                // 同步直接执行
                if( isRejected ){
                    rejected.apply( null, data.rejectArgs );
                }
                // 异步添加队列
                else{
                    if( !data.rejectes ){
                        data.rejectes = [];
                    }                        
                    data.rejectes.push( rejected );
                }
            }
        }
        
        return this;
    }    
};

E.when = function(){
    return new E.Promise( arguments );
};

});