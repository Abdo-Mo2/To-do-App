export type FilterType = 'all' | 'completed' | 'pending';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}
