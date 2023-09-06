import { existsSync } from 'fs-extra';
import { FileRenameEvent, workspace } from 'vscode';

import { Workspace } from '../workspace';

export function onDidFileRename(event: FileRenameEvent, workspaceInstance: Workspace): void {
    if (existsSync(workspaceInstance.configFilePath)) {
        const taskMap = workspaceInstance.getConfiguration().taskMap;

        let modified = false;

        event.files.forEach((file) => {
            const oldRelativePath = workspace.asRelativePath(file.oldUri, false);
            const newRelativePath = workspace.asRelativePath(file.newUri, false);

            for (const key in taskMap) {
                if (key.startsWith(oldRelativePath)) {
                    const fixedKey = key.replace(oldRelativePath, newRelativePath);

                    taskMap[fixedKey] = taskMap[key];
                    delete taskMap[key];

                    modified = true;
                }
            }
        });

        if (modified) {
            workspaceInstance.updateTaskMap(taskMap);
            workspaceInstance.decorationProvider.decorate(taskMap);
        }
    }
}
