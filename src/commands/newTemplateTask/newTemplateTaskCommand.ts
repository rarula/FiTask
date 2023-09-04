import { join } from 'path';
import { QuickPickItem, ThemeIcon, Uri, window, workspace } from 'vscode';

import * as config from '../../configuration';
import { Task } from '../../task';
import { Workspace } from '../../workspace';

export async function newTemplateTaskCommand(uri: Uri): Promise<void> {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (workspaceFolder) {
        const taskDirectory = config.getTaskDirectory();

        if (taskDirectory) {
            const customTaskTemplates = config.getCustomTaskTemplates();

            if (customTaskTemplates && 1 <= customTaskTemplates.length) {
                const quickPickItems: QuickPickItem[] = [];

                customTaskTemplates.forEach((customTaskTemplate) => {
                    quickPickItems.push({
                        label: customTaskTemplate.title,
                        iconPath: new ThemeIcon('notebook-template'),
                    });
                });

                const quickPickItem = await window.showQuickPick(quickPickItems);

                if (quickPickItem) {
                    for (const customTaskTemplate of customTaskTemplates) {
                        if (quickPickItem.label !== customTaskTemplate.title) {
                            continue;
                        }

                        const name = await window.showInputBox({
                            title: 'New Template Task Name',
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
                            const task = new Task(name, taskIndex, saveDirPath, 'TEMPLATE');

                            taskDetails.push({
                                name: name,
                                type: 'TEMPLATE',
                                index: taskIndex,
                            });
                            workspaceInstance.updateConfiguration({
                                taskIndex: taskIndex + 1,
                                taskDetails: taskDetails,
                                taskMap: taskMap,
                            });
                            workspaceInstance.decorationProvider.decorate(taskMap);

                            let template = customTaskTemplate.template.join('\n');
                            template = template.replaceAll('%name%', name);

                            task.createFile(template);
                            task.open();
                        }

                        break;
                    }
                }
            } else {
                // タスクのテンプレートが設定されていないため作成することができません。
                window.showErrorMessage('Cannot create because the task template is not specified.');
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
