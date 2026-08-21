'use strict';

const chunks=[
  require('./chunk01'),require('./chunk02'),require('./chunk03'),require('./chunk04'),
  require('./chunk05'),require('./chunk06'),require('./chunk07'),require('./chunk08'),
  require('./chunk09'),require('./chunk10'),require('./chunk11'),require('./chunk12'),
  require('./chunk13'),require('./chunk14'),require('./chunk15'),require('./chunk16')
];

const buffer=Buffer.from(chunks.join(''),'base64');
if(buffer.length!==12216||buffer[0]!==0xff||buffer[1]!==0xd8||buffer[buffer.length-2]!==0xff||buffer[buffer.length-1]!==0xd9){
  throw new Error('APG social-share JPEG integrity check failed');
}

module.exports=buffer;
