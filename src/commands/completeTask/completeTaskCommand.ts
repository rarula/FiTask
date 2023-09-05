import { join } from 'path';
import { Uri, window, workspace } from 'vscode';

import * as config from '../../configuration';
import { Task } from '../../task';
import { Workspace } from '../../workspace';

export async function completeTaskCommand(uri: Uri): Promise<void> {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (workspaceFolder) {
        const taskDirectory = config.getTaskDirectory();

        if (taskDirectory) {
            const archivedTaskDirectory = config.getArchivedTaskDirectory();

            if (archivedTaskDirectory) {
                const workspaceInstance = Workspace.getInstance(workspaceFolder);
                const configuration = workspaceInstance.getConfiguration();

                const taskDetails = configuration.taskDetails;
                const archivedTaskDetails = configuration.archivedTaskDetails;
                const taskMap = configuration.taskMap;

                const saveDirPath = join(workspaceFolder.uri.fsPath, taskDirectory);
                const task = Task.getFromPath(uri.fsPath, saveDirPath, taskDetails);

                if (task) {
                    for (const key in taskMap) {
                        if (taskMap[key].assigned.includes(task.index)) {
                            taskMap[key].assigned = taskMap[key].assigned.filter((index) => task.index !== index);
                            taskMap[key].archived.push(task.index);

                            const content = task.readFile();
                            task.removeFile();
                            task.close();

                            const archiveDirPath = join(workspaceFolder.uri.fsPath, archivedTaskDirectory);
                            const archivedTask = new Task(task.name, task.index, archiveDirPath, task.type);

                            const fixedTaskDetails = taskDetails.filter((taskDetail) => task.index !== taskDetail.index);
                            archivedTaskDetails.push(...taskDetails.filter((taskDetail) => task.index === taskDetail.index));

                            archivedTask.createFile(content);

                            workspaceInstance.updateTaskDetails(fixedTaskDetails);
                            workspaceInstance.updateArchivedTaskDetails(archivedTaskDetails);
                            workspaceInstance.updateTaskMap(taskMap);
                            workspaceInstance.decorationProvider.decorate(taskMap);
                        }
                    }
                } else {
                    // このファイルはタスクではありません。
                    window.showErrorMessage('This file is not a task.');
                }
            } else {
                // アーカイブとしてタスクを保存するディレクトリが指定されていないため完了することができません。
                window.showErrorMessage('Cannot complete because the directory to save the task as an archive is not specified.');
            }
        } else {
            // タスクを保存するディレクトリが指定されていないため完了することができません。
            window.showErrorMessage('Cannot complete because the directory to save the task is not specified.');
        }
    } else {
        // ワークスペースを開いていないため完了することができません。
        window.showErrorMessage('Cannot complete because workspace is not open.');
    }
}
