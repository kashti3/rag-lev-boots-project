import { askGemini } from '../services/llmService';
import { GATEKEEPER_CONFIG } from '../config/constants';
import { GatekeeperResult, GatekeeperEvaluation, BaseGatekeeper as IGatekeeper, SourceType } from './types';

export abstract class BaseGatekeeper implements IGatekeeper {
  protected abstract sourceType: SourceType;
  protected abstract prompt: string;

  async evaluate(content: string): Promise<GatekeeperResult> {
    try {
      const threshold = GATEKEEPER_CONFIG.thresholds[this.sourceType];
      
      // Skip evaluation for empty content
      if (!content || content.trim().length === 0) {
        return {
          isInformative: false,
          score: 0,
          reason: 'Empty content',
          processedContent: '',
          metadata: {
            originalLength: 0,
            processedLength: 0
          }
        };
      }

      // Get evaluation from LLM
      const systemPrompt = this.prompt.replace('{content}', content);
      const userPrompt = 'Evaluate the content and respond with a JSON object containing score (0-10), reason, and keepContent (boolean).';
      
      const response = await askGemini(GATEKEEPER_CONFIG.model, systemPrompt, userPrompt);
      
      // Parse LLM response
      let evaluation: GatekeeperEvaluation;
      try {
        // Extract JSON from response (LLM might add extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          evaluation = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse gatekeeper response:', parseError);
        // Default to keeping content if parsing fails
        evaluation = {
          score: threshold,
          reason: 'Failed to parse evaluation, defaulting to keep',
          keepContent: true
        };
      }

      // Determine if content should be kept
      const isInformative = evaluation.score >= threshold;

      // Log rejection if enabled
      if (GATEKEEPER_CONFIG.enableRejectionLogging && !isInformative) {
        console.log(`[Gatekeeper] Rejected ${this.sourceType} content:`, {
          score: evaluation.score,
          threshold,
          reason: evaluation.reason,
          contentPreview: content.substring(0, 100) + '...'
        });
      }

      return {
        isInformative,
        score: evaluation.score,
        reason: evaluation.reason,
        processedContent: isInformative ? content : '',
        metadata: {
          originalLength: content.length,
          processedLength: isInformative ? content.length : 0,
          rejectedParts: isInformative ? [] : [content]
        }
      };
    } catch (error) {
      console.error(`Gatekeeper error for ${this.sourceType}:`, error);
      // On error, default to keeping content
      return {
        isInformative: true,
        score: GATEKEEPER_CONFIG.thresholds[this.sourceType],
        reason: 'Error during evaluation, defaulting to keep',
        processedContent: content,
        metadata: {
          originalLength: content.length,
          processedLength: content.length
        }
      };
    }
  }

  getSourceType(): string {
    return this.sourceType;
  }
}