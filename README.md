Fire TS
=======

Build Status: [![Build Status](https://travis-ci.org/celer/fire-ts.png)](https://travis-ci.org/celer/fire-ts)

# Introduction

Fire TS is a template engine for generating code. 

 * Designed to generate C, C++, Java, JavaScript, Ruby, Perl, HTML
 * Tries to generate well formatted code
 * Can update existing generated files with out overwriting everything
 * Designed to be compatible with the combustion template system  

If you want to generate HTML templates you should consider other template engines

## The basics

The syntax for Fire TS looks a lot like JSP, except the base language is JavaScript

```c
<%
	var colors=[ "red","blue","green"];
	var numbers=[1,2,3,5];
%>

#include<stdio.h>

/*%{header}
	
	The text in this 'header' block can be overridden by what is found in the file that wil be overwritten when this file is generated. Allowing the user to edit this bit of comment or code safely without having to worry about loosing his/her changes.

}%*/

//%{prefix}  

//This code will be preserved, even when the template is re-generated!!!
const char *prefix=">";

//}%

char *colors[]={
	<% for(var i in colors){ 
			var color = colors[i];
	%>
		<%# color %>,
	<% } %>
	NULL 
};

int *numbers[]={ 
	<% numbers.map(function(number){ %>
		<%= number %>,
	<% }); %>
	NULL 
};

void main(){
	int i,j;
	for(i=0;colors[i];i++){
		for(j=0;numbers[j];j++){
			printf("%s %s %d\n",prefix,colors[i],numbers[j]);
		}
	}
}

```

And will generate this:

```c
#include<stdio.h>

/*%{header}
	This text was pulled from the file that was gonna be over written.	
}%*/

//%{prefix}
const char *prefix="<";
//}%

char *colors[]={
	"red",
	"blue",
	"green",
	NULL 
};

int *numbers[]={ 
	1,
	2,
	3,
	5,
	NULL 
};

void main(){
	int i,j;
	for(i=0;colors[i];i++){
		for(j=0;numbers[j];j++){
			printf("%s %s %d\n",prefix,colors[i],numbers[j]);
		}
	}
}


```
# Writing templates!

## Evaluating code

Anything in: 

```jsp
<% CODE %> 
```
will be evaluated as JavaScript, and it can even be multi-line

```jsp
Let's do some looping
<%
	for(var i=0;i<3;i++){
		if(i==2){
%>
			i is 2
<%	
		}
	}
%>
```
Which would even track the number of opening and closing braces to properly add and remove tab characters from the output - So your templates and your generated code will look good!

```
Let's do some looping
i is 2
```

If you want to actually indent "i is 2" simply add more tabs to it. 

## Expressions

There are multiple types of expressions

**Raw**


This will just output the value of the variable or expression with no formatting
```jsp
	<!-- Output the raw variable or expression -->
	<%=variable%>
```

**JSON Encoded**

This will output the JSON encoded variable or expression
```jsp
	<!-- Output a JSON encoded value - which works well for 'c' escaped strings  -->
	<%#variable%>
```

**URL Encoded**

This will output a URL escaped string
```jsp
	<!-- Output a URL encoded value  -->
	<%%variable%>
```

## Capturing and modifying the template

```jsp

//Will replace Their with There
<%(%>Hello Their <%=name%><%).replace(/Their/,"There")%> 

//Will convert this to lower case 
<%(%>MiXeDcAsE<%).toLowerCase()%>


``` 

Using '<%(%>' and '<%)%>' allows you to capture and modify result of that part of the template as a string and modify it. Here are a few examples:



## Including sub-templates

If you want to nest templates you an do this:

```jsp
	<%- header.fts %>
```

All the inputs and options pasted to the top template will be passed to the nested templates. If you need to capture variables from one template to the nested templates:

```jsp
	<%- header.fts (variableA,variableB) %>
```

will capture local variableA and variableB and pass them into the nested template

## Blocks

One of the more advanced features of Fire-TS is that it can preserve the contents of the file it is going to over-write. Let's say for example you want to have a SQL file:

```sql
<%
	var colors=[ "red","blue","green"];
	var numbers=[1,2,3,5];
%>


-- %{schema} 

create table colors (
	id bigint auto_increment,
	color varchar(20) not null,
	number bigint not null,
);

-- }%

<% colors.map(function(color){ %>
	<% numbers.map(function(number){ %>
		insert into colors (name) values(<%#color%>,<%=number%>);
	<% }); %>
<% }); %>

```

Fire-TS will see if the file it is about to over-write exists, and look for blocks ( starting with '%{[A-Za-z0-9]+}' and ending with '}%' ) and read them from the old file, and then insert them into the newly written output. Allowing you to preserve certain parts of older files. In the example above it would let you safely modify the schema and have the inserts regenerated each time!


# Embedding

Take a look at bin/fire-ts to get an idea how to use the templating engine, you can install it globally using

```shell
	npm install fire-ts -g
```

Here is the API in a nutshell:

```javascript

/**
	Compiles a template into a function or code
	
	@param {String} template - A string containing a template
	@param {Object} options
		@param {Boolean} async - generate an asynchronously nested template
		@param {Boolean} source - don't return a function, return code instead
		@param {Boolean} uglify - use uglify on the code
		@param {Object} blocks - a hash of blocks to use

	@returns a template function or a string chunk of javascript code
*/
Fire.compile(template,options);

/**
	Read the blocks from string of code, for use with generating code
	
	@returns {Object} as hash of blocks
*/
Fire.readBlocks(template)
Fire.readFileBlocks(template,onComplete)
Fire.readFileBlocksSync(template)

/**
	Generate an output file given a template and an output file

	This will read the blocks from the output file and re-use them if they exist

	@param {String} template - A string containing a template
	@param {Object} options
		@param {Boolean} async - generate an asynchronously nested template
		@param {Boolean} source - don't return a function, return code instead
		@param {Boolean} uglify - use uglify on the code
		@param {Object} blocks - a hash of blocks to use (these will override those provided)
	
*/
Fire.generateSync(template,options)

/**
	Generate an output file given a template

	@param {String} template - A string containing a template
	@param {Object} options
		@param {Boolean} async - generate an asynchronously nested template
		@param {Boolean} source - don't return a function, return code instead
		@param {Boolean} uglify - use uglify on the code
		@param {Object} blocks - a hash of blocks to use (these will override those provided)
*/
Fire.parseSync(template,options)
Fire.parse(template,options,onComplete)

```

You can see embedding examples here: https://github.com/celer/fire-ts/tree/master/examples/embed

# Command line

```shell
./fire-ts
Options:
  --output    File to write (will reload blocks)            
  --template  The template to use                           
  --compile   The template to compile                       
  --input     The input to use to run the template (as JSON)
  --blocks    The blocks to use (as a JSON hash)            
  --compare   Compare the output file to the specified file 
  --uglify    Uglify the compiled template                  
  --debug     Debug   
```

Let's run a template

```shell
./bin/fire-ts --template test/1.fts
```

Let's compile a template

```shell
./bin/fire-ts --compile test/1.fts
```
Results in 

```javascript
function template(_$_i,_$_o,_$_oc){_$_o=_$_o||{},_$_o.b=_$_o.blocks||{};var _$_s="",_$_e=_$_o.e||function(_){_$_s+=_};with(_$_o.j||JSON.stringify,_$_o.render,_$_i)_$_e("Hello\n  1\n  2 \n  3\n  4\n  5\n6\n   6\n 7 8\n   A\n     B\n");return _$_s}
```





