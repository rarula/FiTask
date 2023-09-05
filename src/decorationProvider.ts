import { join } from 'path';
import { Event, EventEmitter, FileDecoration, FileDecorationProvider, ThemeColor, Uri } from 'vscode';

import { TaskMap } from './types/Configuration';
import { Workspace } from './workspace';

export class TaskDecorationProvider implements FileDecorationProvider {
    private workspace: Workspace;
    private taskMap: Map<string, FileDecoration>;

    private readonly eventEmitter: EventEmitter<Uri | Uri[]>;
    public readonly onDidChangeFileDecorations: Event<Uri | Uri[] | undefined>;

    constructor(workspace: Workspace) {
        this.workspace = workspace;
        this.taskMap = new Map();

        this.eventEmitter = new EventEmitter();
        this.onDidChangeFileDecorations = this.eventEmitter.event;
    }

    public decorate(taskMap: TaskMap): void {
        const newTaskMap: Map<string, FileDecoration> = new Map();

        for (const key in taskMap) {
            const object = taskMap[key];

            if (object?.assigned.length) {
                const fullPath = join(this.workspace.uri.fsPath, key);
                const uri = Uri.file(fullPath);

                newTaskMap.set(uri.fsPath, {
                    tooltip: 'Total tasks',
                    propagate: false,
                    badge: object.assigned.length.toString(),
                    color: new ThemeColor('fiTaskDecoration.taskedResourceForeground'),
                });
            }
        }

        const uris = new Set([...this.taskMap.keys()].concat([...newTaskMap.keys()]));
        this.taskMap = newTaskMap;
        this.eventEmitter.fire([...uris.values()].map((value) => Uri.file(value)));
    }

    public provideFileDecoration(uri: Uri): FileDecoration | undefined {
        return this.taskMap.get(uri.fsPath);
    }
}
