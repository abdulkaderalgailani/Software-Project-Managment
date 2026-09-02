import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { Modal } from '../components/ui/Modal';
import { Plus, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Tasks() {
  const { profile } = useAuth();
  const { fetchTasks, fetchAssignableInterns, createTask, updateTaskStatus } = useTasks();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const canAssign = profile && ['supervisor', 'super_supervisor', 'admin'].includes(profile.role);

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

  const handleStatusChange = async (taskId, newStatus) => {
    // Optimistic update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await updateTaskStatus(taskId, newStatus);
    loadTasks(); // refresh to ensure consistency
  };

  const groupedTasks = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-ink">Tasks</h2>
        {canAssign && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-brand-600 transition-colors"
          >
            <Plus className="w-5 h-5" /> Create Task
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-muted">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TaskColumn 
            title="To Do" 
            tasks={groupedTasks.todo} 
            nextStatus="in_progress" 
            onStatusChange={handleStatusChange} 
          />
          <TaskColumn 
            title="In Progress" 
            tasks={groupedTasks.in_progress} 
            nextStatus="done" 
            onStatusChange={handleStatusChange} 
          />
          <TaskColumn 
            title="Done" 
            tasks={groupedTasks.done} 
            onStatusChange={handleStatusChange} 
          />
        </div>
      )}

      {canAssign && (
        <CreateTaskModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onCreated={loadTasks}
          fetchAssignableInterns={fetchAssignableInterns}
        />
      )}
    </div>
  );
}

function TaskColumn({ title, tasks, nextStatus, onStatusChange }) {
  return (
    <div className="bg-surface rounded-xl p-4 flex flex-col gap-4 border border-border min-h-[500px]">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-ink">{title}</h3>
        <span className="text-xs font-bold text-muted bg-border px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <div className="flex-1 space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-border flex flex-col gap-3">
            <div>
              <div className="flex justify-between items-start gap-2 mb-1">
                <h4 className="font-bold text-ink line-clamp-2">{task.title}</h4>
                {task.priority === 'high' && <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />}
              </div>
              <p className="text-sm text-muted line-clamp-3">{task.description}</p>
            </div>
            
            <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-border">
              <div className="flex justify-between items-center text-xs text-muted">
                <span className="font-medium truncate pr-2">To: {task.assignee?.full_name || 'Unassigned'}</span>
                {task.due_date && (
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3" /> {format(parseISO(task.due_date), 'MMM d')}
                  </span>
                )}
              </div>
              
              {nextStatus && (
                <button
                  onClick={() => onStatusChange(task.id, nextStatus)}
                  className="w-full text-center text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 py-1.5 rounded-lg transition-colors mt-2"
                >
                  Move to {nextStatus.replace('_', ' ')}
                </button>
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
    
    const { error: createError } = await createTask({
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

    onCreated();
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
          <label className="block text-sm font-medium text-ink mb-1">Title</label>
          <input
            required
            type="text"
            className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus-visible:ring-2 ring-brand-500 ring-offset-2"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Description</label>
          <textarea
            rows="3"
            className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus-visible:ring-2 ring-brand-500 ring-offset-2"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Assign To</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus-visible:ring-2 ring-brand-500 bg-white"
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
            <label className="block text-sm font-medium text-ink mb-1">Priority</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus-visible:ring-2 ring-brand-500 bg-white"
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
          <label className="block text-sm font-medium text-ink mb-1">Due Date (Optional)</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus-visible:ring-2 ring-brand-500 ring-offset-2"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-ink bg-white border border-border hover:bg-surface rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
