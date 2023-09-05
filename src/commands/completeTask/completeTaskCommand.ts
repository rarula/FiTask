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

                const taskMap = configuration.taskMap;
                const details = configuration.details;

                const dirPath = join(workspaceFolder.uri.fsPath, taskDirectory);
                const task = Task.getFromPath(uri.fsPath, dirPath, details.assigned);

                if (task) {
                    for (const key in taskMap) {
                        const object = taskMap[key];

                        if (object.assigned.includes(task.index)) {
                            // archivedにindexを追加
                            taskMap[key].archived.push(task.index);
                            details.archived.push(...details.assigned.filter((taskDetail) => task.index === taskDetail.index));

                            // assignedからindexを取り除く
                            taskMap[key].assigned = object.assigned.filter((index) => task.index !== index);
                            details.assigned = details.assigned.filter((taskDetail) => task.index !== taskDetail.index);

                            const archiveDirPath = join(workspaceFolder.uri.fsPath, archivedTaskDirectory);
                            const archivedTask = new Task(task.name, task.index, archiveDirPath, task.type);

                            const content = task.readFile();
                            task.removeFile();
                            task.close();
                            archivedTask.createFile(content);

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
