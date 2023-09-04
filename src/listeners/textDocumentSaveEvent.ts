import { readFileSync } from 'fs-extra';
import removeMarkdown from 'markdown-to-text';
import { join } from 'path';
import { TextDocument, workspace } from 'vscode';

import { Task } from '../task';
import { Workspace } from '../workspace';

export function onDidSaveTextDocument(event: TextDocument, workspaceInstance: Workspace): void {
    const taskDirectory = workspace.getConfiguration('fiTask').get<string>('taskDirectory');
    const relativePath = workspace.asRelativePath(event.uri, false);

    if (taskDirectory) {
        const saveDirPath = join(workspaceInstance.uri.fsPath, taskDirectory);
        const taskDetails = workspaceInstance.getConfiguration().taskDetails;

        const fixedTaskDetails = taskDetails.map((taskDetail) => {
            const task = Task.getFromIndex(taskDetail.index, saveDirPath, taskDetails);

            if (task) {
                const taskRelativePath = workspace.asRelativePath(task.uri);

                if (relativePath === taskRelativePath) {
                    const file = readFileSync(event.uri.fsPath, 'utf-8');
                    const name = file.split('\n')[0];
                    taskDetail.name = removeMarkdown(name);
                }
            }

            return taskDetail;
        });

        if (fixedTaskDetails) {
            workspaceInstance.updateTaskDetails(fixedTaskDetails);
        }
    }
}
