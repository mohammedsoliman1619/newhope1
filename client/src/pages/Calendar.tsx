import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { formatDate, getCurrentWeekDates, getUpcomingDates } from '@/utils/dateUtils';
import { 
  getMonthDays, 
  getWeekDays, 
  getMonthName, 
  navigateMonth, 
  isToday, 
  isCurrentMonth, 
  formatMonthDay,
  formatDayName,
  formatTime
} from '@/utils/calendarUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EventFormModal } from '@/components/modals/EventFormModal';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';

export function Calendar() {
  const { t } = useTranslation();
  const { tasks, reminders, calendarEvents, setQuickAddOpen } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');

  // Get events for the current view
  const getEventsForDate = (date: Date) => {
    const dateString = date.toDateString();
    
    const taskEvents = tasks
      .filter(task => task.dueDate && task.dueDate.toDateString() === dateString)
      .map(task => ({
        id: task.id,
        title: task.title,
        time: task.dueDate,
        type: 'task' as const,
        completed: task.completed,
        priority: task.priority
      }));

    const reminderEvents = reminders
      .filter(reminder => reminder.dueDate.toDateString() === dateString)
      .map(reminder => ({
        id: reminder.id,
        title: reminder.title,
        time: reminder.dueDate,
        type: 'reminder' as const,
        completed: reminder.completed
      }));

    const calendarEventsForDate = calendarEvents
      .filter(event => event.startDate.toDateString() === dateString)
      .map(event => ({
        id: event.id,
        title: event.title,
        time: event.startDate,
        type: 'event' as const,
        completed: false
      }));

    return [...taskEvents, ...reminderEvents, ...calendarEventsForDate]
      .sort((a, b) => (a.time?.getTime() || 0) - (b.time?.getTime() || 0));
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const DayView = () => {
    const events = getEventsForDate(currentDate);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{formatDate(currentDate, 'EEEE, MMMM d, yyyy')}</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                {t('calendar.today')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('common.no_data')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <div
                  key={`${event.type}-${event.id}`}
                  className={`flex items-center space-x-3 p-3 rounded-lg border ${
                    event.completed ? 'bg-muted/50' : 'bg-card'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-hierarchy-small text-muted-foreground">
                      {event.time ? formatDate(event.time, 'h:mm a') : 'All day'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-hierarchy-small font-medium ${
                      event.completed ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {event.title}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      event.type === 'task' ? 'default' :
                      event.type === 'reminder' ? 'secondary' : 'outline'
                    }>
                      {event.type}
                    </Badge>
                    {event.type === 'task' && event.priority && (
                      <Badge variant={
                        event.priority === 'P1' ? 'destructive' :
                        event.priority === 'P2' ? 'secondary' : 'outline'
                      }>
                        {event.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const MonthView = () => {
    const monthDays = getMonthDays(currentDate);
    const monthName = getMonthName(currentDate);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{monthName}</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                {t('calendar.today')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {monthDays.map((day, index) => {
              const events = getEventsForDate(day);
              const isCurrentDay = isToday(day);
              const isInCurrentMonth = isCurrentMonth(day, currentDate);
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border rounded-lg ${
                    isCurrentDay 
                      ? 'bg-primary/10 border-primary' 
                      : isInCurrentMonth 
                        ? 'bg-card hover:bg-accent' 
                        : 'bg-muted/30 text-muted-foreground'
                  } ${events.length > 0 ? 'border-accent' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentDay ? 'text-primary font-bold' : ''
                  }`}>
                    {formatMonthDay(day)}
                  </div>
                  
                  {/* Events for this day */}
                  <div className="space-y-1">
                    {events.slice(0, 2).map(event => (
                      <div
                        key={`${event.type}-${event.id}`}
                        className={`text-xs p-1 rounded truncate ${
                          event.type === 'task' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : event.type === 'reminder' 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                        } ${event.completed ? 'opacity-50 line-through' : ''}`}
                        title={event.title}
                      >
                        {event.time && formatTime(event.time)} {event.title}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{events.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const WeekView = () => {
    const { start, end } = getCurrentWeekDates();
    const weekDays = getUpcomingDates(7);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{formatDate(start, 'MMM d')} - {formatDate(end, 'MMM d, yyyy')}</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                {t('calendar.today')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
            {weekDays.map(day => {
              const events = getEventsForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div key={day.toISOString()} className={`border rounded-lg p-3 ${
                  isToday ? 'border-primary bg-primary/5' : 'border-border'
                }`}>
                  <div className="text-center mb-3">
                    <p className="text-hierarchy-small font-medium">
                      {formatDate(day, 'EEE')}
                    </p>
                    <p className={`text-xl font-semibold ${
                      isToday ? 'text-primary' : 'text-foreground'
                    }`}>
                      {formatDate(day, 'd')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {events.slice(0, 3).map(event => (
                      <div
                        key={`${event.type}-${event.id}`}
                        className={`text-xs p-2 rounded ${
                          event.type === 'task' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          event.type === 'reminder' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' :
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                        }`}
                      >
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="opacity-75">
                          {event.time ? formatDate(event.time, 'h:mm a') : 'All day'}
                        </p>
                      </div>
                    ))}
                    {events.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{events.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-hierarchy-1">{t('calendar.title')}</h1>
          <p className="text-muted-foreground">
            Manage your schedule and events
          </p>
        </div>
        <Button onClick={() => setQuickAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('calendar.add_event')}
        </Button>
      </div>

      {/* View Selector */}
      <Tabs value={view} onValueChange={(value) => setView(value as any)}>
        <TabsList>
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">{t('calendar.week')}</TabsTrigger>
          <TabsTrigger value="month">{t('calendar.month')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="day" className="mt-6">
          <DayView />
        </TabsContent>
        
        <TabsContent value="week" className="mt-6">
          <WeekView />
        </TabsContent>
        
        <TabsContent value="month" className="mt-6">
          <MonthView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
