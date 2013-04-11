start
	= expr:expr* { return expr; }

any
	= .
	/ '\n'

startComment
	= '/**'
	/ '<!--'
	/ '/*'
	
endComment
	= '*/'
	/ '-->'
	

expr
	= (!startComment any)+ { return ''; }
	/ startComment comment:(!endComment any)+ endComment { 
																												return comment.map(function(i){ return i[1]; }).join('');
																												}
