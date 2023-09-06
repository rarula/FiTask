import { ensureFileSync, existsSync, readJsonSync, writeJsonSync } from 'fs-extra';
import { join } from 'path';
import { Uri, window, workspace, WorkspaceFolder } from 'vscode';

import { TaskDecorationProvider } from './decorationProvider';
import { onDidFileDelete } from './listeners/fileDeleteEvent';
import { onDidFileRename } from './listeners/fileRenameEvent';
import { onDidSaveTextDocument } from './listeners/textDocumentSaveEvent';
import { Configuration, TaskDetails, TaskMap } from './types/Configuration';

const CONFIG_FILE_NAME = 'fitask.meta.json';

const DEFAULT_CONFIG: Configuration = {
    taskIndex: 1,
    taskMap: {},
    details: {
        assigned: [],
        archived: [],
    },
};

export class Workspace {
    private static readonly instanceMap: Map<WorkspaceFolder, Workspace> = new Map();

    public static getInstance(workspaceFolder: WorkspaceFolder): Workspace {
        return Workspace.instanceMap.get(workspaceFolder) ?? new Workspace(workspaceFolder);
    }

    public readonly uri: Uri;
    public readonly configFilePath: string;
    public readonly decorationProvider: TaskDecorationProvider;

    private constructor(workspaceFolder: WorkspaceFolder) {
        this.uri = workspaceFolder.uri;
        this.configFilePath = join(this.uri.fsPath, CONFIG_FILE_NAME);
        this.decorationProvider = new TaskDecorationProvider(this);

        // register file decoration provider
        window.registerFileDecorationProvider(this.decorationProvider);

        // register events
        workspace.onDidRenameFiles((event) => onDidFileRename(event, this));
        workspace.onDidDeleteFiles((event) => onDidFileDelete(event, this));
        workspace.onDidSaveTextDocument((event) => onDidSaveTextDocument(event, this));

        // set instance map
        Workspace.instanceMap.set(workspaceFolder, this);
    }

    public getConfiguration(): Configuration {
        let config = DEFAULT_CONFIG;

        try {
            if (existsSync(this.configFilePath)) {
                config = readJsonSync(this.configFilePath);
            } else {
                this.generateConfiguration();
                config = readJsonSync(this.configFilePath);
            }
        } catch (error) {
            console.error(error);
        }

        return { ...DEFAULT_CONFIG, ...config };
    }

    public updateTaskIndex(taskIndex: number): void {
        const configuration = this.getConfiguration();

        this.updateConfiguration({
            taskIndex: taskIndex,
            taskMap: configuration.taskMap,
            details: configuration.details,
        });
    }

    public updateTaskMap(taskMap: TaskMap): void {
        const configuration = this.getConfiguration();

        this.updateConfiguration({
            taskIndex: configuration.taskIndex,
            taskMap: taskMap,
            details: configuration.details,
        });
    }

    public updateDetails(details: TaskDetails): void {
        const configuration = this.getConfiguration();

        this.updateConfiguration({
            taskIndex: configuration.taskIndex,
            taskMap: configuration.taskMap,
            details: details,
        });
    }

    public updateConfiguration(configuration: Configuration): void {
        const configFilePath = join(this.uri.fsPath, CONFIG_FILE_NAME);

        try {
            if (existsSync(configFilePath)) {
                writeJsonSync(configFilePath, configuration, { spaces: 4 });
            } else {
                ensureFileSync(configFilePath);
                writeJsonSync(configFilePath, configuration, { spaces: 4 });
            }
        } catch (error) {
            console.error(error);
        }
    }

    public generateConfiguration(): void {
        const configFilePath = join(this.uri.fsPath, CONFIG_FILE_NAME);

        try {
            if (!existsSync(configFilePath)) {
                ensureFileSync(configFilePath);
                writeJsonSync(configFilePath, DEFAULT_CONFIG, { spaces: 4 });
            }
        } catch (error) {
            console.error(error);
        }
    }
}
