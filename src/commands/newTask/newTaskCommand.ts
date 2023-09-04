import { ensureFileSync, readFileSync, writeFileSync } from 'fs-extra';
import { join } from 'path';
import { ExtensionContext, Uri, window, workspace } from 'vscode';

import { Task } from '../../task';
import { TaskType } from '../../types/TaskType';
import { Workspace } from '../../workspace';

export async function newTaskCommand(uri: Uri, context: ExtensionContext, taskType: TaskType): Promise<void> {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (workspaceFolder) {
        const taskDirectory = workspace.getConfiguration('fiTask').get<string>('taskDirectory');

        if (taskDirectory) {
            const name = await window.showInputBox({
                title: getInputBoxTitle(taskType),
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
                const task = new Task(name, taskIndex, saveDirPath, taskType);

                taskDetails.push({
                    name: name,
                    type: taskType,
                    index: taskIndex,
                });
                workspaceInstance.updateConfiguration({
                    taskIndex: taskIndex + 1,
                    taskDetails: taskDetails,
                    taskMap: taskMap,
                });
                workspaceInstance.decorationProvider.decorate(taskMap);

                try {
                    ensureFileSync(task.uri.fsPath);
                    writeFileSync(task.uri.fsPath, getFileTemplate(name, taskType, context));
                    task.open();
                } catch (error) {
                    console.error(error);
                }
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

function getInputBoxTitle(taskType: TaskType): string {
    switch (taskType) {
        case 'BUG':
            return 'New Bug Task Name';
        case 'REFACTORING':
            return 'New Refactoring Task Name';
        case 'TESTING':
            return 'New Testing Task Name';
        default:
            return 'New Task Name';
    }
}

function getFileTemplate(name: string, taskType: TaskType, context: ExtensionContext): string {
    let template = '';

    try {
        switch (taskType) {
            case 'BUG': {
                const settingsTemplate = workspace.getConfiguration('fiTask').get<string[]>('customBugTaskTemplate');

                if (settingsTemplate && 1 <= settingsTemplate.length) {
                    template = settingsTemplate.join('\n');
                } else {
                    template = readFileSync(context.asAbsolutePath('templates/bug.md'), 'utf-8');
                }

                break;
            }
            case 'REFACTORING': {
                const settingsTemplate = workspace.getConfiguration('fiTask').get<string[]>('customRefactoringTaskTemplate');

                if (settingsTemplate && 1 <= settingsTemplate.length) {
                    template = settingsTemplate.join('\n');
                } else {
                    template = readFileSync(context.asAbsolutePath('templates/refactoring.md'), 'utf-8');
                }

                break;
            }
            case 'TESTING': {
                const settingsTemplate = workspace.getConfiguration('fiTask').get<string[]>('customTestingTaskTemplate');

                if (settingsTemplate && 1 <= settingsTemplate.length) {
                    template = settingsTemplate.join('\n');
                } else {
                    template = readFileSync(context.asAbsolutePath('templates/testing.md'), 'utf-8');
                }

                break;
            }
            default: {
                const settingsTemplate = workspace.getConfiguration('fiTask').get<string[]>('customTaskTemplate');

                if (settingsTemplate && 1 <= settingsTemplate.length) {
                    template = settingsTemplate.join('\n');
                } else {
                    template = readFileSync(context.asAbsolutePath('templates/regular.md'), 'utf-8');
                }

                break;
            }
        }
    } catch (error) {
        console.error(error);
    }

    return template.replace('%name%', name);
}
