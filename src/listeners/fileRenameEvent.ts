import { FileRenameEvent, workspace } from 'vscode';

import { Workspace } from '../workspace';

export function onDidFileRename(event: FileRenameEvent, workspaceInstance: Workspace): void {
    event.files.forEach((file) => {
        const oldRelativePath = workspace.asRelativePath(file.oldUri, false);
        const newRelativePath = workspace.asRelativePath(file.newUri, false);

        const configuration = workspaceInstance.getConfiguration();
        const taskIndex = configuration.taskIndex;
        const taskDetails = configuration.taskDetails;
        const taskMap = configuration.taskMap;

        for (const key in taskMap) {
            if (key.startsWith(oldRelativePath)) {
                const fixedKey = key.replace(oldRelativePath, newRelativePath);

                taskMap[fixedKey] = taskMap[key];
                delete taskMap[key];
            }
        }

        workspaceInstance.updateConfiguration({
            taskIndex: taskIndex,
            taskDetails: taskDetails,
            taskMap: taskMap,
        });
        workspaceInstance.decorationProvider.decorate(taskMap);
    });
}
