import { ensureFileSync, writeFileSync } from 'fs-extra';
import { join } from 'path';
import { Uri, window, workspace } from 'vscode';

import { Task } from '../../task';
import { Workspace } from '../../workspace';

export async function newTaskCommand(uri: Uri): Promise<void> {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (workspaceFolder) {
        const taskDirectory = workspace.getConfiguration('fiTask').get<string>('taskDirectory');

        if (taskDirectory) {
            const name = await window.showInputBox({
                title: 'New Task Name',
            });

            if (name) {
                const workspaceInstance = Workspace.getInstance(workspaceFolder);
                const selectedPath = workspace.asRelativePath(uri, false);

                const configuration = workspaceInstance.getConfiguration();
                const taskIndex = configuration.taskIndex;
                const taskDetails = configuration.taskDetails;
                const taskMap = configuration.taskMap;

                if (taskMap[selectedPath]) {
                    taskMap[selectedPath].push(taskIndex);
                } else {
                    taskMap[selectedPath] = [taskIndex];
                }

                const saveDirPath = join(workspaceFolder.uri.fsPath, taskDirectory);
                const task = new Task(name, taskIndex, saveDirPath, 'NORMAL');

                taskDetails.push({
                    name: name,
                    type: 'NORMAL',
                    index: taskIndex,
                });
                workspaceInstance.updateConfiguration({
                    taskIndex: taskIndex + 1,
                    taskDetails: taskDetails,
                    taskMap: taskMap,
                });
                workspaceInstance.decorationProvider.decorate(taskMap);

                ensureFileSync(task.uri.fsPath);
                writeFileSync(task.uri.fsPath, `# ${name}`);
                task.open();
            }
        } else {
            // タスクを保存するディレクトリが指定されていないため作成することができません。
            window.showErrorMessage('Cannot create because the directory to save the task is not specified.');
        }
    } else {
        // ワークスペースを開いていないため作成することができません。
        window.showErrorMessage('Cannot create because workspace is not open.');
    }
}
