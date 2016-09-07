const ipcUrl='ws://localhost:8080/';

const peers=['Alice','Bob','Carol'];
const myId ='Srv1';

import {yomoApp,cacheFn} from 'yomo/v1';
import {
  yomoBridge,linkPipes, pipes, yomoRun, connCheck,
  combineReducers,
} from 'yomo/lib/experimental.js';

const bridge=yomoBridge(
  [{linkPipes,connCheck}],
  {ipcUrl,myId}
);
const runBridge=bridge.curry({});

const yomo=yomoApp({reducer: combineReducers({pipes})});
yomoRun(yomo,false,runBridge);
