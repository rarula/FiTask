import { join } from 'path';
import { QuickPickItem, ThemeIcon, Uri, window, workspace } from 'vscode';

import * as config from '../../configuration';
import { Task } from '../../task';
import { Workspace } from '../../workspace';

export async function openTaskCommand(uri: Uri): Promise<void> {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (workspaceFolder) {
        const selectedPath = workspace.asRelativePath(uri, false);
        const configuration = Workspace.getInstance(workspaceFolder).getConfiguration();

        const taskDetails = configuration.taskDetails;
        const taskMap = configuration.taskMap;

        if (taskMap[selectedPath]) {
            const taskDirectory = config.getTaskDirectory();

            if (taskDirectory) {
                const saveDirPath = join(workspaceFolder.uri.fsPath, taskDirectory);
                const quickPickItems: QuickPickItem[] = [];
                const tasks: Task[] = [];

                for (const index of taskMap[selectedPath]) {
                    const task = Task.getFromIndex(index, saveDirPath, taskDetails);

                    if (task) {
                        switch (task.type) {
                            case 'REGULAR':
                                quickPickItems.push({
                                    label: task.name,
                                    description: '#' + task.index,
                                    iconPath: new ThemeIcon('notebook'),
                                });
                                break;

                            case 'BUG':
                                quickPickItems.push({
                                    label: task.name,
                                    description: '#' + task.index,
                                    iconPath: new ThemeIcon('bug'),
                                });
                                break;

                            case 'REFACTORING':
                                quickPickItems.push({
                                    label: task.name,
                                    description: '#' + task.index,
                                    iconPath: new ThemeIcon('heart'),
                                });
                                break;

                            case 'TESTING':
                                quickPickItems.push({
                                    label: task.name,
                                    description: '#' + task.index,
                                    iconPath: new ThemeIcon('microscope'),
                                });
                                break;

                            case 'TEMPLATE':
                                quickPickItems.push({
                                    label: task.name,
                                    description: '#' + task.index,
                                    iconPath: new ThemeIcon('notebook-template'),
                                });
                                break;
                        }
                        tasks.push(task);
                    }
                }

                const quickPick = await window.showQuickPick(quickPickItems);

                if (quickPick) {
                    for (const task of tasks) {
                        if (quickPick.description === '#' + task.index) {
                            task.openPreview();
                            return;
                        }
                    }
                }
            } else {
                // タスクを保存するディレクトリが指定されていないため開くことができません。
                window.showErrorMessage('Cannot open because the directory to save the task is not specified.');
            }
        } else {
            // タスクが割り当てられていません。
            window.showInformationMessage('No task assigned.');
        }
    } else {
        // ワークスペースを開いていないため開くことができません。
        window.showErrorMessage('Cannot open because workspace is not open.');
    }
}
