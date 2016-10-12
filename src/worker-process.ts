import { BuildError, Logger } from './util/logger';
import { WorkerMessage } from './util/interfaces';


process.on('message', (msg: WorkerMessage) => {
  try {
    const modulePath = `./${msg.task}`;
    const taskWorkerName = `${msg.task}Worker`;
    const taskWorker = require(modulePath)[taskWorkerName];

    taskWorker(msg.context, msg.workerConfig)
      .then(
        (val: any) => {
          taskResolve(msg.task, val);
        },
        (val: any) => {
          taskReject(msg.task, val);
        }
      )
      .catch((err: any) => {
        taskError(msg.task, err);
      });

  } catch (e) {
    taskError(msg.task, e);
    process.exit(1);
  }
});


function taskResolve(task: string, val: any) {
  const msg: WorkerMessage = {
    task: task,
    resolve: val,
    pid: process.pid
  };

  Logger.debug(`worker resolve, task: ${msg.task}, pid: ${msg.pid}`);

  process.send(msg);
}


function taskReject(task: string, val: any) {
  const msg: WorkerMessage = {
    task: task,
    reject: new BuildError(val).toJson(),
    pid: process.pid
  };

  Logger.debug(`worker reject, task: ${msg.task}, pid: ${msg.pid}`);

  process.send(msg);
}


function taskError(task: string, err: any) {
  const msg: WorkerMessage = {
    task: task,
    error: new BuildError(err).toJson(),
    pid: process.pid
  };

  Logger.debug(`worker error, task: ${msg.task}, pid: ${msg.pid}`);

  process.send(msg);
}
