import type { Task } from '../api/types';
import { Button } from './Button';

function formatStamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface TaskCardProps {
  task: Task;
  onComplete?: (task: Task) => void;
  busy?: boolean;
}

export function TaskCard({ task, onComplete, busy = false }: TaskCardProps) {
  const done = task.status === 'COMPLETED';

  return (
    <article className={`nb-task${done ? ' nb-task--done' : ''}`}>
      <h3 className="nb-task__name">{task.name}</h3>
      <p className="nb-task__description">{task.description}</p>
      <div className="nb-task__footer">
        <span className="nb-task__meta">
          {done && task.completedAt
            ? `Done ${formatStamp(task.completedAt)}`
            : `Added ${formatStamp(task.createdAt)}`}
        </span>
        {!done && onComplete && (
          <Button
            variant="accent"
            small
            onClick={() => onComplete(task)}
            disabled={busy}
          >
            {busy ? 'Working…' : 'Complete'}
          </Button>
        )}
      </div>
    </article>
  );
}
