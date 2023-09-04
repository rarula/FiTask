import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { ExtensionContext } from 'vscode';

import { TemplateTaskType } from './types/TaskType';

export class Template {
    private static templateMap: Map<TemplateTaskType, string> = new Map();

    public static readFile(fileName: TemplateTaskType, context: ExtensionContext): void {
        const relativePath = join('templates', fileName + '.md');
        const absolutePath = context.asAbsolutePath(relativePath);

        try {
            const template = readFileSync(absolutePath, 'utf-8');
            Template.templateMap.set(fileName, template);
        } catch (error) {
            console.error(error);
        }
    }

    public static getTemplate(taskType: TemplateTaskType): string {
        return Template.templateMap.get(taskType) ?? '';
    }
}
