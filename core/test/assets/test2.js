define( 'test2', ['test3', 'test4'], function( obj, str ){
	return 'test2 is done, deps : [ ' + obj.name + str + ' ]';
});