<h1>easy.js 一个简洁的 JavaScript 库</h1>
<p>模块化的 JavaScript 时代已经到来，easy.js 在保持了 jQuery 式的简洁易用的 API 设计风格的同时，同时也集成了模块加载器。模块式的开发可以更好的组织代码，实现按需使用，配合上 eays.js 灵活的 DOM 操作的封装以及语言上的扩展，让开发者可以专注于解决实际业务需求的模块开发。</p>
<h3>快速上手</h3>
<p>easy.js 尽量遵循 <a href="http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition" target="_blank">AMD</a> 的模块加载规范，该规范更适用于客户端 JavaScript 编写的习惯，使用 easy.js 定义一个模块：</p>
<pre>
define( 'hello', function(){
	return 'hello world';
});
</pre>
<p>将以上代码保存成 hello.js，就成了一个模块，然后使用 easy.js 来加载和使用该模块：</p>
<pre>
E.use( 'hello', function( sayHello ){
	E( 'body' ).html( sayHello );
});
</pre>
<h3>easy.js 的优点</h3>
<ol>
	<li>遵循 AMD 规范的模块加载；</li>
	<li>更快的 CSS3 标准的选择器；</li>
	<li>增强的 JavaScript 动画效果；</li>
	<li>更简洁的 API；</li>
	<li>易读的源码；</li>
</ol>
<h3>项目目录说明</h3>
<ul>
	<li><b>build</b>&emsp;成品发布目录</li>
	<li><b>docs</b>&emsp;API 文档目录</li>
	<li><b>src</b>&emsp;开发目录</li>
	<li><b>test</b>&emsp;单元测试目录</li>
	<li><b>tools</b>&emsp;合并压缩目录</li>
</ul>
<h3>欢迎您的参与</h3>
<p>虽然 easy.js 在开源前已经经过无数手动测试和单元测试，但难免会存在一些 BUG，或者需要改进的地方。如果你有任何建议或者发现了任何 BUG，都可以通过邮件联系我，或者加入 QQ 群，一起讨论 easy.js 和模块化 JavaScript 的开发。</p>
<ul>
	<li>邮箱：chenmnkken@gmail.com</li>
	<li>QQ群：202604349</li>
</ul>
