/**
 * Agent Communication System
 *
 * Agents communicate only through structured messages.
 * No direct dependencies.
 * Every output becomes another agent's input.
 */

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string | null; // null = broadcast to all
  messageType: string;
  data: any;
  timestamp: Date;
  correlationId?: string; // For request-response patterns
  replyTo?: string; // Message ID this is replying to
}

export interface MessageHandler {
  messageType: string;
  handler: (message: AgentMessage) => Promise<any>;
}

export class AgentCommunication {
  private static instance: AgentCommunication;
  private messages: AgentMessage[] = [];
  private handlers: Map<string, MessageHandler[]> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // agentId -> subscribed message types

  private constructor() {}

  static getInstance(): AgentCommunication {
    if (!AgentCommunication.instance) {
      AgentCommunication.instance = new AgentCommunication();
    }
    return AgentCommunication.instance;
  }

  /**
   * Send a message from one agent to another
   */
  async send(
    fromAgentId: string,
    toAgentId: string,
    messageType: string,
    data: any,
    correlationId?: string,
    replyTo?: string
  ): Promise<void> {
    const message: AgentMessage = {
      id: `msg:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      fromAgentId,
      toAgentId,
      messageType,
      data,
      timestamp: new Date(),
      correlationId,
      replyTo,
    };

    this.messages.push(message);

    // Deliver to recipient
    await this.deliver(message);
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcast(
    fromAgentId: string,
    messageType: string,
    data: any,
    correlationId?: string
  ): Promise<void> {
    const message: AgentMessage = {
      id: `msg:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      fromAgentId,
      toAgentId: null,
      messageType,
      data,
      timestamp: new Date(),
      correlationId,
    };

    this.messages.push(message);

    // Deliver to all subscribed agents
    await this.deliver(message);
  }

  /**
   * Register a message handler for a specific message type
   */
  registerHandler(agentId: string, messageType: string, handler: (message: AgentMessage) => Promise<any>): void {
    const messageHandler: MessageHandler = {
      messageType,
      handler,
    };

    if (!this.handlers.has(agentId)) {
      this.handlers.set(agentId, []);
    }

    this.handlers.get(agentId)!.push(messageHandler);

    // Auto-subscribe the agent to this message type
    this.subscribe(agentId, messageType);
  }

  /**
   * Subscribe an agent to a message type
   */
  subscribe(agentId: string, messageType: string): void {
    if (!this.subscriptions.has(agentId)) {
      this.subscriptions.set(agentId, new Set());
    }

    this.subscriptions.get(agentId)!.add(messageType);
  }

  /**
   * Unsubscribe an agent from a message type
   */
  unsubscribe(agentId: string, messageType: string): void {
    const subscriptions = this.subscriptions.get(agentId);
    if (subscriptions) {
      subscriptions.delete(messageType);
    }
  }

  /**
   * Deliver a message to its recipient(s)
   */
  private async deliver(message: AgentMessage): Promise<void> {
    if (message.toAgentId) {
      // Direct message
      await this.deliverToAgent(message.toAgentId, message);
    } else {
      // Broadcast to all subscribed agents
      for (const [agentId, subscriptions] of this.subscriptions.entries()) {
        if (subscriptions.has(message.messageType)) {
          await this.deliverToAgent(agentId, message);
        }
      }
    }
  }

  /**
   * Deliver message to a specific agent
   */
  private async deliverToAgent(agentId: string, message: AgentMessage): Promise<void> {
    const handlers = this.handlers.get(agentId);
    if (!handlers) return;

    for (const handler of handlers) {
      if (handler.messageType === message.messageType) {
        try {
          await handler.handler(message);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[Agent Communication] Error handling message in agent ${agentId}: ${errorMessage}`);
          throw new Error(`Agent ${agentId} failed to handle ${message.messageType} message: ${errorMessage}`);
        }
      }
    }
  }

  /**
   * Get message history
   */
  getMessages(limit?: number): AgentMessage[] {
    const history = [...this.messages].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Get messages for a specific agent
   */
  getMessagesForAgent(agentId: string, limit?: number): AgentMessage[] {
    const messages = this.messages.filter(m => m.toAgentId === agentId || m.fromAgentId === agentId);
    const reversed = messages.reverse();
    return limit ? reversed.slice(0, limit) : reversed;
  }

  /**
   * Get messages by type
   */
  getMessagesByType(messageType: string, limit?: number): AgentMessage[] {
    const messages = this.messages.filter(m => m.messageType === messageType);
    const reversed = messages.reverse();
    return limit ? reversed.slice(0, limit) : reversed;
  }

  /**
   * Get messages by correlation ID (for request-response patterns)
   */
  getMessagesByCorrelation(correlationId: string): AgentMessage[] {
    return this.messages.filter(m => m.correlationId === correlationId);
  }

  /**
   * Clear message history
   */
  clear(): void {
    this.messages = [];
  }

  /**
   * Get communication statistics
   */
  getStatistics(): {
    totalMessages: number;
    byType: Record<string, number>;
    byAgent: Record<string, number>;
    broadcasts: number;
    directMessages: number;
  } {
    const byType: Record<string, number> = {};
    const byAgent: Record<string, number> = {};
    let broadcasts = 0;
    let directMessages = 0;

    for (const message of this.messages) {
      byType[message.messageType] = (byType[message.messageType] || 0) + 1;
      byAgent[message.fromAgentId] = (byAgent[message.fromAgentId] || 0) + 1;

      if (message.toAgentId === null) {
        broadcasts++;
      } else {
        directMessages++;
      }
    }

    return {
      totalMessages: this.messages.length,
      byType,
      byAgent,
      broadcasts,
      directMessages,
    };
  }
}
