import { join } from 'path';
import { commands, Uri, window, workspace } from 'vscode';

import { TaskDetail } from './types/Configuration';
import { TaskType } from './types/TaskType';

export class Task {
    public static getFromIndex(index: number, saveDirPath: string, taskDetails: TaskDetail[]): Task | undefined {
        for (const taskDetail of taskDetails) {
            if (taskDetail.index === index) {
                return new Task(taskDetail.name, index, saveDirPath, taskDetail.type);
            }
        }
    }

    public readonly name: string;
    public readonly index: number;
    public readonly type: TaskType;
    public readonly uri: Uri;

    constructor(
        name: string,
        index: number,
        saveDirPath: string,
        type: TaskType,
    ) {
        const taskFilePath = join(saveDirPath, index + '.md');
        this.name = name;
        this.index = index;
        this.type = type;
        this.uri = Uri.file(taskFilePath);
    }

    public open(): void {
        workspace.openTextDocument(this.uri).then((document) => {
            window.showTextDocument(document);
        });
    }

    public openPreview(): void {
        commands.executeCommand('markdown.showPreview', this.uri);
    }
}
