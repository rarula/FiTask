import { commands, ExtensionContext, Uri, workspace } from 'vscode';

import { deleteAllTasksCommand, newTaskCommand, newTemplateTaskCommand, openTaskCommand } from './commands';
import { onDidChangeConfiguration } from './listeners/configurationChangeEvent';
import { Workspace } from './workspace';

export function activate(context: ExtensionContext): void {
    workspace.workspaceFolders?.forEach((workspaceFolder) => {
        const workspaceInstance = Workspace.getInstance(workspaceFolder);

        workspaceInstance.decorationProvider.decorate(workspaceInstance.getConfiguration().taskMap);
    });

    // register contexts
    commands.executeCommand('setContext', 'fiTask.taskDirectory', [
        workspace.getConfiguration('fiTask').get<string>('taskDirectory'),
    ]);

    // register events
    workspace.onDidChangeConfiguration((event) => onDidChangeConfiguration(event));

    // register command
    context.subscriptions.push(
        commands.registerCommand('fiTask.newTask', (uri: Uri) => newTaskCommand(uri, context, 'REGULAR')),
        commands.registerCommand('fiTask.newBugTask', (uri: Uri) => newTaskCommand(uri, context, 'BUG')),
        commands.registerCommand('fiTask.newRefactoringTask', (uri: Uri) => newTaskCommand(uri, context, 'REFACTORING')),
        commands.registerCommand('fiTask.newTestingTask', (uri: Uri) => newTaskCommand(uri, context, 'TESTING')),
        commands.registerCommand('fiTask.newTemplateTask', (uri: Uri) => newTemplateTaskCommand(uri)),
        commands.registerCommand('fiTask.openTask', (uri: Uri) => openTaskCommand(uri)),
        commands.registerCommand('fiTask.deleteAllTasks', (uri: Uri) => deleteAllTasksCommand(uri)),
    );
}

export function deactivate(): void {
}
