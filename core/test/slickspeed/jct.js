/**
 * JavaScript Common Templates(jCT) 3(第3版)
 * http://code.google.com/p/jsct/
 *
 * licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Author achun (achun.shx at gmail.com)
 * Create Date: 2008-6-23
 * Last Date: 2008-12-4
 * Revision:3.8.12.4
 */
function jCT(txt,path){//构建jCT对象,仅仅准备基础数据
	this.Fn={JavaScriptCommonTemplates:3.0,Src:txt||'',Path:path||''};
}
jCT.prototype={
	Extend:function(jct){//扩展自己
		for (var i in jct){
			if(this[i] && this[i].Fn && this[i].Fn.JavaScriptCommonTemplates && this[i].Extend )
				this[i].Extend(jct[i]);
			else if(jCT.Reserve.indexOf(','+i+',')==-1)//防止保留成员被覆盖
				this[i]=jct[i];
		}
		if(typeof jct.RunNow=='function')
			this.RunNow();
		return this;
	},
	ExtendTo:function(jct){//附加到其他对象上
		for (var i in this){
			if(i=='RunNow') continue;
			if(this[i].ExtendTo && this[i].Fn && this[i].Fn.JavaScriptCommonTemplates){
				if(undefined == jct[i]) jct[i]={};
				this[i].ExtendTo(jct[i]);
			}else
				jct[i]=this[i];
		}
		if(typeof jct.RunNow=='function')
			jct.RunNow();
		return jct;
	},
	ExecChilds:function(childs,exec){//执行childs对象所列成员里的某个方法，默认是Exec方法
		if(typeof childs=='string'){
			exec=childs;
			childs=0;
		}else
			exec=exec||'Exec';
		if(!childs){
			childs={};
			for (var c in this)
				if(this[c].Fn && this[c].Fn.JavaScriptCommonTemplates)
					childs[c]=false;
		}
		for(var c in childs)
			if(this[c] && (typeof this[c][exec]=='function')){
				this[c][exec](childs[c]);
		}
		return this;
	},
	BuildChilds:function(childs){//构建子jCT对象,并执行RunNow
		if(undefined==childs) childs=[];
		if (typeof childs=='string') childs=childs.split(',');
		var cs={};
		for(var i=0;i<childs.length;i++) cs[childs[i]]=true;
		for (var i in this)
		if(this[i].Fn && this[i].Fn.JavaScriptCommonTemplates && (childs.length==0 || cs[i]))
			this[i].Build();
		return this;
	},
	GetView:function(){return 'Invalid templates';},//得到装配数据后的视图，此方法会在Build的过程中重建,并且清除输出缓存
	GetViewContinue:function(){return 'Invalid templates';},//得到装配数据后的视图，此方法会在Build的过程中重建
	Build:function(txt,path){//构建实例
		if (txt) this.Fn.Src=txt;
		if (path) this.Fn.Path=path;
		jCT.Construct.Build(this);
		return this;
	}
};
(function(){
	jCT.Reserve=',Fn,';
	for (var i in jCT.prototype)
		jCT.Reserve+=i+',';
})();
jCT.Tags={//几种不同的模板定义风格
		comment:{//注释标签风格
			block:{begin:'<!---',end:'-->'},//语法块标记
			exp:{begin:'+-',end:'-+'},//取值表达式
			member:{begin:'/*+',end:'*/'},//定义成员语法标记
			memberend:{begin:'/*-',end:'*/'},//定义成员结束语法标记
			clean:{begin:'<!--clean',end:'/clean-->'}//清理标记
		},
		script:{//脚本标签风格
			block:{begin:'<script type="text/jct">',end:'</script>'},
			exp:{begin:'+-',end:'-+'},
			member:{begin:'/*+',end:'*/'},
			memberend:{begin:'/*-',end:'*/'},
			clean:{begin:'<!--clean',end:'/clean-->'}
		},
		code:{//code标签风格
			block:{begin:'<code class="jct">',end:'</code>'},
			exp:{begin:'+-',end:'-+'},
			member:{begin:'/*+',end:'*/'},
			memberend:{begin:'/*-',end:'*/'},
			clean:{begin:'<!--clean',end:'/clean-->'}
		}
};
jCT.Construct={
	Build:function(ins){
		for (var tag in jCT.Tags)//自动判断模板风格
			if (ins.Fn.Src.indexOf(jCT.Tags[tag].block.begin)>=0) break;
		tag=jCT.Tags[tag];
		ins.Fn.Template=[];//由src转换的模板数组
		ins.Fn.View=[];//执行的视图结果,以数组形式存放
		ins.Fn.Code=[];//代码
		var a=[];//clean 模板
		var p=[0,0,0,0,0];
		var max=ins.Fn.Src.length;
		while (this.Slice(ins.Fn,tag.clean,p[4],p,max))
			a.push(ins.Fn.Src.slice(p[0],p[1]));
		if(a.length){
			a.push(ins.Fn.Src.slice(p[4]));
			ins.Fn.Src = a.join('');
		}
		this.Parse(ins,tag);
		try{
			ins.GetViewContinue=new Function(ins.Fn.Code.join('\n'));
		}catch (ex){
			ins.ERROR=ex.message + '\n'+ (ex.lineNumber || ex.number);
			return ins;
		}
		ins.GetView=function(){
			this.Fn.View=[];
			this.GetViewContinue.apply(this,arguments);
			return this.Fn.View.join('');
		};
		delete ins.Fn.Src;
		if(ins.RunNow) ins.RunNow();
		return ins;
	},
	Parse:function(ins,tag){
		var Fn=ins.Fn;
		var A = Fn.Template,E=Fn.Code,max= Fn.Src.length,p=[0,0,0,0,0],p1=[0,0,0,0,0];
		function pushTemplate(start,end){
			var str=Fn.Src.slice(start,end);
			if (str.search(/\S/)>=0){
				E.push('this.Fn.View.push(this.Fn.Template['+A.length+']);');
				A.push(str);
			}
		}
		while (this.Slice(Fn,tag.block,p[4],p,max)){//语法分2段
			p1=[0,0,0,0,p[0]];
			while (this.Slice(Fn,tag.exp,p1[4],p1,p[1])){//处理取值表达式
				pushTemplate(p1[0],p1[1]);
				E.push('this.Fn.View.push('+Fn.Src.slice(p1[2],p1[3])+');');
			}
			pushTemplate(p1[4],p[1]);
			if (this.Slice(Fn,tag.member,p[2],p1,p[3])){//处理扩展语法
				var str=Fn.Src.slice(p1[2],p1[3]);
				var foo=Fn.Src.slice(p1[4],p[3]);
				if (str.slice(0,1)=='@'){//子模板
					var child=tag.block.begin+tag.memberend.begin+str+tag.memberend.end+tag.block.end;
					var tmp = Fn.Src.indexOf(child,p[4]);
					if (tmp>0){
						var newins=new jCT(Fn.Src.slice(p[4],tmp),Fn.Path)
						if (ins[str.slice(1)])
							newins.ExtendTo(ins[str.slice(1)]);
						else
							ins[str.slice(1)]=newins;
						p[4] = tmp + child.length;
					}
				}else if (str.slice(0,1)=='$'){//成员对象
					var obj=new Function('return '+foo+';');
					ins[str.slice(1)]=obj.call(ins);
				}else //成员函数
					ins[str]=new Function(foo);
			}else//javascript语句
				E.push(Fn.Src.slice(p[2],p[3]));
		}
		p1=[0,0,0,0,p[4]];p[1]=max;
		while (this.Slice(Fn,tag.exp,p1[4],p1,p[1])){//处理取值表达式
			pushTemplate(p1[0],p1[1]);
			E.push('this.Fn.View.push('+Fn.Src.slice(p1[2],p1[3])+');');
		}
		pushTemplate(p1[4],p[1]);
	},
	Slice:function(Fn,tag,b1,p,max){//把string第2段分成2段
		var e1,b2,e2;
		e1=Fn.Src.indexOf(tag.begin,b1);
		if (e1<0 || e1>=max) return false;
		b2=e1+tag.begin.length;
		if (b2<0 || b2>=max) return false;
		e2=Fn.Src.indexOf(tag.end,b2);
		if (e2<0 || e2>=max) return false;
		p[0]=b1;p[1]=e1;
		p[2]=b2;p[3]=e2;
		p[4]=e2+tag.end.length;
		return true;
	}
};