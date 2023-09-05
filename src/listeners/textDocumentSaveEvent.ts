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
    if (taskDirectory) {
        const saveDirPath = join(workspaceInstance.uri.fsPath, taskDirectory);
        const taskDetails = workspaceInstance.getConfiguration().taskDetails;

        const fixedTaskDetails = taskDetails.map((taskDetail) => {
            const task = Task.getFromIndex(taskDetail.index, saveDirPath, taskDetails);

            if (task) {
                if (relativePath === task.relativePath) {
                    const file = readFileSync(task.uri.fsPath, 'utf-8');
                    const name = file.split('\n')[0];
                    taskDetail.name = removeMarkdown(name);
                }
            }

            return taskDetail;
        });

        workspaceInstance.updateTaskDetails(fixedTaskDetails);
    }

    const archivedTaskDirectory = config.getArchivedTaskDirectory();
    if (archivedTaskDirectory) {
        const archiveDirPath = join(workspaceInstance.uri.fsPath, archivedTaskDirectory);
        const taskDetails = workspaceInstance.getConfiguration().taskDetails;

        const fixedTaskDetails = taskDetails.map((taskDetail) => {
            const task = Task.getFromIndex(taskDetail.index, archiveDirPath, taskDetails);

            if (task) {
                if (relativePath === task.relativePath) {
                    const file = readFileSync(task.uri.fsPath, 'utf-8');
                    const name = file.split('\n')[0];
                    taskDetail.name = removeMarkdown(name);
                }
            }

            return taskDetail;
        });

        workspaceInstance.updateTaskDetails(fixedTaskDetails);
    }
}
