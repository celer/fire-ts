start
	= expr:expr* { return expr; }

chars
	= "\n"
	/ "\r\n"
	/ "\r"
	/ .

nonl
	= [^\n]

nl
	= "\n"
	/ "\r\n"

sp
	= "\t"
	/ " "

spc
	= sp:(sp*) { return sp.join(""); }

string
	= chars:(!'<%' nonl ) { return chars.join(''); }

code
	= chars:(!'%>'chars) { return chars.join(''); }

block
	= chars:(!'}%'chars) { return chars.join(''); }
	
lineComment
 	= '//'
	/ '#'
	/ '--'

startComment
	= '<!--'
	/ '/**'
	/ '/*'

endComment
	= '*/'
	/ '-->'

texpr
	= '='
	/ '%'
	/ '?'
	/ '@'	
	/ '#'

	
jse
	= spc '(' spc '%>' { 
											return { e:'(', line:line, code:"F"}; 
										}
	/ spc ')' '.'? code:code+ '%>' { 
															code=code.join('');
															return { code: code, e: ')', line: line };
														}

	/ e:(texpr?) code:code+ '%>' anl:nl? {
																		code=code.join(''); 
																		if(e instanceof Array){
																			e=e.join('');
																		}
																		return { code: code, e:e, anl:anl, line: line, column: column }; 
																}

expr
	= sc:(lineComment spc) '%{' block:([A-Za-z0-9\.\_]+) '}' code:block+ '}%'? {
																																						sc=sc.join("");
																																						block=block.join("");
																																						code=code.join("");
																																						return { string:code, block: block, sc: sc, ec:"",line:line };
																																					}
	/ sc:(startComment spc) '%{' block:([A-Za-z0-9\.\_]+) '}' code:block+ '}%' ec:(spc endComment spc) {
																																						sc=sc.join("");
																																						ec=ec.join("");
																																						block=block.join("");
																																						code=code.join("");
																																						return { string:code, block: block, ec:ec, sc:sc, line:line };
																																					}
	/ fsp:sp*'<%' jse:jse { 
																			if(fsp instanceof Array){
																				fsp=fsp.join('');
																			}
																			jse.fsp=fsp;
																			return jse; 
																	}
	/ string:string+  {
												string=string.join(""); 
												return { string: string, line: line, column: column };
										}
	/ nl: nl { 
							return { nl: "\n", line: line, column:column };	
							//return (ts()+"n();\n" 
						}

