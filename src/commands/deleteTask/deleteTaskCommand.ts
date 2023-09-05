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
            const configuration = workspaceInstance.getConfiguration();

            const taskMap = configuration.taskMap;
            const details = configuration.details;

            const dirPath = join(workspaceFolder.uri.fsPath, taskDirectory);
            const task = Task.getFromPath(uri.fsPath, dirPath, details.assigned);

            if (task) {
                for (const key in taskMap) {
                    const object = taskMap[key];

                    if (object?.assigned.includes(task.index)) {
                        // assignedからindexを取り除く
                        object.assigned = object.assigned.filter((index) => task.index !== index);
                        details.assigned = details.assigned.filter((taskDetail) => task.index !== taskDetail.index);

                        // assignedもarchivedも無い場合はオブジェクトごと取り除く
                        if (!object.assigned.length && !object.archived.length) {
                            delete taskMap[key];
                        }

                        task.removeFile();
                        task.close();

                        workspaceInstance.updateTaskMap(taskMap);
                        workspaceInstance.updateDetails(details);
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
