import { ensureFileSync, existsSync, readFileSync, removeSync, writeFileSync } from 'fs-extra';
import { basename, join } from 'path';
import { commands, Range, Uri, window, workspace } from 'vscode';

import { TaskDetail } from './types/Configuration';
import { TaskType } from './types/TaskType';

export class Task {
    public static getFromPath(path: string, dirPath: string, taskDetails: TaskDetail[]): Task | undefined {
        const index = parseInt(basename(path, '.md'));
        return Task.getFromIndex(index, dirPath, taskDetails);
    }

    public static getFromIndex(index: number, dirPath: string, taskDetails: TaskDetail[]): Task | undefined {
        for (const taskDetail of taskDetails) {
            if (taskDetail.index === index) {
                return new Task(taskDetail.name, index, dirPath, taskDetail.type);
            }
        }
    }

    public readonly name: string;
    public readonly index: number;
    public readonly type: TaskType;
    public readonly uri: Uri;
    public readonly relativePath: string;

    constructor(
        name: string,
        index: number,
        dirPath: string,
        type: TaskType,
    ) {
        const taskFilePath = join(dirPath, index + '.md');
        this.name = name;
        this.index = index;
        this.type = type;
        this.uri = Uri.file(taskFilePath);
        this.relativePath = workspace.asRelativePath(this.uri, false);
    }

    public createFile(content: string): void {
        try {
            if (!existsSync(this.uri.fsPath)) {
                ensureFileSync(this.uri.fsPath);
                writeFileSync(this.uri.fsPath, content);
            }
        } catch (error) {
            console.error(error);
        }
    }

    public removeFile(): void {
        try {
            if (existsSync(this.uri.fsPath)) {
                removeSync(this.uri.fsPath);
            }
        } catch (error) {
            console.error(error);
        }
    }

    public readFile(): string {
        try {
            return readFileSync(this.uri.fsPath, 'utf-8');
        } catch (error) {
            console.error(error);
            return '';
        }
    }

    public open(range?: Range): void {
        window.showTextDocument(this.uri, { selection: range });
    }

    public openPreview(): void {
        commands.executeCommand('markdown.showPreview', this.uri);
    }

    public close(): void {
        window.showTextDocument(this.uri).then(() => {
            return commands.executeCommand('workbench.action.closeActiveEditor');
        });
    }
}
