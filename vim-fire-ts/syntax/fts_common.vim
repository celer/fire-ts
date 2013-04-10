syn include @ftsJS syntax/javascript.vim

syn region ftsBlock matchgroup=ftsHdr start=/%{header}/ keepend end=/}%/ contains=ALLBUT,@ftsJS
syn region ftsEval  matchgroup=ftsTag  start=/<%/ keepend end=/%>/ contains=@ftsJS
syn region ftsEval matchgroup=ftsTag  start=/<%=/ keepend end=/%>/ contains=@ftsJS
syn region ftsEval matchgroup=ftsTag  start=/<%#/ keepend end=/%>/ contains=@ftsJS
syn region ftsEval matchgroup=ftsTag  start=/<%?/ keepend end=/%>/ contains=@ftsJS
syn region ftsEval matchgroup=ftsTag  start=/<%-/ keepend end=/%>/ contains=@ftsJS

hi def link ftsHdr Macro
hi def link ftsTag Delimiter
