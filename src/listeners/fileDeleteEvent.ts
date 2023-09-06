import { existsSync } from 'fs-extra';
import { join } from 'path';
import { FileDeleteEvent, workspace } from 'vscode';

import { getArchivedTaskDirectory, getTaskDirectory } from '../configuration';
import { Task } from '../task';
import { Workspace } from '../workspace';

export function onDidFileDelete(event: FileDeleteEvent, workspaceInstance: Workspace): void {
    if (existsSync(workspaceInstance.configFilePath)) {
        const configuration = workspaceInstance.getConfiguration();
        const taskMap = configuration.taskMap;
        const details = configuration.details;

        const deletedAssignedTasks: number[] = [];
        const deletedArchivedTasks: number[] = [];
        let modified = false;

        event.files.forEach((uri) => {
            const relativePath = workspace.asRelativePath(uri);

            for (const key in taskMap) {
                const object = taskMap[key];

                if (object && key.startsWith(relativePath)) {
                    deletedAssignedTasks.push(...object.assigned);
                    deletedArchivedTasks.push(...object.archived);

                    delete taskMap[key];
                    modified = true;
                }
            }
        });

        if (modified) {
            const fixedAssignedDetails = details.assigned.filter((detail) => !deletedAssignedTasks.includes(detail.index));
            const fixedArchivedDetails = details.archived.filter((detail) => !deletedArchivedTasks.includes(detail.index));

            if (deletedAssignedTasks.length) {
                const assignedTaskDirectory = getTaskDirectory();

                if (assignedTaskDirectory) {
                    const assignedDirPath = join(workspaceInstance.uri.fsPath, assignedTaskDirectory);

                    deletedAssignedTasks.forEach((index) => {
                        const assignedDetails = details.assigned.filter((detail) => deletedAssignedTasks.includes(detail.index));
                        const assignedTask = Task.getFromIndex(index, assignedDirPath, assignedDetails);

                        assignedTask?.removeFile();
                    });
                }
            }

            if (deletedArchivedTasks.length) {
                const archivedTaskDirectory = getArchivedTaskDirectory();

                if (archivedTaskDirectory) {
                    const archivedDirPath = join(workspaceInstance.uri.fsPath, archivedTaskDirectory);

                    deletedArchivedTasks.forEach((index) => {
                        const archivedDetails = details.archived.filter((detail) => deletedArchivedTasks.includes(detail.index));
                        const archivedTask = Task.getFromIndex(index, archivedDirPath, archivedDetails);

                        archivedTask?.removeFile();
                    });
                }
            }

            workspaceInstance.updateDetails({
                assigned: fixedAssignedDetails,
                archived: fixedArchivedDetails,
            });
            workspaceInstance.updateTaskMap(taskMap);
            workspaceInstance.decorationProvider.decorate(taskMap);
        }
    }
}
