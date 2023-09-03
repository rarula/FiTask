import { commands, ConfigurationChangeEvent, workspace } from 'vscode';

export function onDidChangeConfiguration(event: ConfigurationChangeEvent): void {
    const changed = event.affectsConfiguration('fiTask.taskDirectory');
    if (changed) {
        commands.executeCommand('setContext', 'fiTask.taskDirectory', [
            workspace.getConfiguration('fiTask').get<string>('taskDirectory'),
        ]);
    }
}
