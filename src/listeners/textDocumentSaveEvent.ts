import { readFileSync } from 'fs-extra';
import removeMarkdown from 'markdown-to-text';
import { join } from 'path';
import { TextDocument, workspace } from 'vscode';

import * as config from '../configuration';
import { Task } from '../task';
import { Workspace } from '../workspace';

export function onDidSaveTextDocument(event: TextDocument, workspaceInstance: Workspace): void {
    const relativePath = workspace.asRelativePath(event.uri, false);

    const taskDirectory = config.getTaskDirectory();
    const archivedTaskDirectory = config.getArchivedTaskDirectory();

    if (taskDirectory) {
        const assigned = workspaceInstance.getConfiguration().details.assigned;
        const archived = workspaceInstance.getConfiguration().details.archived;
        const dirPath = join(workspaceInstance.uri.fsPath, taskDirectory);
        let modified = false;

        const fixedAssigned = assigned.map((taskDetail) => {
            const task = Task.getFromIndex(taskDetail.index, dirPath, assigned);

            if (task) {
                if (task.relativePath === relativePath) {
                    const file = readFileSync(task.uri.fsPath, 'utf-8');
                    const name = file.split('\n')[0];
                    taskDetail.name = removeMarkdown(name);

                    modified = true;
                }
            }

            return taskDetail;
        });

        if (modified) {
            workspaceInstance.updateDetails({
                assigned: fixedAssigned,
                archived: archived,
            });
        }
    }

    if (archivedTaskDirectory) {
        const assigned = workspaceInstance.getConfiguration().details.assigned;
        const archived = workspaceInstance.getConfiguration().details.archived;
        const dirPath = join(workspaceInstance.uri.fsPath, archivedTaskDirectory);
        let modified = false;

        const fixedArchived = archived.map((taskDetail) => {
            const task = Task.getFromIndex(taskDetail.index, dirPath, archived);

            if (task) {
                if (task.relativePath === relativePath) {
                    const file = readFileSync(task.uri.fsPath, 'utf-8');
                    const name = file.split('\n')[0];
                    taskDetail.name = removeMarkdown(name);

                    modified = true;
                }
            }

            return taskDetail;
        });

        if (modified) {
            workspaceInstance.updateDetails({
                assigned: assigned,
                archived: fixedArchived,
            });
        }
    }
}
