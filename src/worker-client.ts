import { BuildContext, WorkerProcess, WorkerMessage } from './util/interfaces';
import { BuildError, Logger } from './util/logger';
import { fork, ChildProcess } from 'child_process';
import { join } from 'path';


export function runWorker(task: string, context: BuildContext, workerConfig: any) {
  return new Promise((resolve, reject) => {
    const worker = <ChildProcess>createWorker(task);
    const msg: WorkerMessage = { task, context, workerConfig };

    worker.on('message', (msg: WorkerMessage) => {
      if (msg.error) {
        throw new BuildError(msg.error);
      } else if (msg.reject) {
        reject(new BuildError(msg.reject));
      } else {
        resolve(msg.resolve);
      }

      killWorker(msg.pid);
    });

    worker.on('error', (err: any) => {
      Logger.error(`worker error, task: ${task}, pid: ${worker.pid}, error: ${err}`);
    });

    worker.on('exit', (code: number) => {
      Logger.debug(`worker exited, task: ${task}, pid: ${worker.pid}`);
    });

    worker.send(msg);
  });
}


function killWorker(pid: number) {
  for (var i = workers.length - 1; i >= 0; i--) {
    if (workers[i].worker.pid === pid) {
      try {
        workers[i].worker.kill('SIGKILL');
      } catch (e) {
        Logger.error(`killWorker, ${pid}: ${e}`);
      } finally {
        delete workers[i].worker;
        workers.splice(i, 1);
      }
    }
  }
}


export function createWorker(task: string): any {
  for (var i = workers.length - 1; i >= 0; i--) {
    if (workers[i].task === task) {
      try {
        workers[i].worker.kill('SIGKILL');
      } catch (e) {
        Logger.debug(`createWorker, ${task} kill('SIGKILL'): ${e}`);
      } finally {
        delete workers[i].worker;
        workers.splice(i, 1);
      }
    }
  }

  try {
    const workerModule = join(__dirname, 'worker-process.js');
    const worker = fork(workerModule);

    Logger.debug(`worker created, task: ${task}, pid: ${worker.pid}`);

    workers.push({
      task: task,
      worker: worker
    });

    return worker;

  } catch (e) {
    throw new BuildError(`unable to create worker-process, task: ${task}: ${e}`);
  }
}


export const workers: WorkerProcess[] = [];
