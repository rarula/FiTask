import { TaskType } from './TaskType';

export type Configuration = {
    taskIndex: number;
    taskMap: TaskMap;
    details: TaskDetails;
};

export type TaskMap = {
    [filePath: string]: {
        assigned: number[];
        archived: number[];
    } | undefined;
};

export type TaskDetails = {
    assigned: TaskDetail[];
    archived: TaskDetail[];
};

export type TaskDetail = {
    name: string;
    type: TaskType;
    index: number;
};
