"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const os_1 = require("os");
let cpuCount = os_1.cpus().length;
if (process.env.CI || process.env.TRAVIS) {
    cpuCount = 2;
}
let activeTasks = new Set();
function runTaskInBackground(modulePath, params) {
    let task = child_process_1.fork(__filename);
    let processId = task.pid;
    activeTasks.add(task);
    task.send({
        modulePath: modulePath,
        params: params
    });
    return new Promise((ok, reject) => {
        task.on('error', error => {
            reject(error);
        });
        task.on('message', (feedback) => {
            if (feedback.errorStack) {
                let error = new Error(`An unhandled exception has occurred in child process PID #${processId}:\n${feedback.errorStack}`);
                reject(error);
            }
            else {
                ok(feedback.result);
            }
            activeTasks.delete(task);
        });
    });
}
exports.runTaskInBackground = runTaskInBackground;
function runTaskInBackgroundOnPowerfulSystem(modulePath, params) {
    if (cpuCount > 4) {
        return runTaskInBackground(modulePath, params);
    }
    else {
        let taskModule = require(modulePath);
        return taskModule(params);
    }
}
exports.runTaskInBackgroundOnPowerfulSystem = runTaskInBackgroundOnPowerfulSystem;
function killAllBackgroundTasks() {
    for (let task of activeTasks) {
        task.kill();
    }
    activeTasks.clear();
}
exports.killAllBackgroundTasks = killAllBackgroundTasks;
process.on('message', (data) => __awaiter(this, void 0, void 0, function* () {
    let valid = process.send && data && data.modulePath && data.params;
    if (!valid) {
        return;
    }
    try {
        let modulePath = data.modulePath;
        let params = data.params;
        let taskModule = require(modulePath);
        let result = yield taskModule(params);
        process.send({
            errorStack: null,
            result: result
        });
    }
    catch (error) {
        process.send({
            errorStack: error.stack,
            result: null
        });
    }
    finally {
        process.exit();
    }
}));
