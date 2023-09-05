import { join } from 'path';
import { Uri, window, workspace } from 'vscode';

import * as config from '../../configuration';
import { Task } from '../../task';
import { Workspace } from '../../workspace';

export async function deleteTaskCommand(uri: Uri): Promise<void> {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (workspaceFolder) {
        const taskDirectory = config.getTaskDirectory();

        if (taskDirectory) {
            const workspaceInstance = Workspace.getInstance(workspaceFolder);
            const taskDetails = workspaceInstance.getConfiguration().taskDetails;
            const taskMap = workspaceInstance.getConfiguration().taskMap;

            const dirPath = join(workspaceFolder.uri.fsPath, taskDirectory);
            const task = Task.getFromPath(uri.fsPath, dirPath, taskDetails);

            if (task) {
                for (const key in taskMap) {
                    if (taskMap[key].assigned.includes(task.index)) {
                        taskMap[key].assigned = taskMap[key].assigned.filter((index) => task.index !== index);
                        if (!taskMap[key].assigned.length && !taskMap[key].archived.length) {
                            delete taskMap[key];
                        }

                        const fixedTaskDetails = taskDetails.filter((taskDetail) => task.index !== taskDetail.index);

                        task.removeFile();
                        task.close();

                        workspaceInstance.updateTaskDetails(fixedTaskDetails);
                        workspaceInstance.updateTaskMap(taskMap);
                        workspaceInstance.decorationProvider.decorate(taskMap);
                    }
                }
            } else {
                // このファイルはタスクではありません。
                window.showErrorMessage('This file is not a task.');
            }
        } else {
            // タスクを保存するディレクトリが指定されていないため削除することができません。
            window.showErrorMessage('Cannot delete because the directory to save the task is not specified.');
        }
    } else {
        // ワークスペースを開いていないため削除することができません。
        window.showErrorMessage('Cannot delete because workspace is not open.');
    }
}
