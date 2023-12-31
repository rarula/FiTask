import { join } from 'path';
import { Range, Uri, window, workspace } from 'vscode';

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
                const configuration = workspaceInstance.getConfiguration();

                const taskIndex = configuration.taskIndex;
                const taskMap = configuration.taskMap;
                const details = configuration.details;

                const dirPath = join(workspaceFolder.uri.fsPath, taskDirectory);
                const task = new Task(name, taskIndex, dirPath, taskType);

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

                let content = getFileTemplate(taskType);
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

function getFileTemplate(taskType: TemplateTaskType): string {
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

    return template;
}
