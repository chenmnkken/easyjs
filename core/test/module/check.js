// 单元测试的构造器
define( 'check', function(){

    var Check = function( id ){
        var elem = this.elem = document.getElementById( id );    
        this.resultHtml = '';
        
        this.writeResult = function( name, time, error ){
            this.resultHtml += ( error ? 
                '<li class="error">[ <b>' + name + '</b> ] 未通过测试&emsp;错误原因：' + error + '</li>' : 
                '<li><span class="f_333">[ <b>' + name + '</b> ]</span> 通过测试&emsp;耗时 <b class="f_333">' + time + '</b> ms</li>' );
        };
    };

    Check.prototype = {

        run : function( name, fn ){
            var startTime;
                
            this.name = name;
            this.result = null;
            this.error = null;

            startTime = +new Date();
            
            try{
                this.result = fn();
            }
            catch( error ){
                this.error = new Error( error );
            }
            
            this.endTime = (+new Date()) - startTime;

            return this;
        },    
        
        equal : function( result ){
            var flag = this.result === result;
            if( this.error === null ){
                if( !flag ){
                    this.error = '返回值为[ ' + this.result + ' ]&emsp;期望值为[ ' + result + ' ]';
                }            
            }
            
            this.writeResult( this.name, this.endTime, this.error );
            
            return this;
        },
        
        like : function( result ){
            var len = result.length,
                i = 0,
                name, flag, error;
                
            if( this.error === null ){
                if( len ){
                    for( ; i < len; i++ ){
                        if( this.result[i] !== result[i] ){
                            this.error = '返回值为[ ' + this.result[i] + ' ]&emsp;期望值为[ ' + result[i] + ' ]';
                            break;
                        }
                    }
                }
                else{
                    for( name in result ){
                        if( this.result[name] !== result[name] ){
                            this.error = '[ ' + name + ' ]的返回值为[ ' + this.result[name] + ' ]&emsp;期望值为[ ' + result[name] + ' ]';
                            break;                        
                        }
                    }
                }
            }
            
            this.writeResult( this.name, this.endTime, this.error );
        },
        
        output : function(){
            var resultList = document.createElement( 'ul' ),
                para = document.createElement( 'p' ),
                box = this.elem,
                errorCount = 0,
                i = 0,
                items, len, errorList, item;
                
            resultList.innerHTML = this.resultHtml;
            resultList.className = 'result_list';
            
            box.appendChild( resultList );
            items = resultList.getElementsByTagName( 'li' );
            len = items.length;
        
            if( len > 0 ){
                errorList = document.createElement( 'ul' );
                errorList.className = 'error_list';
            }
            
            for( ; i < len; i++ ){
                item = items[i];
                if( item.className === 'error' ){
                    errorList.appendChild( item.cloneNode(true) );
                    errorCount++;
                }
            }
            
            para.innerHTML = '共 <b class="f_333">' + len + '</b> 条测试数据，成功 <b class="f_green">' + ( len - errorCount ) + '</b> 条，失败 <b class="f_red">' + errorCount + '</b> 条。';
            box.appendChild( para );

            if( errorCount ){
                box.appendChild( errorList );
                box.className += ' error_box';
            }
            else{
                box.className += ' success_box';
            }
        }
        
    };

    return Check;

});