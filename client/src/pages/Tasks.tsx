import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useAppStore } from '@/lib/store';
import { Task } from '@shared/schema';
import { formatDate, isDueToday, isOverdue, isDueTomorrow } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Check,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle
} from 'lucide-react';

export function Tasks() {
  const { t } = useTranslation();
  const { tasks, projects, toggleTaskCompletion, setQuickAddOpen } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = filterProject === 'all' || task.project === filterProject;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesSearch && matchesProject && matchesPriority;
  });

  // Categorize tasks
  const todayTasks = filteredTasks.filter(task => 
    !task.completed && task.dueDate && isDueToday(task.dueDate)
  );
  
  const upcomingTasks = filteredTasks.filter(task => 
    !task.completed && task.dueDate && 
    !isDueToday(task.dueDate) && !isOverdue(task.dueDate)
  );
  
  const overdueTasks = filteredTasks.filter(task => 
    !task.completed && task.dueDate && isOverdue(task.dueDate)
  );
  
  const completedTasks = filteredTasks.filter(task => task.completed);
  const allIncompleteTasks = filteredTasks.filter(task => !task.completed);

  const TaskItem = ({ task }: { task: Task }) => {
    const project = projects.find(p => p.id === task.project);
    
    return (
      <div className="flex items-center space-x-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors group">
        <Button
          variant="ghost"
          size="sm"
          className={`w-5 h-5 rounded border-2 p-0 ${
            task.completed
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground hover:border-primary'
          }`}
          onClick={() => toggleTaskCompletion(task.id)}
        >
          {task.completed && <Check className="w-3 h-3" />}
        </Button>
        
        <div className="flex-1 min-w-0">
          <p className={`text-hierarchy-small font-medium truncate ${
            task.completed ? 'line-through text-muted-foreground' : ''
          }`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {task.description}
            </p>
          )}
          <div className="flex items-center space-x-2 mt-2">
            {project && (
              <Badge variant="outline" className="text-xs">
                {project.name}
              </Badge>
            )}
            {task.dueDate && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className={`text-xs ${
                  isOverdue(task.dueDate) ? 'text-destructive' :
                  isDueToday(task.dueDate) ? 'text-primary' :
                  isDueTomorrow(task.dueDate) ? 'text-amber-600' :
                  'text-muted-foreground'
                }`}>
                  {formatDate(task.dueDate)}
                </span>
              </div>
            )}
            {task.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {task.dueDate && isOverdue(task.dueDate) && !task.completed && (
            <AlertCircle className="w-4 h-4 text-destructive" />
          )}
          <Badge variant={
            task.priority === 'P1' ? 'destructive' :
            task.priority === 'P2' ? 'secondary' : 'outline'
          }>
            {task.priority}
          </Badge>
        </div>
      </div>
    );
  };

  const TaskSection = ({ tasks, title, emptyMessage }: { 
    tasks: Task[]; 
    title: string; 
    emptyMessage: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="secondary">{tasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-hierarchy-1">{t('tasks.title')}</h1>
          <p className="text-muted-foreground">
            {allIncompleteTasks.length} active, {completedTasks.length} completed
          </p>
        </div>
        <Button onClick={() => setQuickAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('tasks.add_task')}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('actions.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task Tabs */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="today">{t('tasks.today')}</TabsTrigger>
          <TabsTrigger value="upcoming">{t('tasks.upcoming')}</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">{t('tasks.completed')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="mt-6">
          <TaskSection
            tasks={todayTasks}
            title={t('tasks.due_today')}
            emptyMessage="No tasks due today"
          />
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-6">
          <TaskSection
            tasks={upcomingTasks}
            title={t('tasks.upcoming')}
            emptyMessage="No upcoming tasks"
          />
        </TabsContent>
        
        <TabsContent value="overdue" className="mt-6">
          <TaskSection
            tasks={overdueTasks}
            title={t('tasks.overdue')}
            emptyMessage="No overdue tasks"
          />
        </TabsContent>
        
        <TabsContent value="all" className="mt-6">
          <TaskSection
            tasks={allIncompleteTasks}
            title={t('tasks.all_tasks')}
            emptyMessage="No tasks found"
          />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          <TaskSection
            tasks={completedTasks}
            title={t('tasks.completed')}
            emptyMessage="No completed tasks"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
