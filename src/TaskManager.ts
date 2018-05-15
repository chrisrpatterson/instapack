import { fork, ChildProcess } from 'child_process';
import { cpus } from 'os';

let cpuCount = cpus().length;
if (process.env.CI || process.env.TRAVIS) {
    cpuCount = 2;
}

/**
 * Contains objects returned from child process.
 * On successful execution, result will contain returned values from background task and error will be nulled. 
 * If an unhandled error occurred, errorStack will contain stack trace in the child process and result will be nulled.
 */
interface IBackgroundTaskFeedback<T> {
    errorStack: string;
    result: T;
}

/**
 * A task module should return an asynchronous function.
 */
declare type TaskModuleFunction = (input: any) => Promise<any>;

let activeTasks: Set<ChildProcess> = new Set<ChildProcess>();

/**
 * Accepts async function module path to be executed in child process and input parameter for that function.
 * Returns a Promise which resolves to the result of that function.
 * @param modulePath 
 * @param params 
 */
export function runTaskInBackground<T>(modulePath: string, params): Promise<T> {
    let task = fork(__filename);

    let processId = task.pid;
    activeTasks.add(task);
    task.send({
        modulePath: modulePath,
        params: params
    });

    return new Promise<T>((ok, reject) => {
        task.on('error', error => {
            reject(error);
        });
        task.on('message', (feedback: IBackgroundTaskFeedback<T>) => {
            // console.log(processId + ' FINISHED');
            if (feedback.errorStack) {
                let error = new Error(`An unhandled exception has occurred in child process PID #${processId}:\n${feedback.errorStack}`)
                reject(error)
            } else {
                ok(feedback.result);
            }
            activeTasks.delete(task);
        });
    });
}

/**
 * Accepts async function module path to be executed and input parameter for that function.
 * Executes the async function in child process if the system is powerful enough (and not CI).
 * @param modulePath 
 * @param params 
 */
export function runTaskInBackgroundOnPowerfulSystem<T>(modulePath: string, params): Promise<T> {
    if (cpuCount > 4) {
        return runTaskInBackground<T>(modulePath, params);
    } else {
        let taskModule = require(modulePath) as TaskModuleFunction;
        return taskModule(params);
    }
}

/**
 * Destroy all currently running background tasks.
 */
export function killAllBackgroundTasks() {
    for (let task of activeTasks) {
        task.kill();
    }
    activeTasks.clear();
}

process.on('message', async (data) => {
    let valid = process.send && data && data.modulePath && data.params;
    if (!valid) {
        return;
    }

    // console.log(process.pid + ' ' + modulePath);
    try {
        let modulePath: string = data.modulePath;
        let params: any = data.params;

        let taskModule = require(modulePath) as TaskModuleFunction;
        let result = await taskModule(params);
        process.send({
            errorStack: null,
            result: result
        } as IBackgroundTaskFeedback<any>);
    } catch (error) {
        process.send({
            errorStack: (error as Error).stack,
            result: null
        } as IBackgroundTaskFeedback<any>);
    } finally {
        process.exit();
    }
});
