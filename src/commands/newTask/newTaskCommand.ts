import { ensureFileSync, writeFileSync } from 'fs-extra';
import { join } from 'path';
import { Uri, window, workspace } from 'vscode';

import * as config from '../../configuration';
import { Task } from '../../task';
import { Template } from '../../template';
import { TemplateTaskType } from '../../types/TaskType';
import { Workspace } from '../../workspace';

export async function newTaskCommand(uri: Uri, taskType: TemplateTaskType): Promise<void> {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (workspaceFolder) {
        const taskDirectory = config.getTaskDirectory();

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
                    writeFileSync(task.uri.fsPath, getFileTemplate(name, taskType));
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

function getInputBoxTitle(taskType: TemplateTaskType): string {
    switch (taskType) {
        case 'REGULAR':
            return 'New Task Name';
        case 'BUG':
            return 'New Bug Task Name';
        case 'REFACTORING':
            return 'New Refactoring Task Name';
        case 'TESTING':
            return 'New Testing Task Name';
    }
}

function getFileTemplate(name: string, taskType: TemplateTaskType): string {
    let template = Template.getTemplate(taskType);

    switch (taskType) {
        case 'REGULAR': {
            const settingsTemplate = config.getCustomTaskTemplate();
            if (settingsTemplate && 1 <= settingsTemplate.length) {
                template = settingsTemplate.join('\n');
            }
            break;
        }
        case 'BUG': {
            const settingsTemplate = config.getCustomBugTaskTemplate();
            if (settingsTemplate && 1 <= settingsTemplate.length) {
                template = settingsTemplate.join('\n');
            }
            break;
        }
        case 'REFACTORING': {
            const settingsTemplate = config.getCustomRefactoringTaskTemplate();
            if (settingsTemplate && 1 <= settingsTemplate.length) {
                template = settingsTemplate.join('\n');
            }
            break;
        }
        case 'TESTING': {
            const settingsTemplate = config.getCustomTestingTaskTemplate();
            if (settingsTemplate && 1 <= settingsTemplate.length) {
                template = settingsTemplate.join('\n');
            }
            break;
        }
    }

    return template.replaceAll('%name%', name);
}
