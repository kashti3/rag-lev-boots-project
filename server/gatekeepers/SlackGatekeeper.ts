import { BaseGatekeeper } from './BaseGatekeeper';
import { SourceType, GatekeeperResult } from './types';
import { GATEKEEPER_CONFIG } from '../config/constants';

interface SlackMessage {
  user: string;
  text: string;
  timestamp: string;
  thread_ts?: string; // Thread timestamp for threaded messages
}

interface SlackContext {
  messages: SlackMessage[];
  groupingMethod: 'thread' | 'time_window';
  timeWindow?: number;
}

export class SlackGatekeeper extends BaseGatekeeper {
  protected sourceType: SourceType = 'slack';
  
  protected prompt = `You are evaluating a Slack conversation about the Levitation Boots project. Focus on technical value and project relevance.

Conversation context:
"""
{content}
"""

Rate this conversation from 0-10:
- 0-3: Pure social chat, greetings, emoji reactions, single words like "lol", "thanks", "ok"
- 4-6: Logistics, scheduling, minor updates without technical content, basic Q&A
- 7-10: Technical discussions, bug reports, feature planning, design decisions, project updates, meaningful Q&As about the technology

Important: Consider the ENTIRE conversation. Even if it starts casually, it might contain valuable technical discussion later. Look for:
- Technical details about levitation boots
- Project decisions or planning
- Bug reports or issue discussions
- Feature requests or specifications
- Engineering challenges or solutions

Respond in JSON format: {"score": X, "reason": "brief explanation", "keepContent": true/false}`;

  /**
   * Process Slack data with hybrid approach
   */
  async evaluateSlackData(data: string | SlackMessage[]): Promise<GatekeeperResult> {
    // If data is already grouped, process directly
    if (typeof data === 'string') {
      return this.evaluate(data);
    }

    // Process messages with hybrid approach
    const contexts = this.groupMessagesHybrid(data);
    const results: GatekeeperResult[] = [];
    const rejectedParts: string[] = [];

    for (const context of contexts) {
      const conversationText = this.formatContext(context);
      const result = await this.evaluate(conversationText);
      
      if (result.isInformative) {
        results.push(result);
      } else {
        rejectedParts.push(conversationText);
        if (GATEKEEPER_CONFIG.enableRejectionLogging) {
          console.log(`[SlackGatekeeper] Rejected ${context.groupingMethod} group:`, {
            messageCount: context.messages.length,
            score: result.score,
            reason: result.reason,
            preview: conversationText.substring(0, 200) + '...'
          });
        }
      }
    }

    // Combine all accepted content
    const acceptedContent = results
      .map(r => r.processedContent)
      .filter(c => c)
      .join('\n\n---\n\n');

    const totalScore = results.length > 0 
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length 
      : 0;

    return {
      isInformative: acceptedContent.length > 0,
      score: totalScore,
      reason: `Processed ${contexts.length} conversation groups, accepted ${results.length}`,
      processedContent: acceptedContent,
      metadata: {
        originalLength: data.reduce((sum, m) => sum + m.text.length, 0),
        processedLength: acceptedContent.length,
        rejectedParts
      }
    };
  }

  /**
   * Group messages using hybrid approach: threads first, then time windows
   */
  private groupMessagesHybrid(messages: SlackMessage[]): SlackContext[] {
    const contexts: SlackContext[] = [];
    const processedIds = new Set<string>();

    // Step 1: Group by threads
    const threads = this.groupByThread(messages);
    for (const thread of threads) {
      if (thread.length >= GATEKEEPER_CONFIG.slack.minThreadSize) {
        contexts.push({
          messages: thread,
          groupingMethod: 'thread'
        });
        thread.forEach(m => processedIds.add(`${m.timestamp}_${m.user}`));
      }
    }

    // Step 2: Group remaining messages by time windows
    const remaining = messages.filter(m => !processedIds.has(`${m.timestamp}_${m.user}`));
    const timeWindows = this.groupByTimeWindow(remaining, GATEKEEPER_CONFIG.slack.timeWindowMs);
    
    for (const window of timeWindows) {
      contexts.push({
        messages: window,
        groupingMethod: 'time_window',
        timeWindow: GATEKEEPER_CONFIG.slack.timeWindowMs
      });
    }

    return contexts;
  }

  /**
   * Group messages by thread
   */
  private groupByThread(messages: SlackMessage[]): SlackMessage[][] {
    const threads = new Map<string, SlackMessage[]>();

    for (const message of messages) {
      const threadId = message.thread_ts || message.timestamp;
      if (!threads.has(threadId)) {
        threads.set(threadId, []);
      }
      threads.get(threadId)!.push(message);
    }

    return Array.from(threads.values())
      .filter(thread => thread.length > 1) // Only return actual threads
      .map(thread => thread.sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
  }

  /**
   * Group messages by time window
   */
  private groupByTimeWindow(messages: SlackMessage[], windowMs: number): SlackMessage[][] {
    if (messages.length === 0) return [];

    // Sort by timestamp
    const sorted = [...messages].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const windows: SlackMessage[][] = [];
    let currentWindow: SlackMessage[] = [sorted[0]];
    let windowStart = parseFloat(sorted[0].timestamp) * 1000;

    for (let i = 1; i < sorted.length; i++) {
      const messageTime = parseFloat(sorted[i].timestamp) * 1000;
      
      if (messageTime - windowStart <= windowMs) {
        currentWindow.push(sorted[i]);
      } else {
        windows.push(currentWindow);
        currentWindow = [sorted[i]];
        windowStart = messageTime;
      }
    }

    if (currentWindow.length > 0) {
      windows.push(currentWindow);
    }

    return windows;
  }

  /**
   * Format a context group into readable text
   */
  private formatContext(context: SlackContext): string {
    const header = context.groupingMethod === 'thread' 
      ? '=== Thread Conversation ===' 
      : `=== Time Window (${(context.timeWindow || 0) / 60000} minutes) ===`;

    const messages = context.messages
      .map(m => `[${new Date(parseFloat(m.timestamp) * 1000).toISOString()}] ${m.user}: ${m.text}`)
      .join('\n');

    return `${header}\n${messages}`;
  }
}