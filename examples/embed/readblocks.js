Fire=require('../../lib/fire-ts');

// Read the blocks in a file
console.log(Fire.readBlocks("\n// %{block1}\nHello\n// }%"));
