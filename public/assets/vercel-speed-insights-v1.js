'use strict';
window.si=window.si||function(){(window.siq=window.siq||[]).push(arguments)};
window.si('beforeSend',function(event){
  try{
    var url=new URL(event&&event.url?event.url:location.href,location.origin);
    if(url.pathname==='/my-apg'||url.pathname==='/my-apg/'||url.pathname.indexOf('/my-apg/')===0)return null;
    url.search='';
    url.hash='';
    return Object.assign({},event,{url:url.origin+url.pathname});
  }catch(_error){
    return event;
  }
});
