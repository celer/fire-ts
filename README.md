Fire TS
=======

## Introduction

Fire TS is a template engine for generating code. 

 * Designed to generate C, C++, Java, JavaScript, Ruby, Perl, HTML
 * Tries to generate well formated code
 * Can update existing generated files with out overwriting everything
 * Designed to be compatible with the cumbustion template system  

If you want to generate HTML templates you should consider other template engines

## Guide

The syntax for Fire TS looks alot like JSP:

```c
<%
	var colors=[ "red","blue","green"];
	var numbers=[1,2,3,5];
%>

#include<stdio.h>

/*%{header}
	
 	This is an example C program showing how Fire TS can be used to template C code

}%*/

//%{prefix}  
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

# Evaluating code

Anything in: 

```jsp
<% CODE %> 
```
will be evaluated as javascript, and it can even be multi-line

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

# Expressions

There are multiple types of expressions

*Raw*


This will just output the value of the variable or expression with no formating
```jsp
	<!-- Output the raw variable or expression -->
	<%=variable%>
```

*JSON Encoded*

This will output the JSON encoded variable or expression
```jsp
	<!-- Output a JSON encoded value - which works well for 'c' escaped strings  -->
	<%#variable%>
```

*URL Encoded*

This will output a URL escaped string
```jsp
	<!-- Output a URL encoded value  -->
	<%%variable%>
```

# Including sub-templates

If you want to nest templates you an do this:

```jsp
	<%- header.fts %>
```

All the inputs and options pasted to the top template will be passed to the nested templates. 

# Blocks

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

Fire-TS will see if the file it is about to over-write exists, and look for blocks ( starting with '%{[A-Za-z0-9]+}' and ending with '}%' ) and read them from the old file, and then insert them into the newly written output. Allowing you to preserve certain parts of older files. In the example above it would let you safely modify the schema and have the insert's regenerated each time!





 
