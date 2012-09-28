// ---------------------------------------------
// ---------------@module data------------------
// ---------------------------------------------
 
define( 'data', 'lang', function(){

E.cache = {};

var easyData = {

	/*
	 * 获取和设置元素的缓存索引值，小于3的索引值都是为特殊元素准备的
	 * window 的索引为 0，document 的索引为 1，
	 * document.documentElement 的索引为2
	 * @param { HTMLElement }
	 * @param { Boolean } 为ture的时如果元素没有索引值将创建一个
	 * @return { Number } 返回元素的索引值
	 */
	getCacheIndex : function( elem, isSet ){
		if( elem.nodeType === 1 ){
			var euid = E.euid;
			return !isSet || euid in elem ? 
				elem[ euid ] : 
				( elem[ euid ] = ++E.__uuid__ );		
		}
		
		return E.isWindow( elem ) ? 0 :
			elem.nodeType === 9 ? 1 :
			elem.tagName === 'HTML' ? 2 : -1;	
	},

	/*
	 * 写入/获取缓存
	 * @param { HTMLElement }
	 * @param { String } 缓存的命名空间( data:外部调用, event:事件系统, anim:动画系统 )
	 * @param { String } 缓存的key
	 * @param { Anything } 缓存的值
	 * @param { Boolean } 是否覆盖( true:覆盖, false:不覆盖，如果缓存的值是undefined将val作为缺省值写入 )
	 * @return { Anything } 缓存的值
	 */
	data : function( elem, type, name, val, overwrite ){
		var result,
			cache = E.cache,
			isUndefined = val === undefined,
			index = easyData.getCacheIndex( elem, !isUndefined );
			
		if( index !== undefined ){
			if( !(index in cache) ){
				cache[ index ] = {};
			}

			cache = cache[ index ];
			
			if( !(type in cache) ){
				cache[ type ] = {};
			}
			
			result = cache[ type ][ name ];
			
			if( isUndefined || (!overwrite && result !== undefined) ){
				return result;
			}

			if( overwrite || !isUndefined ){
				cache[ type ][ name ] = val;
				return val;
			}
		}			
	},

	/*
	 * 移除缓存
	 * @param { HTMLElement }
	 * @param { String } 缓存的一级命名空间
	 * @param { String } 缓存的key
	 */	
	removeData : function( elem, type, name ){
		var index = easyData.getCacheIndex( elem ),
			cacheData = E.cache;
			
		if( index in cacheData ){
			// 有参数就删除指定的数据
			cacheData = cacheData[ index ];
			if( name && cacheData[type] ){
				delete cacheData[ type ][ name ];
			}
			
			// 无参数或空对象都删除所有的数据
			if( !name || E.isEmptyObject(cacheData[type]) ){
				cacheData[ type ] = null;
				delete cacheData[ type ];
			}
			
			if( E.isEmptyObject(cacheData) ){
				delete E.cache[ index ];
				cacheData = undefined;
			}
			
			// 索引值小于3都无需删除DOM元素上的索引值
			if( index < 3 ){
				return;
			}
			
			// 缓存中无数据了则删除DOM元素上的索引值
			if( cacheData === undefined ){
				try{
					delete elem[ E.euid ];
				}
				catch( _ ){
					elem.removeAttribute( E.euid );
				}
			}
		}	
	},
	
	hasData : function( elem ){
		var index = easyData.getCacheIndex( elem );
		return !!( index !== undefined && E.cache[index] );
	}

};

E.mix( E.prototype, {

	data : function( name, val ){
		if( val === undefined ){
			return easyData.data( this[0], 'data', name );
		}

		return this.forEach(function(){
			easyData.data( this, 'data', name, val, true );
		});
	},
		
	removeData : function( name ){
		return this.forEach(function(){
			easyData.removeData( this, 'data', name );
		});
	}
	
});

// @exports
return easyData;

});