import { ensureFileSync, existsSync, readJsonSync, writeJsonSync } from 'fs-extra';
import { join } from 'path';
import { Uri, window, workspace, WorkspaceFolder } from 'vscode';

import { TaskDecorationProvider } from './decorationProvider';
import { onDidFileRename } from './listeners/fileRenameEvent';
import { onDidSaveTextDocument } from './listeners/textDocumentSaveEvent';
import { Configuration, TaskDetail, TaskMap } from './types/Configuration';

const CONFIG_FILE_NAME = 'fitask.config.json';

const DEFAULT_CONFIG: Configuration = {
    taskIndex: 1,
    taskDetails: [],
    taskMap: {},
};

export class Workspace {
    private static readonly instanceMap: Map<WorkspaceFolder, Workspace> = new Map();

    public static getInstance(workspaceFolder: WorkspaceFolder): Workspace {
        return Workspace.instanceMap.get(workspaceFolder) ?? new Workspace(workspaceFolder);
    }

    public readonly uri: Uri;
    public readonly decorationProvider: TaskDecorationProvider;

    private constructor(workspaceFolder: WorkspaceFolder) {
        this.uri = workspaceFolder.uri;
        this.decorationProvider = new TaskDecorationProvider(this);

        // register file decoration provider
        window.registerFileDecorationProvider(this.decorationProvider);

        // register events
        workspace.onDidRenameFiles((event) => onDidFileRename(event, this));
        workspace.onDidSaveTextDocument((event) => onDidSaveTextDocument(event, this));

        // set instance map
        Workspace.instanceMap.set(workspaceFolder, this);
    }

    public getConfiguration(): Configuration {
        const configFilePath = join(this.uri.fsPath, CONFIG_FILE_NAME);

        if (existsSync(configFilePath)) {
            const config: Configuration = readJsonSync(configFilePath);
            return config;
        } else {
            this.generateConfiguration();
            const config: Configuration = readJsonSync(configFilePath);
            return config;
        }
    }

    public updateTaskIndex(index: number): void {
        const configuration = this.getConfiguration();

        this.updateConfiguration({
            taskIndex: index,
            taskDetails: configuration.taskDetails,
            taskMap: configuration.taskMap,
        });
    }

    public updateTaskDetails(taskDetails: TaskDetail[]): void {
        const configuration = this.getConfiguration();

        this.updateConfiguration({
            taskIndex: configuration.taskIndex,
            taskDetails: taskDetails,
            taskMap: configuration.taskMap,
        });
    }

    public updateTaskMap(taskMap: TaskMap): void {
        const configuration = this.getConfiguration();

        this.updateConfiguration({
            taskIndex: configuration.taskIndex,
            taskDetails: configuration.taskDetails,
            taskMap: taskMap,
        });
    }

    public updateConfiguration(configuration: Configuration): void {
        const configFilePath = join(this.uri.fsPath, CONFIG_FILE_NAME);

        if (existsSync(configFilePath)) {
            writeJsonSync(configFilePath, configuration, { spaces: 4 });
        } else {
            ensureFileSync(configFilePath);
            writeJsonSync(configFilePath, configuration, { spaces: 4 });
        }
    }

    public generateConfiguration(): void {
        const configFilePath = join(this.uri.fsPath, CONFIG_FILE_NAME);

        if (!existsSync(configFilePath)) {
            ensureFileSync(configFilePath);
            writeJsonSync(configFilePath, DEFAULT_CONFIG, { spaces: 4 });
        }
    }
}
