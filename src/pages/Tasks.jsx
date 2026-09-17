import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { Modal } from '../components/ui/Modal';
import { Plus, Clock, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Tasks() {
  const { user, profile } = useAuth();
  const { fetchTasks, fetchAssignableInterns, createTask, updateTaskStatus, updateTaskDetails, deleteTask } = useTasks();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const canAssign = profile && ['supervisor', 'super_supervisor', 'admin'].includes(profile.role);
  const isGuest = profile?.role === 'guest';

  const loadTasks = async () => {
    setLoading(true);
    const { data } = await fetchTasks();
    if (data) setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      const previousTasks = [...tasks];
      setTasks(tasks.filter(t => t.id !== taskId));
      const { error } = await deleteTask(taskId);
      if (error) {
        alert("Failed to delete task: " + error.message);
        setTasks(previousTasks);
      }
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    const { error } = await updateTaskStatus(taskId, newStatus);
    if (error) {
      alert("Failed to update task status: " + error.message);
      setTasks(previousTasks);
    }
  };

  const handleTaskCreated = (newTask) => {
    const taskWithAssigner = {
      ...newTask,
      assigner: profile ? { full_name: profile.full_name, email: profile.email } : null
    };
    setTasks([taskWithAssigner, ...tasks]);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
  };

  const groupedTasks = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text">Tasks</h2>
        {!isGuest && canAssign && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-colors"
          >
            <Plus className="w-5 h-5" /> Create Task
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-muted">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TaskColumn 
            title="To Do" 
            tasks={groupedTasks.todo} 
            nextStatus="in_progress" 
            onStatusChange={handleStatusChange} 
            onEdit={handleEdit}
            onDelete={handleDelete}
            canAssign={canAssign}
            userId={user?.id}
            isGuest={isGuest}
          />
          <TaskColumn 
            title="In Progress" 
            tasks={groupedTasks.in_progress} 
            prevStatus="todo"
            nextStatus="done" 
            onStatusChange={handleStatusChange} 
            onEdit={handleEdit}
            onDelete={handleDelete}
            canAssign={canAssign}
            userId={user?.id}
            isGuest={isGuest}
          />
          <TaskColumn 
            title="Done" 
            tasks={groupedTasks.done} 
            prevStatus="in_progress"
            onStatusChange={handleStatusChange} 
            onEdit={handleEdit}
            onDelete={handleDelete}
            canAssign={canAssign}
            userId={user?.id}
            isGuest={isGuest}
          />
        </div>
      )}

      {editingTask && (
        <EditTaskModal 
          task={editingTask} 
          onClose={() => setEditingTask(null)} 
          onUpdated={handleTaskUpdated}
          fetchAssignableInterns={fetchAssignableInterns}
        />
      )}
      {canAssign && (
        <CreateTaskModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onCreated={handleTaskCreated}
          fetchAssignableInterns={fetchAssignableInterns}
        />
      )}
    </div>
  );
}

function TaskColumn({ title, tasks, prevStatus, nextStatus, onStatusChange, onEdit, onDelete, canAssign, userId, isGuest }) {
  return (
    <div className="bg-surface-nested rounded-xl p-4 flex flex-col gap-4 border border-border min-h-[500px]">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-text">{title}</h3>
        <span className="text-xs font-bold text-muted bg-border px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <div className="flex-1 space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="bg-surface p-4 rounded-xl shadow-sm border border-border flex flex-col gap-3 group">
            <div>
              <div className="flex justify-between items-start gap-2 mb-1">
                <h4 className="font-bold text-text line-clamp-2">{task.title}</h4>
                {task.priority === 'high' && <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />}

                {!isGuest && canAssign && (
                  <div className="flex gap-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(task)} className="text-muted hover:text-brand transition-colors p-1" title="Edit Task">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(task.id)} className="text-muted hover:text-danger transition-colors p-1" title="Delete Task">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
              <p className="text-sm text-muted line-clamp-3">{task.description}</p>
            </div>
            
            <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-border">
              <div className="flex flex-col gap-1 text-xs text-muted">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate pr-2">To: {task.assignee?.full_name || 'Unassigned'}</span>
                  {task.due_date && (
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" /> {format(parseISO(task.due_date), 'MMM d')}
                    </span>
                  )}
                </div>
                {task.assigner && (
                  <span className="truncate">From: {task.assigner.full_name}</span>
                )}
              </div>
              
              {!isGuest && (canAssign || task.assigned_to === userId) && (prevStatus || nextStatus) && (
                <div className="flex gap-2 mt-2">
                  {prevStatus && (
                    <button
                      onClick={() => onStatusChange(task.id, prevStatus)}
                      className="flex-1 text-center text-sm font-medium text-text bg-surface-nested border border-border hover:bg-hover-bg py-1.5 rounded-lg transition-colors"
                    >
                      &larr; {prevStatus.replace('_', ' ')}
                    </button>
                  )}
                  {nextStatus && (
                    <button
                      onClick={() => onStatusChange(task.id, nextStatus)}
                      className="flex-1 text-center text-sm font-medium text-brand bg-brand-tint hover:opacity-90 py-1.5 rounded-lg transition-colors"
                    >
                      {nextStatus.replace('_', ' ')} &rarr;
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateTaskModal({ isOpen, onClose, onCreated, fetchAssignableInterns }) {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { createTask } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAssignableInterns().then(({ data }) => {
        if (data) setInterns(data);
        if (data?.length > 0) setAssignedTo(data[0].id);
      });
    }
  }, [isOpen, fetchAssignableInterns]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error: createError, data } = await createTask({
      title,
      description,
      assigned_to: assignedTo || null,
      priority,
      due_date: dueDate || null,
    });
    
    setLoading(false);

    if (createError) {
      setError(createError.message);
      return;
    }

    const assignee = interns.find(i => i.id === (assignedTo || null));
    const newTask = {
      ...data,
      assignee: assignee ? { full_name: assignee.full_name, email: assignee.email } : null,
    };

    onCreated(newTask);
    onClose();
    
    // Reset
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-text mb-1">Title</label>
          <input
            required
            type="text"
            className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text mb-1">Description</label>
          <textarea
            rows="3"
            className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Assign To</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none bg-input-bg focus-visible:ring-2 ring-brand ring-offset-2 bg-surface"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              required
            >
              <option value="" disabled>Select an intern</option>
              {interns.map(intern => (
                <option key={intern.id} value={intern.id}>{intern.full_name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text mb-1">Priority</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none bg-input-bg focus-visible:ring-2 ring-brand ring-offset-2 bg-surface"
              value={priority}
              onChange={e => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Due Date (Optional)</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-text bg-surface border border-border hover:bg-hover-bg rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 font-medium text-white bg-brand hover:opacity-90 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}


function EditTaskModal({ task, onClose, onUpdated, fetchAssignableInterns }) {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { updateTaskDetails } = useTasks();

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to || '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.due_date || '');

  useEffect(() => {
    if (task) {
      fetchAssignableInterns().then(({ data }) => {
        if (data) setInterns(data);
      });
      setTitle(task.title);
      setDescription(task.description || '');
      setAssignedTo(task.assigned_to || '');
      setPriority(task.priority || 'medium');
      setDueDate(task.due_date || '');
    }
  }, [task, fetchAssignableInterns]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error: updateError, data } = await updateTaskDetails(task.id, {
      title,
      description,
      assigned_to: assignedTo || null,
      priority,
      due_date: dueDate || null,
    });
    
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    const newAssignee = interns.find(i => i.id === (assignedTo || null));
    const updatedTask = {
      ...data,
      assignee: newAssignee ? { full_name: newAssignee.full_name, email: newAssignee.email } : null,
    };

    onUpdated(updatedTask);
    onClose();
  };

  return (
    <Modal isOpen={!!task} onClose={onClose} title="Edit Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-text mb-1">Title</label>
          <input
            required
            type="text"
            className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text mb-1">Description</label>
          <textarea
            rows="3"
            className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Assign To</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              required
            >
              <option value="" disabled>Select an intern</option>
              {interns.map(intern => (
                <option key={intern.id} value={intern.id}>{intern.full_name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text mb-1">Priority</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2"
              value={priority}
              onChange={e => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Due Date (Optional)</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-text bg-surface border border-border hover:bg-hover-bg rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 font-medium text-white bg-brand hover:opacity-90 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
