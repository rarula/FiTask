import { TaskType } from './TaskType';

export type Configuration = {
    taskIndex: number;
    taskDetails: TaskDetail[];
    taskMap: TaskMap;
};

export type TaskDetail = {
    name: string;
    type: TaskType;
    index: number;
};

export type TaskMap = {
    [filePath: string]: number[];
};
