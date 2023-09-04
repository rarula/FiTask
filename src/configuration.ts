import { workspace } from 'vscode';
import { CustomTaskTemplate } from './types/CustomTaskTemplate';

const SECTION = 'fiTask';

export function getTaskDirectory(): string | undefined {
    return workspace.getConfiguration(SECTION).get<string>('taskDirectory');
}

export function getCustomTaskTemplate(): string[] | undefined {
    return workspace.getConfiguration(SECTION).get<string[]>('customTaskTemplate');
}

export function getCustomBugTaskTemplate(): string[] | undefined {
    return workspace.getConfiguration(SECTION).get<string[]>('customBugTaskTemplate');
}

export function getCustomRefactoringTaskTemplate(): string[] | undefined {
    return workspace.getConfiguration(SECTION).get<string[]>('customRefactoringTaskTemplate');
}

export function getCustomTestingTaskTemplate(): string[] | undefined {
    return workspace.getConfiguration(SECTION).get<string[]>('customTestingTaskTemplate');
}

export function getCustomTaskTemplates(): CustomTaskTemplate[] | undefined {
    return workspace.getConfiguration(SECTION).get<CustomTaskTemplate[]>('customTaskTemplates');
}
