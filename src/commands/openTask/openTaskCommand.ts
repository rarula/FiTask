import { join } from 'path';
import { QuickPickItem, ThemeIcon, Uri, window, workspace } from 'vscode';

import * as config from '../../configuration';
import { Task } from '../../task';
import { Workspace } from '../../workspace';

export async function openTaskCommand(uri: Uri): Promise<void> {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (workspaceFolder) {
        const configuration = Workspace.getInstance(workspaceFolder).getConfiguration();

        const taskMap = configuration.taskMap;
        const details = configuration.details;

        const selectedPath = workspace.asRelativePath(uri, false);
        const object = taskMap[selectedPath];

        if (object?.assigned.length) {
            const taskDirectory = config.getTaskDirectory();

            if (taskDirectory) {
                const quickPickItems: QuickPickItem[] = [];
                const tasks: Task[] = [];

                const dirPath = join(workspaceFolder.uri.fsPath, taskDirectory);

                for (const index of object.assigned) {
                    const task = Task.getFromIndex(index, dirPath, details.assigned);

                    if (task) {
                        let iconPath: ThemeIcon;

                        switch (task.type) {
                            case 'REGULAR':
                                iconPath = new ThemeIcon('notebook');
                                break;

                            case 'BUG':
                                iconPath = new ThemeIcon('bug');
                                break;

                            case 'REFACTORING':
                                iconPath = new ThemeIcon('heart');
                                break;

                            case 'TESTING':
                                iconPath = new ThemeIcon('microscope');
                                break;

                            case 'TEMPLATE':
                                iconPath = new ThemeIcon('notebook-template');
                                break;
                        }

                        quickPickItems.push({
                            label: task.name,
                            description: '#' + task.index,
                            iconPath: iconPath,
                        });
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
