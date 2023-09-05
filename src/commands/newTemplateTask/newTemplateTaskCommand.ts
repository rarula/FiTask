import { join } from 'path';
import { QuickPickItem, Range, ThemeIcon, Uri, window, workspace } from 'vscode';

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
                            const configuration = workspaceInstance.getConfiguration();

                            const taskIndex = configuration.taskIndex;
                            const taskMap = configuration.taskMap;
                            const details = configuration.details;

                            const dirPath = join(workspaceFolder.uri.fsPath, taskDirectory);
                            const task = new Task(name, taskIndex, dirPath, 'TEMPLATE');

                            const selectedPath = workspace.asRelativePath(uri, false);

                            if (taskMap[selectedPath]) {
                                taskMap[selectedPath]?.assigned.push(task.index);
                            } else {
                                taskMap[selectedPath] = {
                                    assigned: [task.index],
                                    archived: [],
                                };
                            }

                            details.assigned.push({
                                name: task.name,
                                type: task.type,
                                index: task.index,
                            });
                            workspaceInstance.updateConfiguration({
                                taskIndex: taskIndex + 1,
                                taskMap: taskMap,
                                details: {
                                    assigned: details.assigned,
                                    archived: details.archived,
                                },
                            });
                            workspaceInstance.decorationProvider.decorate(taskMap);

                            let content = customTaskTemplate.template.join('\n');
                            let range: Range | undefined;

                            content.split('\n').forEach((line, index) => {
                                const char = line.search(/{cursor}/i);
                                if (char !== -1) {
                                    range = new Range(index, char, index, char);
                                }
                            });
                            content = content.replaceAll('{name}', task.name);
                            content = content.replaceAll('{cursor}', '');

                            task.createFile(content);
                            task.open(range);
                        }

                        break;
                    }
                }
            } else {
                // タスクのテンプレートが設定されていないため作成することができません。
                window.showInformationMessage('Cannot create because the task template is not specified.');
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
