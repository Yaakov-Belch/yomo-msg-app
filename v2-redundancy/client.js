const ipcUrl='ws://';

const peers   =['Alice','Bob','Carol'];
const servers =['Srv1','Srv2','Srv3'];

import React from 'react';
import {yomoApp, yomoView, cacheFn, waitUntil, yomoClock}
  from 'yomo/v1';
import {
  yomoBridge,linkPipes, getPipe,pipes, yomoRun, connCheck,
  combineReducers, timeNow, WaitIcon,
} from 'yomo/lib/experimental.js';

// state: {me,peer,msg,pipes}

// styles:
const normal      ={};
const selected    ={backgroundColor:'#888'};
const soft        ={backgroundColor:'#ddf',color:'#888'};
const softSelected={backgroundColor:'#aaf',color:'#000'};

const loginButton=(yomo,me)=>({
  onClick:()=>yomo.dispatch({type:'login',me})
});
const me=(state='',action)=>{
  switch(action.type) {
    case 'login': return action.me;
  }
  return state;
}

const peerButton=(yomo,peer,next)=>({
  style: (peer===next)? selected:normal,
  onClick:()=>yomo.dispatch({type:'setPeer',peer:next}),
});
const peer=(state='',action)=>{
  switch(action.type) {
    case 'login':   return action.me;
    case 'setPeer': return action.peer;
  }
  return state;
};

const msgInput=(yomo)=>{
  const {me,peer,msg}=yomo.state();
  return {
    size: 45,
    value:msg,
    onChange:(e)=>yomo.dispatch({type:'msg',txt:e.target.value}),
    onKeyPress:(e)=>{ if(e.key==='Enter') {
      yomo.dispatch({type:'pipe',id:`${me}-${peer}`,value:msg});
      yomo.dispatch({type:'msg',txt:''});
    }},
  };
};
const msg=(state='',action)=>{
  switch(action.type) {
    case 'msg': return action.txt;
  }
  return state;
};

const msgClient=combineReducers({me,peer,msg,pipes});

const MsgClient=yomoView(({yomo})=>
  yomo.state().me?<MsgPage/>:<LoginPage/>
);

const LoginPage=yomoView(({yomo})=><div>
  <em><a href='#' target='_blank'>
    Open this URL in several browser windows.
  </a></em>
  <br/> <br/>
  Sign in as: &nbsp;
  {peers.map(me=>
    <button key={me} {...loginButton(yomo,me)}>{me}</button>
  )}
</div>);

const MsgPage=yomoView(()=><div>
  <ServerList/><br/>
  <SelectPeer/><hr/>
  <NewMessage/>
  <MsgList i={true}/>
  <MsgList i={false}/>
</div>);

const ServerList=yomoView(({yomo})=><div style={soft}>
  <em>Message servers online:</em>
  {servers.map(srv=><SrvButton key={srv} srv={srv}/>)}
</div>);
const SrvButton=yomoView(({yomo,srv})=>{
  return <button {...srvButton(yomo,srv)}>
    {srvCheck(yomo,srv)? srv:<WaitIcon size='1em'/>}
  </button>;
});
const srvButton=(yomo,srv)=>({
  style:(srv===selectSrv(yomo,servers))?softSelected:soft,
});

const SelectPeer=yomoView(({yomo})=>{
  const {me,peer}=yomo.state();
  return <div>
    You are <b>{me}</b>.  Send messages to: &nbsp;
    {peers.map(next=>
      <button key={next} {...peerButton(yomo,peer,next)}>
        {next}
      </button>
    )}
  </div>;
});

const NewMessage=yomoView(({yomo})=><div>
  <input type='text' {...msgInput(yomo)}/> [Hit enter to send.]
</div>);

const MsgList=yomoView(({yomo,i})=>{
  const me=yomo.state().me;
  return <div>
    <hr/>
    <b>{i? 'Incoming':'Outgoing'} messages:</b>
    <hr/>
    {peers.map(p=><PeerMsgs key={p} peer={p} i={i}/>)}
  </div>
});
const PeerMsgs=yomoView(({yomo,i,peer})=>{
  const me=yomo.state().me;
  const pipeId=i? `${peer}-${me}`:`${me}-${peer}`;
  const {bottom,data}=getPipe(yomo,pipeId);
  const accHandler=(key)=>()=>yomo.dispatch(
    {type:'pipe',acc:key+1,id:pipeId}
  );
  if(data.length===0) { return null; }
  return <div>
    {data.map((msg,j)=><div key={bottom+j}>
      {i && <button onClick={accHandler(bottom+j)}>x</button>}
      <b>{peer}:</b>&nbsp;{msg}<br/>
    </div>)}
    <hr/>
  </div>
});

const bridge=yomoBridge([{linkPipes,connCheck}],{ipcUrl});

const srvCheck=(yomo,srv)=>
  bridge(yomo,{peerId:srv,fname:'connCheck',v0:false});
const selectSrv=cacheFn((yomo,servers)=>{
  for(let srv of servers){ if(srvCheck(yomo,srv)){return srv;} }
  return undefined;
});

const rdMe=cacheFn(yomo=>yomo.state().me);
const xMsgs=cacheFn(yomo=>{
  const me=rdMe(yomo); if(!me) {return;}
  const srv=selectSrv(yomo,servers);
  for(let peer of peers) {
    xchgPipe(yomo,me,peer,srv);
    if(peer!==me) {xchgPipe(yomo,peer,me,srv);}
  };
});
const xchgPipe=(yomo,a,b,srv)=>{
  const pipeId=`${a}-${b}`;
  srv && bridge(yomo,{peerId:srv,fname:'linkPipes',v0:0},
    'pipe',pipeId,'pipe',pipeId
  );
};

const yomo=yomoApp({reducer:msgClient, View:MsgClient});
yomoRun(yomo,false,xMsgs);

