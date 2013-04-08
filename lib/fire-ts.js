var PEG = require('pegjs');
var fs = require('fs');
var path = require('path');


var Fire={};

Fire.loadParser=function(){
	var data = fs.readFileSync(path.join(__dirname,"../static","fire.pegjs"));
	Fire.parser=PEG.buildParser(data.toString(),{trackLineAndColumn:true});
}

Fire.loadParser();

Fire.loadWrapper=function(){
	var wrapper=fs.readFileSync(path.join(__dirname,"../static/","wrapper.fre"));
	wrapper=wrapper.toString();
	var res = Fire.parser.parse(wrapper);
	res = Fire.process(res);
	res = Fire.optimize(res);
	var w = Fire.toString(res);
	eval("Fire.wrapper=function wrapper(input,o){ o=o||{}; var s='', j=JSON.stringify, e=function(i){ s+=i }; with(input){ "+w+" } return s;}"); 
}

Fire.ts=function(tabDepth){
	var ts="";
	for(var i=0;i<tabDepth;i++){
		ts+="\t";
	}
	return ts;
}

Fire.processCode=function(opts,input){
	//process code just tracks tabdepth
	if(/{\s*$/.test(input.code)){ 
		input.code=Fire.ts(opts.tabDepth)+input.code.trim()+"\n";
		opts.tabDepth++;
	} else if(/}\s*$/.test(input.code)){
		opts.tabDepth--;
		input.code=Fire.ts(opts.tabDepth)+input.code.trim()+"\n";
	}
	input.td=opts.tabDepth;

	return input;
}	

Fire.processString=function(opts,input){
	//process string will remove our current tab depth from strings
	var tc=Fire.ts(opts.tabDepth);

	input.string=input.string.split("\n").map(function(t){
		if(t.indexOf(tc)==0){
			t=t.substr(tc.length);
		}
		return t;
	}).join("\n");
	input.td=opts.tabDepth;

	return input;
}

Fire.processNL=function(opts,input){
	input.td=opts.tabDepth;
	return input;
}

Fire.process=function(res){
	var opts={ tabDepth: 0 };
	
	return res.map(function(input){
		if(input.string){
			return Fire.processString(opts,input);
		} else if(input.code){
			return Fire.processCode(opts,input);
		} else if(input.nl){
			return Fire.processNL(opts,input);
		}
	});

}


Fire.optimize=function(res){
	var ret=[];
	var ss=[];
	var td=null;
	var MAX=9007199254740992;
	var lmin=MAX, lmax=0;
	for(var i in res){
		var r = res[i];
		//If it is code
		if(r.code){
			//If there is some stuff in the string buffer let's clear it
			if(ss.length>0){
				ret.push({ string: ss.join(""), td:td, lmin: lmin, lmax:lmax});
				lmin=MAX;lmax=0;
				ss=[];
			}
			ret.push(r);
			//If the code whas an expression then we need to emit a new line
			if(r.e && r.anl){
				//If the new line is on the same tab depth then we can just push it on to the string stack
				if(td==r.td){
					ss.push('\n');
					lmin=Math.min(r.line,lmin);
					lmax=Math.max(r.line,lmax);
				} else {
					//Otherwise if the new line is on a different tab depth let's push out the current string stack
					if(ss.length>0){
						ret.push({ string: ss.join(""), td: td, lmin:lmin, lmax:lmax });
						ss=[];
					}
					//reset the min/max lines
					lmin=Math.min(r.line,MAX);
					lmax=Math.max(r.line,0);
					td=r.td;
					ss.push('\n');
				}	
			}
		} else {
			if(r.block){
				if(ss.length>0){
					ret.push({ string: ss.join(""), td: td, lmin: lmin, lmax:lmax });
				}
				lmin=Math.min(r.line,MAX);
				lmax=Math.max(r.line,0);
				ss=[];
				ret.push({ string: r.string, td: r.td, lmin: lmin, lmax: lmax, block: r.block, ec: r.ec, sc:r.sc });	
			} else {
				//If it is a string and on different tab depths
				if(td!=r.td){
					//Let's clear the string stack
					if(ss.length>0){
						ret.push({ string: ss.join(""), td: td, lmin: lmin, lmax:lmax });
					}
					lmin=Math.min(r.line,MAX);
					lmax=Math.max(r.line,0);
					ss=[];
					td=r.td;
				}
				//Otherwise let's capture the string
				lmin=Math.min(r.line,lmin);
				lmax=Math.max(r.line,lmax);
				if(r.string && r.string.length>0){
					ss.push(r.string);
				} else {
					ss.push(r.nl);
				}
			}
		}
	}
	if(ss.length>0){
		ret.push({ string: ss.join(""), td: td, lmin: lmin, lmax:lmax });
	}
	return ret;
}

Fire.readFileBlocksSync=function(file){
	var infile = fs.readFileSync(file);
	var res = Fire.parser.parse(infile.toString());
	res=Fire.process(res);
	var blocks={};
	res.map(function(i){
		if(i.block){
			blocks[i.block]=i.string;
		}
	});
	return blocks;
}

Fire.generateSync=function(template,outFile,input,opts){
	opts=opts||{};
	if(fs.existsSync(outFile)){
		opts.blocks=opts.blocks||{};
		var blocks=Fire.readFileBlocksSync(outFile);
		for(var i in blocks){
			if(!opts.blocks[i]){
				opts.blocks[i]=blocks[i];
			}
		}
	}
	var res = Fire.parseSync(template);
	eval("var templ=eval("+res+")");
	var out = templ(input,opts);
	fs.writeFileSync(outFile,out);
}

Fire.parseSync=function(file){
	var template = fs.readFileSync(file);
	var res = Fire.parser.parse(template.toString());
	res = Fire.process(res);
	res = Fire.optimize(res);
	res = Fire.toString(res,{async:false});
	return res;
}

Fire.parse=function(file,onComplete){
	fs.readFile(file,function(err,data){
		if(err) return onComplete(err);
		try {
			var res = Fire.parser.parse(data.toString());
			res = Fire.process(res);
			res = Fire.optimize(res);
			res = Fire.toString(res,{async:true});
			return onComplete(null,res);
		} catch(e){
			return onComplete(e);
		}
	});
}

Fire.toString=function(res,opts){
	var s = "";
	opts=opts||{};
	var deps=[];
	var lastLine=-1;
	res.map(function(input){
		var tc = Fire.ts(input.td);
		if(input.line && opts.lineNumbers){
			if(lastLine!=input.line){
				s+=tc+"o.ls=o.le="+input.line+";\n";
			} 
			lastLine=input.line;
		}	else if((input.lmin || input.lmax) && opts.lineNumbers){
			if(input.lmin==input.lmax){
				if(lastLine!=input.lmin){
					s+=tc+"o.ls=o.le="+input.lmin+";\n";
				} 
				lastLine=input.lmin;
			} else {
				s+=tc+"o.ls="+input.lmin+";o.le="+input.lmax+";\n";
			}
		}
		if(input.string){
			if(input.block){
				s+=tc+"e('"+input.sc+"%{"+input.block+"}'+(o.b["+JSON.stringify(input.block)+"]?o.b["+JSON.stringify(input.block)+"]:"+JSON.stringify(input.string)+")+'}%"+input.ec+"');\n";
			} else {
				s+=tc+"e("+JSON.stringify(input.string)+");\n";	
			}	
		} else if(input.code){
			if(input.e){
				if(input.e=="="){
					s+=tc+"e("+input.code+");\n";
				} else if(input.e=='-'){			
					deps.push(input.code.trim());	
					s+=tc+"r("+JSON.stringify(input.code.trim())+",i,o);\n";
				} else if(input.e=='%'){			
					s+=tc+"e(encodeURIComponent("+input.code+"));\n";
				} else if(input.e=='?'){			
					s+=tc+"if(typeof "+input.code+"!='undefined')";
				}	else if(input.e=='#'){
					s+=tc+"e(j("+input.code+"));\n";
				}
			} else {
				s+=tc+input.code;	
			}		
		} 
	});

  //s="function(input,o){ \n\to=o||{};\n\tvar s='',e=(o.e||function(i){ s+=i; }), j=(o.j||JSON.stringify);\n\t\nvar n=function(){ e('\\n') };\nwith(input){\n"+s+"\n\t}\nreturn s;\n};";
	if(Fire.wrapper){
		s=Fire.wrapper({ code:s, async:opts.async, deps: deps});	
	}
	return s;
}

Fire.loadWrapper();

module.exports=Fire;
