import { TaskType } from './TaskType';

export type Configuration = {
    taskIndex: number;
    taskDetails: TaskDetail[];
    archivedTaskDetails: TaskDetail[];
    taskMap: TaskMap;
};

export type TaskDetail = {
    name: string;
    type: TaskType;
    index: number;
};

export type TaskMap = {
    [filePath: string]: {
        archived: number[];
        assigned: number[];
    };
};
