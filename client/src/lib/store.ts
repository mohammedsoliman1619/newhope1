import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  Task, 
  Project, 
  Goal, 
  Reminder, 
  CalendarEvent,
  InsertTask,
  InsertProject,
  InsertGoal,
  InsertReminder,
  InsertCalendarEvent
} from '@shared/schema';
import { db, dbUtils, Settings } from './db';

export interface AnalyticsData {
  completedTasksByDay: { date: string; count: number }[];
  completedTasksByProject: { project: string; count: number }[];
  goalProgress: { goal: string; progress: number }[];
  productivityScore: number;
  streaks: { type: string; count: number; date: string }[];
  timeSpent: { date: string; hours: number }[];
}

export interface QuickAddData {
  type: 'task' | 'event' | 'goal' | 'reminder';
  title: string;
  description?: string;
  dueDate?: Date;
}

interface AppStore {
  // Data
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  reminders: Reminder[];
  calendarEvents: CalendarEvent[];
  settings: Settings | null;
  analytics: AnalyticsData | null;

  // UI State
  currentPage: string;
  isQuickAddOpen: boolean;
  isMobileMenuOpen: boolean;
  isLoading: boolean;

  // Actions
  setCurrentPage: (page: string) => void;
  setQuickAddOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  
  // Data Actions
  loadTasks: () => Promise<void>;
  loadProjects: () => Promise<void>;
  loadGoals: () => Promise<void>;
  loadReminders: () => Promise<void>;
  loadCalendarEvents: () => Promise<void>;
  loadSettings: () => Promise<void>;
  loadAnalytics: () => Promise<void>;
  
  createTask: (taskData: InsertTask) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  
  createProject: (projectData: InsertProject) => Promise<void>;
  
  createGoal: (goalData: InsertGoal) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  updateGoalProgress: (id: string, value: number) => Promise<void>;
  
  createReminder: (reminderData: InsertReminder) => Promise<void>;
  
  createCalendarEvent: (eventData: InsertCalendarEvent) => Promise<void>;
  
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  
  handleQuickAdd: (data: QuickAddData) => Promise<void>;
  
  initializeApp: () => Promise<void>;
}

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    tasks: [],
    projects: [],
    goals: [],
    reminders: [],
    calendarEvents: [],
    settings: null,
    analytics: null,
    currentPage: 'dashboard',
    isQuickAddOpen: false,
    isMobileMenuOpen: false,
    isLoading: false,

    // UI Actions
    setCurrentPage: (page) => set({ currentPage: page }),
    setQuickAddOpen: (open) => set({ isQuickAddOpen: open }),
    setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

    // Data Loading Actions
    loadTasks: async () => {
      const tasks = await db.tasks.orderBy('createdAt').reverse().toArray();
      set({ tasks });
    },

    loadProjects: async () => {
      const projects = await db.projects.orderBy('name').toArray();
      set({ projects });
    },

    loadGoals: async () => {
      const goals = await db.goals.orderBy('createdAt').reverse().toArray();
      set({ goals });
    },

    loadReminders: async () => {
      const reminders = await db.reminders.orderBy('dueDate').toArray();
      set({ reminders });
    },

    loadCalendarEvents: async () => {
      const calendarEvents = await db.calendarEvents.orderBy('startDate').toArray();
      set({ calendarEvents });
    },

    loadSettings: async () => {
      const settings = await dbUtils.getSettings();
      set({ settings });
    },

    loadAnalytics: async () => {
      const { tasks, goals } = get();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate completed tasks by day
      const completedTasksByDay = tasks
        .filter(task => task.completed && task.updatedAt >= thirtyDaysAgo)
        .reduce((acc, task) => {
          const date = task.updatedAt.toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      // Calculate completed tasks by project
      const { projects } = get();
      const completedTasksByProject = tasks
        .filter(task => task.completed)
        .reduce((acc, task) => {
          const project = projects.find(p => p.id === task.project)?.name || 'No Project';
          acc[project] = (acc[project] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      // Calculate goal progress
      const goalProgress = goals.map(goal => ({
        goal: goal.title,
        progress: goal.targetValue ? (goal.currentValue / goal.targetValue) * 100 : 0
      }));

      // Calculate productivity score (simplified)
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Calculate streaks
      const streaks = goals
        .filter(goal => goal.isHabit && goal.streakCount > 0)
        .map(goal => ({
          type: goal.title,
          count: goal.streakCount,
          date: goal.lastCompletedDate?.toISOString().split('T')[0] || ''
        }));

      const analytics: AnalyticsData = {
        completedTasksByDay: Object.entries(completedTasksByDay).map(([date, count]) => ({ date, count })),
        completedTasksByProject: Object.entries(completedTasksByProject).map(([project, count]) => ({ project, count })),
        goalProgress,
        productivityScore,
        streaks,
        timeSpent: [] // Simplified for now
      };

      set({ analytics });
    },

    // Task Actions
    createTask: async (taskData) => {
      await dbUtils.createTask(taskData);
      await get().loadTasks();
      await get().loadAnalytics();
    },

    updateTask: async (id, updates) => {
      await dbUtils.updateTask(id, updates);
      await get().loadTasks();
      await get().loadAnalytics();
    },

    deleteTask: async (id) => {
      await dbUtils.deleteTask(id);
      await get().loadTasks();
      await get().loadAnalytics();
    },

    toggleTaskCompletion: async (id) => {
      const task = get().tasks.find(t => t.id === id);
      if (task) {
        await dbUtils.updateTask(id, { completed: !task.completed });
        await get().loadTasks();
        await get().loadAnalytics();
      }
    },

    // Project Actions
    createProject: async (projectData) => {
      await dbUtils.createProject(projectData);
      await get().loadProjects();
    },

    // Goal Actions
    createGoal: async (goalData) => {
      await dbUtils.createGoal(goalData);
      await get().loadGoals();
      await get().loadAnalytics();
    },

    updateGoal: async (id, updates) => {
      await dbUtils.updateGoal(id, updates);
      await get().loadGoals();
      await get().loadAnalytics();
    },

    updateGoalProgress: async (id, value) => {
      const goal = get().goals.find(g => g.id === id);
      if (goal) {
        const updates: Partial<Goal> = { currentValue: value };
        
        if (goal.isHabit && value > goal.currentValue) {
          const today = new Date().toDateString();
          const lastCompleted = goal.lastCompletedDate?.toDateString();
          
          if (lastCompleted !== today) {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
            updates.streakCount = lastCompleted === yesterday ? goal.streakCount + 1 : 1;
            updates.lastCompletedDate = new Date();
          }
        }
        
        await dbUtils.updateGoal(id, updates);
        await get().loadGoals();
        await get().loadAnalytics();
      }
    },

    // Reminder Actions
    createReminder: async (reminderData) => {
      await dbUtils.createReminder(reminderData);
      await get().loadReminders();
    },

    // Calendar Actions
    createCalendarEvent: async (eventData) => {
      await dbUtils.createCalendarEvent(eventData);
      await get().loadCalendarEvents();
    },

    // Settings Actions
    updateSettings: async (updates) => {
      await dbUtils.updateSettings(updates);
      await get().loadSettings();
    },

    // Quick Add Action
    handleQuickAdd: async (data) => {
      const { type, text, dueDate, project, priority } = data;
      
      switch (type) {
        case 'task':
          await get().createTask({
            title: text,
            description: '',
            completed: false,
            dueDate,
            priority: priority || 'medium',
            projectId: project || 'inbox',
            tags: [],
            subtasks: []
          });
          break;
        case 'event':
          const startDate = dueDate || new Date();
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
          await get().createCalendarEvent({
            title: text,
            startDate,
            endDate,
            isAllDay: false,
            color: '#3b82f6'
          });
          break;
        case 'goal':
          await get().createGoal({
            title: text,
            category: 'personal',
            currentValue: 0,
            isHabit: false,
            streakCount: 0,
            milestones: []
          });
          break;
        case 'reminder':
          await get().createReminder({
            title: text,
            dueDate: dueDate || new Date(),
            completed: false
          });
          break;
      }
      
      set({ isQuickAddOpen: false });
    },

    // App Initialization
    initializeApp: async () => {
      set({ isLoading: true });
      try {
        await Promise.all([
          get().loadTasks(),
          get().loadProjects(),
          get().loadGoals(),
          get().loadReminders(),
          get().loadCalendarEvents(),
          get().loadSettings()
        ]);
        await get().loadAnalytics();
      } finally {
        set({ isLoading: false });
      }
    }
  }))
);

// Subscribe to task/goal changes to update analytics
useAppStore.subscribe(
  (state) => ({ tasks: state.tasks, goals: state.goals }),
  async () => {
    const store = useAppStore.getState();
    await store.loadAnalytics();
  },
  { equalityFn: (a, b) => a.tasks.length === b.tasks.length && a.goals.length === b.goals.length }
);
