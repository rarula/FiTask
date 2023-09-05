import { removeSync } from 'fs-extra';
import { join } from 'path';
import { Uri, window, workspace } from 'vscode';

import * as config from '../../configuration';
import { Workspace } from '../../workspace';

export function deleteAllTasksCommand(uri: Uri): void {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (workspaceFolder) {
        const taskDirectory = config.getTaskDirectory();

        if (taskDirectory) {
            const workspaceInstance = Workspace.getInstance(workspaceFolder);
            const saveDirPath = join(workspaceFolder.uri.fsPath, taskDirectory);
            removeSync(saveDirPath);

            workspaceInstance.updateConfiguration({
                taskIndex: 1,
                taskDetails: [],
                archivedTaskDetails: [],
                taskMap: {},
            });
            workspaceInstance.decorationProvider.decorate({});
        } else {
            // タスクを保存するディレクトリが指定されていないため削除することができません。
            window.showErrorMessage('Cannot delete because the directory to save the task is not specified.');
        }
    } else {
        // ワークスペースを開いていないため削除することができません。
        window.showErrorMessage('Cannot delete because workspace is not open.');
    }
}
