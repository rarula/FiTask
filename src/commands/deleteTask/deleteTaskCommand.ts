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
            const archivedTaskDirectory = config.getArchivedTaskDirectory();

            if (archivedTaskDirectory) {
                const workspaceInstance = Workspace.getInstance(workspaceFolder);
                const configuration = workspaceInstance.getConfiguration();

                const taskMap = configuration.taskMap;
                const details = configuration.details;

                const assignedDirPath = join(workspaceFolder.uri.fsPath, taskDirectory);
                const assignedTask = Task.getFromPath(uri.fsPath, taskDirectory, assignedDirPath, details.assigned);

                const archivedDirPath = join(workspaceFolder.uri.fsPath, archivedTaskDirectory);
                const archivedTask = Task.getFromPath(uri.fsPath, archivedTaskDirectory, archivedDirPath, details.archived);

                if (assignedTask) {
                    for (const key in taskMap) {
                        const object = taskMap[key];

                        if (object?.assigned.includes(assignedTask.index)) {
                            // assignedからindexを取り除く
                            object.assigned = object.assigned.filter((index) => assignedTask.index !== index);
                            details.assigned = details.assigned.filter((taskDetail) => assignedTask.index !== taskDetail.index);

                            // assignedもarchivedも無い場合はオブジェクトごと取り除く
                            if (!object.assigned.length && !object.archived.length) {
                                delete taskMap[key];
                            }

                            assignedTask.removeFile();
                            assignedTask.close();

                            workspaceInstance.updateTaskMap(taskMap);
                            workspaceInstance.updateDetails(details);
                            workspaceInstance.decorationProvider.decorate(taskMap);
                        }
                    }
                } else if (archivedTask) {
                    for (const key in taskMap) {
                        const object = taskMap[key];

                        if (object?.archived.includes(archivedTask.index)) {
                            // archivedからindexを取り除く
                            object.archived = object.archived.filter((index) => archivedTask.index !== index);
                            details.archived = details.archived.filter((taskDetail) => archivedTask.index !== taskDetail.index);

                            // assignedもarchivedも無い場合はオブジェクトごと取り除く
                            if (!object.assigned.length && !object.archived.length) {
                                delete taskMap[key];
                            }

                            archivedTask.removeFile();
                            archivedTask.close();

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
                // アーカイブとしてタスクを保存するディレクトリが指定されていないため削除することができません。
                window.showErrorMessage('Cannot delete because the directory to save the task as an archive is not specified.');
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
