import { commands, ConfigurationChangeEvent } from 'vscode';

import * as config from '../configuration';

export function onDidChangeConfiguration(event: ConfigurationChangeEvent): void {
    // TODO: configのセクションを直に記入するのをやめて何処かからstringを受け取る形にする
    const changed = event.affectsConfiguration('fiTask.taskDirectory');

    if (changed) {
        commands.executeCommand('setContext', 'fiTask.taskDirectory', [
            config.getTaskDirectory(),
        ]);
    }
}
