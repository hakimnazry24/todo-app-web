import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { tasksApi } from '../api/endpoints';
import type { Task } from '../api/types';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { TextAreaField, TextField } from '../components/Field';
import { Modal } from '../components/Modal';
import { Navbar } from '../components/Navbar';
import { TaskCard } from '../components/TaskCard';

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setTasks(await tasksApi.list());
      setError(null);
    } catch (err) {
      // A 401 is already handled globally by logging the user out.
      if (err instanceof ApiError && err.status !== 401) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const { pending, completed } = useMemo(
    () => ({
      pending: tasks.filter((task) => task.status === 'PENDING'),
      completed: tasks.filter((task) => task.status === 'COMPLETED'),
    }),
    [tasks],
  );

  const handleComplete = async (task: Task) => {
    setCompletingId(task.id);
    try {
      const updated = await tasksApi.complete(task.id);
      setTasks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status !== 401) {
        setError(err.message);
      }
    } finally {
      setCompletingId(null);
    }
  };

  const handleCreated = (task: Task) => {
    setTasks((current) => [task, ...current]);
    setModalOpen(false);
  };

  return (
    <div className="nb-page">
      <Navbar />

      <main className="nb-main">
        <div className="nb-toolbar">
          <div>
            <h1 className="nb-toolbar__title">My tasks</h1>
            <p className="nb-toolbar__subtitle">
              {pending.length} pending · {completed.length} finished
            </p>
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            + Add task
          </Button>
        </div>

        {error && <Banner tone="error">{error}</Banner>}

        {loading ? (
          <div className="nb-card">Loading your tasks…</div>
        ) : (
          <div className="nb-board">
            <section className="nb-column nb-column--pending">
              <header className="nb-column__header">
                <h2 className="nb-column__title">Pending</h2>
                <span className="nb-count">{pending.length}</span>
              </header>
              <div className="nb-column__body">
                {pending.length === 0 ? (
                  <p className="nb-empty">
                    Nothing pending. Hit <strong>+ Add task</strong> to start one.
                  </p>
                ) : (
                  pending.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleComplete}
                      busy={completingId === task.id}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="nb-column nb-column--done">
              <header className="nb-column__header">
                <h2 className="nb-column__title">Finished</h2>
                <span className="nb-count">{completed.length}</span>
              </header>
              <div className="nb-column__body">
                {completed.length === 0 ? (
                  <p className="nb-empty">
                    Completed tasks land here.
                  </p>
                ) : (
                  completed.map((task) => <TaskCard key={task.id} task={task} />)
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {modalOpen && (
        <CreateTaskModal
          onClose={() => setModalOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

interface CreateTaskModalProps {
  onClose: () => void;
  onCreated: (task: Task) => void;
}

function CreateTaskModal({ onClose, onCreated }: CreateTaskModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const task = await tasksApi.create({
        name: name.trim(),
        description: description.trim(),
      });
      onCreated(task);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not create the task.',
      );
      setSubmitting(false);
    }
  };

  return (
    <Modal title="New task" onClose={onClose}>
      {error && <Banner tone="error">{error}</Banner>}

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Task name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Buy groceries"
          maxLength={120}
          autoFocus
          required
        />
        <TextAreaField
          label="Task description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Milk, eggs, bread, and coffee beans."
          maxLength={2000}
          required
        />
        <div className="nb-modal__actions">
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !name.trim() || !description.trim()}
          >
            {submitting ? 'Creating…' : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
