const ipcUrl='ws://localhost:8080/';

const peers   = ['Alice','Bob','Carol'];
const servers = ['Srv1','Srv2','Srv3'];
const myId    = process.argv[2] || 'Srv1';

import {yomoApp,cacheFn} from 'yomo/v1';
import {
  yomoBridge,linkPipes, pipes, yomoRun, connCheck,
  combineReducers,
} from 'yomo/lib/experimental.js';

// Crash the server for testing.
// Don't do this in production!
const boot=cacheFn((yomo)=>process.exit(0));

const bridge=yomoBridge(
  [{linkPipes,connCheck,boot}],
  {ipcUrl,myId}
);
const runBridge=bridge.curry({});

const xMsgs=cacheFn(yomo=>{
  for(let srv of servers) { if(srv<myId) {
    for(let a of peers) { for(let b of peers) {
      xchgPipe(yomo,a,b,srv);
    }}
  }}
});
const xchgPipe=(yomo,a,b,srv)=>{
  const pipeId=`${a}-${b}`;
  srv && bridge(yomo,{peerId:srv,fname:'linkPipes',v0:0},
    'pipe',pipeId,'pipe',pipeId
  );
};

const yomo=yomoApp({reducer: combineReducers({pipes})});
yomoRun(yomo,false,runBridge);
yomoRun(yomo,false,xMsgs);
console.log(`${myId}: running.`);
