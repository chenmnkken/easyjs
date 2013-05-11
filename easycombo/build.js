require( './easyCombo' ).easyCombo({
    baseUrl : './',
    uglifyUrl : '../uglify/uglify-js',
    modules : [{
        input : ['hello'],
        output : './hello-combo.js'
    }]    
});