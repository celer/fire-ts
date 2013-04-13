
{

	join=function(i){
		if(i instanceof Array) return i.join('');
	  if(i==null) return ''
		return i;
	}

	buildBlocks=function(lines){
		return lines;			
	}

}




start
	= expr:expr* { return expr; }

type
	= '{' type:(!'}' .)+ '}' { return type.map(function(i){ return i[1]; }).join(""); }

space
	= ' '
	/ '\t'

nl
	= '\n\r'
	/ '\n'

es
	= space
	/ nl

word
	= word:(!space .)+ { return space.map(function(i){ return i[1]; }).join('')};

text
	= text:(!'\n' .) { return text[1] };


any
	= indent:space* "@method" space+ text:text+ nl { 
																										return { 
																															indent: join(indent), 
																															type:"@method", 
																															text: join(text) 
																													} 
																								}

	/ indent:space* "@param" space+ type:type space+ text:text+ nl { 
																										return { 
																															indent: join(indent), 
																															type:"@param", 
																															text: join(text),
																															type: join(type)
																													} 

																									}
	/ indent:space* "@param" space+ name:word space+ type:type text:text+ nl { 
																										return { 
																															indent: join(indent), 
																															type:"@param", 
																															name: join(name),
																															text: join(text),
																															type: join(type)
																													} 

																									}

	/ indent:space* "@return" "s"? space+ type:type space+ text:text+ nl { 
																										return { 
																															indent: join(indent), 
																															type:"@return", 
																															text: join(text),
																															type: join(type)
																													} 

																									}
	/ indent:space* "@return" "s"? space+  text:text+ nl { 
																										return { 
																															indent: join(indent), 
																															type:"@return", 
																															text: join(text),
																													} 

																									}
	
	/ indent:space* "@example" "s"? space+  text:text+ nl { 
																										return { 
																															indent: join(indent), 
																															type:"@example", 
																															text: join(text),
																															block: true
																													} 

																									}

	/ indent:space* text:text* nl {
																	return { 
																			indent:join(indent),
																			text:join(text)	
																	}
																}
  / indent:space* nl
 

startComment
	= '/**'
	/ '<!--'
	/ '/*'
	
endComment
	= '*/'
	/ '-->'



expr
	= (!startComment any)+ { return ''; }
	/ sc:startComment comment:(!endComment any)+ ec:endComment { 
																												return comment;
																												}
