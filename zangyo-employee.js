(function(){
function g(e){return e?e.innerText:''}
function h(e){return e?e.innerHTML:''}
function t(s){s=(s.match(/\d?\d[:：]\d\d/g)||[]).pop();return s?(s=s.split(/[:：]/),60*s[0]+ +s[1]):-1}
function z(x,y){return x>=0?x:y}
function o(s,e,a,b){var x=0,k;for(k=-1;k<2;k++)x+=Math.max(0,Math.min(e,b+1440*k)-Math.max(s,a+1440*k));return x}
function c(s,e,p){
 if(s<0||e<0)return 0;
 if(e<s)e+=1440;
 var r=p
  ? '1065,1110,1260,1275,1380,1395,1500,1515,1635,1650,1770,1785,1860,1875,525,540'
  : '525,540,735,780,1065,1080,1260,1275,60,75,195,210,330,345,420,435';
 var a=r.split(','),n=e-s,i;
 for(i=0;i<a.length;)n-=o(s,e,+a[i++],+a[i++]);
 return n;
}
function show(title,u){
 var rem=44.75-u/60;
 var old=document.getElementById('__zangyo_result');
 if(old)old.remove();

 var box=document.createElement('div');
 var close=document.createElement('button');
 var a=document.createElement('div');
 var b=document.createElement('div');
 var c=document.createElement('div');
 var d=document.createElement('div');

 box.id='__zangyo_result';
 box.style='position:fixed;top:12px;right:12px;z-index:999999;background:white;color:black;border:2px solid #333;padding:14px 16px;width:390px;max-width:92vw;box-shadow:0 4px 16px #0005;font:15px Meiryo,sans-serif;line-height:1.7';

 close.textContent='閉じる';
 close.style='float:right';
 close.onclick=function(){box.remove()};

 a.textContent='【'+title+' 残業チェック】';
 a.style='font-weight:700;font-size:17px;margin-bottom:8px';

 b.textContent='残業合計：'+(u/60).toFixed(2)+'h';

 c.textContent='45h超リミット＝44.75hまで残り：'+rem.toFixed(2)+'h';
 if(rem<10)c.style='color:#c00000;font-weight:700';

 d.textContent='ノリで作成したので間違っているかもしれません。\nややこしい勤務形態には対応できていません。\n苦情・修正依頼は気分がいいときに受け付けます。山田';
 d.style='white-space:pre-line;margin-top:12px';

 box.appendChild(close);
 box.appendChild(a);
 box.appendChild(b);
 box.appendChild(c);
 box.appendChild(d);
 document.body.appendChild(box);
}

try{
 var R=document.getElementsByTagName('table')[2].rows;
 var u=0,last=0,i,v,d,j,ea,os0,os,er,oe0,oe,st,en,p,m,w,sc,ec,wait;

 for(i=1;i<R.length;i++){
  v=R[i].cells;
  if(v.length>10&&/^\d\d月\d\d日/.test(d=g(v[0]))){
   j=g(v[2]);

   if(/振替休日/.test(j)){
    m=Math.min(last,465);
    u-=m;
    last-=m;
    continue;
   }

   ea=z(t(g(v[4])),t(g(v[3])));
   sc=g(v[7]);
   ec=g(v[8]);
   os0=t(sc);
   os=z(t(g(v[9])),os0);
   er=t(g(v[10]));
   oe0=t(ec);
   oe=z(er,oe0);
   wait=/事後報告\s*入力待ち|xs-tc-badge-orange/.test(sc+ec+h(v[7])+h(v[8]));

   st=ea>=0?ea:540;
   en=er>=0?er:(wait&&oe0>=0?oe0:1050);
   p=st>734;

   if(/\(土\)|\(日\)|休日|出勤登録/.test(d+j)){
    w=c(ea<0?os:ea,oe,p);
    if(w<0)w=0;
    m=/代付/.test(j)?Math.max(0,w-465):w;
   }else{
    w=c(st,en,p);
    m=w-465;
   }

   u+=m;
   if(m>0)last=m;
  }
 }

 show('社員用',u);
}catch(e){
 alert('エラー:'+e.message);
}
})();
