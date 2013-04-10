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
}%

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



 
