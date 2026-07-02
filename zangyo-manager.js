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
function night(s,e,p){
 if(s<0||e<0)return 0;
 if(e<s)e+=1440;
 if(e<=1320)return 0;
 return c(Math.max(s,1320),e,p);
}
function hours(minutes){
 return (minutes/60).toFixed(2)+'h';
}
function show(title,u,details){
 var rem=44.75-u/60;
 var old=document.getElementById('__zangyo_result');
 if(old)old.remove();

 var box=document.createElement('div');
 var close=document.createElement('button');
 var heading=document.createElement('div');
 var total=document.createElement('div');
 var remaining=document.createElement('div');
 var detailButton=document.createElement('button');
 var detailBox=document.createElement('div');
 var notice=document.createElement('div');

 box.id='__zangyo_result';
 box.style='position:fixed;top:12px;right:12px;z-index:999999;background:white;color:black;border:2px solid #333;padding:14px 16px;width:430px;max-width:92vw;max-height:88vh;overflow:auto;box-shadow:0 4px 16px #0005;font:15px Meiryo,sans-serif;line-height:1.7';

 close.textContent='閉じる';
 close.style='float:right';
 close.onclick=function(){box.remove()};

 heading.textContent='【'+title+' 残業チェック】';
 heading.style='font-weight:700;font-size:17px;margin-bottom:8px';

 total.textContent='残業合計：'+hours(u);

 remaining.textContent='45h超リミット＝44.75hまで残り：'+rem.toFixed(2)+'h';
 if(rem<10)remaining.style='color:#c00000;font-weight:700';

 detailButton.textContent='内訳';
 detailButton.style='margin-top:10px;padding:4px 14px';

 detailBox.textContent=details.length?details.join('\n'):'残業・調整はありません。';
 detailBox.style='display:none;white-space:pre-line;margin-top:8px;padding:8px;background:#f5f5f5;border:1px solid #ccc;font-size:13px';

 detailButton.onclick=function(){
  var open=detailBox.style.display!=='none';
  detailBox.style.display=open?'none':'block';
  detailButton.textContent=open?'内訳':'内訳を閉じる';
 };

 notice.textContent='ノリで作成したので間違っているかもしれません。\nややこしい勤務形態には対応できていません。\n苦情・修正依頼は気分がいいときに受け付けます。山田';
 notice.style='white-space:pre-line;margin-top:12px';

 box.appendChild(close);
 box.appendChild(heading);
 box.appendChild(total);
 box.appendChild(remaining);
 box.appendChild(detailButton);
 box.appendChild(detailBox);
 box.appendChild(notice);
 document.body.appendChild(box);
}

try{
 var R=document.getElementsByTagName('table')[2].rows;
 var u=0,last=0,i,v,d,j,ea,os0,os,er,oe0,oe,st,en,p,m,w,sc,ec,wait,sub;
 var details=[];

 for(i=1;i<R.length;i++){
  v=R[i].cells;
  if(v.length>10&&/^\d\d月\d\d日/.test(d=g(v[0]))){
   j=g(v[2]);

   if(/振替休日/.test(j)){
    sub=Math.min(last,465);
    u-=sub;
    last-=sub;
    if(sub!==0)details.push(d+'　振替休日調整：-'+hours(sub));
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
    m=night(st,en,p);
   }

   u+=m;
   if(m!==0)details.push(d+'　残業：'+hours(m));
   if(m>0)last=m;
  }
 }

 show('課長用',u,details);
}catch(e){
 alert('エラー:'+e.message);
}
})();
