var pZo = s => s.length % 2 // string becomes padded string
  ? "0" + s
  : s
var nPr = s => s.match(/.{1,2}/g).map(s => parseInt(s, 16)) // padded string becomes array of bytes
var eRt = n => nPr(pZo(n.toString(16))) // number becomes padded string
var rRt = a => a.reduceRight((p, n, i, a) => p + n * Math.pow(16, a.length - i - 1), 0) // padded string becomes number
function Mote(lib) {
  this.lib = lib
}
Mote.prototype.tokenize = function(s) {
  return s.split(/(?:\n| )+/)
}
Mote.prototype.parse = function(s) {
  s = this.tokenize(s)
  var memory = 0
  var vars = {}
  var k = ""
  for (var i = 0; i < s.length; i++) {
    if (s[i] == ";") break // first semicolon denotes end of var declarations
    else if (i % 2) {
      vars[k] = {
        index: memory,
        size: +s[i]
      }
      memory += +s[i]
    }
    else k = s[i]
  }
  return {
    vars, memory, code: s.slice(i + 1)
  }
}
Mote.prototype.exec = function(s) {
  s = this.parse(s)
  var mem = new Uint8Array(s.memory)
  var argStack = []
  
  for (var i = 0; i < s.code.length; i++) {
    //console.log(i, s.code[i], argStack)
    if (s.code[i][0] == "$" && !isNaN(parseInt(s.code[i].substr(1), 16))) {
      argStack.push(nPr(s.code[i].substr(1))) // number as array of bytes
    } else if (s.code[i] == "SET") {
      mem.set(argStack.pop(), rRt(argStack.pop())) // number as array of bytes, pointer as array of bytes
    } else if (s.code[i] == "GET") {
      let ptr = rRt(argStack.pop())
      argStack.push(mem.slice(ptr, ptr + rRt(argStack.pop()) + 1)) // pointer as array of bytes, number as array of bytes
    } else if (s.code[i] == ";") {
      argStack = [] // clear argStack
    } else if (s.code[i] in this.lib) {
      this.lib[s.code[i]](argStack.reverse(), argStack) // call external lib
    } else if (s.code[i][0] == "@") {
      argStack.push(mem.slice(s.vars[s.code[i].substr(1)].index, s.vars[s.code[i].substr(1)].index + s.vars[s.code[i].substr(1)].size)) // pointer as array of bytes, number as array of bytes
    } else {
      argStack.push(eRt(s.vars[s.code[i]].index)) // get pointer as array of bytes from label
    }
  }
}
