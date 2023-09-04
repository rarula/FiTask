import { commands, ExtensionContext, Uri, workspace } from 'vscode';

import { deleteAllTasksCommand, newTaskCommand, newTemplateTaskCommand, openTaskCommand } from './commands';
import * as config from './configuration';
import { onDidChangeConfiguration } from './listeners/configurationChangeEvent';
import { Template } from './template';
import { Workspace } from './workspace';

export function activate(context: ExtensionContext): void {
    workspace.workspaceFolders?.forEach((workspaceFolder) => {
        const workspaceInstance = Workspace.getInstance(workspaceFolder);

        workspaceInstance.decorationProvider.decorate(workspaceInstance.getConfiguration().taskMap);
    });

    // register contexts
    commands.executeCommand('setContext', 'fiTask.taskDirectory', [
        config.getTaskDirectory(),
    ]);

    // register events
    workspace.onDidChangeConfiguration((event) => onDidChangeConfiguration(event));

    // register command
    context.subscriptions.push(
        commands.registerCommand('fiTask.newTask', (uri: Uri) => newTaskCommand(uri, 'REGULAR')),
        commands.registerCommand('fiTask.newBugTask', (uri: Uri) => newTaskCommand(uri, 'BUG')),
        commands.registerCommand('fiTask.newRefactoringTask', (uri: Uri) => newTaskCommand(uri, 'REFACTORING')),
        commands.registerCommand('fiTask.newTestingTask', (uri: Uri) => newTaskCommand(uri, 'TESTING')),
        commands.registerCommand('fiTask.newTemplateTask', (uri: Uri) => newTemplateTaskCommand(uri)),
        commands.registerCommand('fiTask.openTask', (uri: Uri) => openTaskCommand(uri)),
        commands.registerCommand('fiTask.deleteAllTasks', (uri: Uri) => deleteAllTasksCommand(uri)),
    );

    // read templates
    Template.readFile('REGULAR', context);
    Template.readFile('BUG', context);
    Template.readFile('REFACTORING', context);
    Template.readFile('TESTING', context);
}

export function deactivate(): void {
}
