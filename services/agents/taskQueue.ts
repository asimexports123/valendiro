/**
 * Task Queue
 *
 * Every discovered task enters a queue.
 * Priority based on:
 * - User value
 * - Knowledge importance
 * - Search opportunity
 * - Product quality
 * - Risk
 *
 * Agents automatically pick the next task.
 */

export interface Task {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: number; // 1-100, higher = more important
  status: "pending" | "in-progress" | "completed" | "failed" | "cancelled";
  assignedAgentId: string | null;
  input: any;
  output: any | null;
  error: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  retryCount: number;
  maxRetries: number;
  metadata: Record<string, any>;
}

export interface TaskQueueConfig {
  maxQueueSize: number;
  maxRetries: number;
  persistToDatabase: boolean;
}

export class TaskQueue {
  private static instance: TaskQueue;
  private queue: Map<string, Task> = new Map();
  private config: TaskQueueConfig;

  private constructor(config?: Partial<TaskQueueConfig>) {
    this.config = {
      maxQueueSize: 1000,
      maxRetries: 3,
      persistToDatabase: false,
      ...config,
    };
  }

  static getInstance(config?: Partial<TaskQueueConfig>): TaskQueue {
    if (!TaskQueue.instance) {
      TaskQueue.instance = new TaskQueue(config);
    }
    return TaskQueue.instance;
  }

  /**
   * Add a task to the queue
   */
  add(taskInput: {
    type: string;
    title: string;
    description: string;
    priority: number;
    status: "pending" | "in-progress" | "completed" | "failed" | "cancelled";
    assignedAgentId: string | null;
    input: any;
    output: any | null;
    error: string | null;
    maxRetries: number;
    metadata: Record<string, any>;
  }): Task {
    const id = `task:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

    const newTask: Task = {
      id,
      type: taskInput.type,
      title: taskInput.title,
      description: taskInput.description,
      priority: taskInput.priority,
      status: taskInput.status,
      assignedAgentId: taskInput.assignedAgentId,
      input: taskInput.input,
      output: taskInput.output,
      error: taskInput.error,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      retryCount: 0,
      maxRetries: taskInput.maxRetries,
      metadata: taskInput.metadata,
    };

    // Check queue size limit
    if (this.queue.size >= this.config.maxQueueSize) {
      this.evictLowestPriority();
    }

    this.queue.set(id, newTask);

    if (this.config.persistToDatabase) {
      this.persistToDatabase(newTask);
    }

    return newTask;
  }

  /**
   * Get the next task for an agent
   */
  getNext(agentId?: string): Task | null {
    const pendingTasks = Array.from(this.queue.values())
      .filter(t => t.status === "pending")
      .sort((a, b) => b.priority - a.priority);

    if (pendingTasks.length === 0) return null;

    // Get highest priority task
    const task = pendingTasks[0];

    // Mark as in-progress
    this.updateStatus(task.id, "in-progress", agentId ?? null);

    return task;
  }

  /**
   * Get all tasks
   */
  getAll(): Task[] {
    return Array.from(this.queue.values());
  }

  /**
   * Get tasks by status
   */
  getByStatus(status: Task["status"]): Task[] {
    return Array.from(this.queue.values())
      .filter(t => t.status === status)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get tasks by type
   */
  getByType(type: string): Task[] {
    return Array.from(this.queue.values())
      .filter(t => t.type === type)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get tasks for a specific agent
   */
  getByAgent(agentId: string): Task[] {
    return Array.from(this.queue.values())
      .filter(t => t.assignedAgentId === agentId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Update task status
   */
  updateStatus(
    id: string,
    status: Task["status"],
    agentId: string | null = null
  ): void {
    const task = this.queue.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    task.status = status;
    task.assignedAgentId = agentId;

    if (status === "in-progress") {
      task.startedAt = new Date();
    } else if (status === "completed" || status === "failed" || status === "cancelled") {
      task.completedAt = new Date();
    }

    if (this.config.persistToDatabase) {
      this.persistToDatabase(task);
    }
  }

  /**
   * Complete a task with output
   */
  complete(id: string, output: any): void {
    const task = this.queue.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    task.status = "completed";
    task.output = output;
    task.error = null;
    task.completedAt = new Date();

    if (this.config.persistToDatabase) {
      this.persistToDatabase(task);
    }
  }

  /**
   * Fail a task
   */
  fail(id: string, error: string): void {
    const task = this.queue.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    task.status = "failed";
    task.error = error;
    task.completedAt = new Date();
    task.retryCount++;

    // Auto-retry if under max retries
    if (task.retryCount < task.maxRetries) {
      task.status = "pending";
      task.startedAt = null;
      task.completedAt = null;
    }

    if (this.config.persistToDatabase) {
      this.persistToDatabase(task);
    }
  }

  /**
   * Cancel a task
   */
  cancel(id: string): void {
    const task = this.queue.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    task.status = "cancelled";
    task.completedAt = new Date();

    if (this.config.persistToDatabase) {
      this.persistToDatabase(task);
    }
  }

  /**
   * Remove a task
   */
  remove(id: string): boolean {
    return this.queue.delete(id);
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.queue.clear();
  }

  /**
   * Get queue statistics
   */
  getStatistics(): {
    totalTasks: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    averagePriority: number;
    oldestTask: Date | null;
    newestTask: Date | null;
    tasksInProgress: number;
    completionRate: number;
  } {
    const tasks = Array.from(this.queue.values());
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalPriority = 0;
    let oldest: Date | null = null;
    let newest: Date | null = null;

    for (const task of tasks) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      byType[task.type] = (byType[task.type] || 0) + 1;
      totalPriority += task.priority;

      if (!oldest || task.createdAt < oldest) oldest = task.createdAt;
      if (!newest || task.createdAt > newest) newest = task.createdAt;
    }

    const completed = tasks.filter(t => t.status === "completed").length;
    const failed = tasks.filter(t => t.status === "failed").length;
    const totalFinished = completed + failed;

    return {
      totalTasks: tasks.length,
      byStatus,
      byType,
      averagePriority: tasks.length > 0 ? totalPriority / tasks.length : 0,
      oldestTask: oldest,
      newestTask: newest,
      tasksInProgress: byStatus["in-progress"] || 0,
      completionRate: totalFinished > 0 ? completed / totalFinished : 0,
    };
  }

  /**
   * Evict lowest priority task
   */
  private evictLowestPriority(): void {
    let lowestId: string | null = null;
    let lowestPriority: number = Infinity;

    for (const [id, task] of this.queue.entries()) {
      if (task.status === "pending" && task.priority < lowestPriority) {
        lowestPriority = task.priority;
        lowestId = id;
      }
    }

    if (lowestId) {
      this.queue.delete(lowestId);
    }
  }

  /**
   * Persist to database (placeholder)
   */
  private persistToDatabase(task: Task): void {
    // TODO: Implement database persistence
    // This would store the task in a database table
    // for cross-instance persistence
  }

  /**
   * Convenience methods for common task types
   */
  addResearchTask(
    title: string,
    description: string,
    input: any,
    priority: number = 50
  ): Task {
    return this.add({
      type: "research",
      title,
      description,
      priority,
      status: "pending",
      assignedAgentId: null,
      input,
      output: null,
      error: null,
      maxRetries: this.config.maxRetries,
      metadata: {},
    });
  }

  addCoverageTask(
    title: string,
    description: string,
    input: any,
    priority: number = 60
  ): Task {
    return this.add({
      type: "coverage",
      title,
      description,
      priority,
      status: "pending",
      assignedAgentId: null,
      input,
      output: null,
      error: null,
      maxRetries: this.config.maxRetries,
      metadata: {},
    });
  }

  addAcquisitionTask(
    title: string,
    description: string,
    input: any,
    priority: number = 70
  ): Task {
    return this.add({
      type: "acquisition",
      title,
      description,
      priority,
      status: "pending",
      assignedAgentId: null,
      input,
      output: null,
      error: null,
      maxRetries: this.config.maxRetries,
      metadata: {},
    });
  }

  addAuthoringTask(
    title: string,
    description: string,
    input: any,
    priority: number = 80
  ): Task {
    return this.add({
      type: "authoring",
      title,
      description,
      priority,
      status: "pending",
      assignedAgentId: null,
      input,
      output: null,
      error: null,
      maxRetries: this.config.maxRetries,
      metadata: {},
    });
  }

  addQualityTask(
    title: string,
    description: string,
    input: any,
    priority: number = 85
  ): Task {
    return this.add({
      type: "quality",
      title,
      description,
      priority,
      status: "pending",
      assignedAgentId: null,
      input,
      output: null,
      error: null,
      maxRetries: this.config.maxRetries,
      metadata: {},
    });
  }
}
