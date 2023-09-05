import { commands, ExtensionContext, Uri, workspace } from 'vscode';

import { completeTaskCommand, deleteTaskCommand, newTaskCommand, newTemplateTaskCommand, openArchivedTaskCommand, openAssignedTaskCommand } from './commands';
import { Template } from './template';
import { Workspace } from './workspace';

export function activate(context: ExtensionContext): void {
    workspace.workspaceFolders?.forEach((workspaceFolder) => {
        const workspaceInstance = Workspace.getInstance(workspaceFolder);

        workspaceInstance.decorationProvider.decorate(workspaceInstance.getConfiguration().taskMap);
    });

    // register command
    context.subscriptions.push(
        commands.registerCommand('fiTask.newTask', (uri: Uri) => newTaskCommand(uri, 'REGULAR')),
        commands.registerCommand('fiTask.newBugTask', (uri: Uri) => newTaskCommand(uri, 'BUG')),
        commands.registerCommand('fiTask.newRefactoringTask', (uri: Uri) => newTaskCommand(uri, 'REFACTORING')),
        commands.registerCommand('fiTask.newTestingTask', (uri: Uri) => newTaskCommand(uri, 'TESTING')),
        commands.registerCommand('fiTask.newTemplateTask', (uri: Uri) => newTemplateTaskCommand(uri)),
        commands.registerCommand('fiTask.openAssignedTask', (uri: Uri) => openAssignedTaskCommand(uri)),
        commands.registerCommand('fiTask.openArchivedTask', (uri: Uri) => openArchivedTaskCommand(uri)),
        commands.registerCommand('fiTask.completeTask', (uri: Uri) => completeTaskCommand(uri)),
        commands.registerCommand('fiTask.deleteTask', (uri: Uri) => deleteTaskCommand(uri)),
    );

    // read templates
    Template.readFile('REGULAR', context);
    Template.readFile('BUG', context);
    Template.readFile('REFACTORING', context);
    Template.readFile('TESTING', context);
}

export function deactivate(): void {
}
