import { BaseGatekeeper } from './BaseGatekeeper';
import { SourceType } from './types';

export class PdfGatekeeper extends BaseGatekeeper {
  protected sourceType: SourceType = 'pdf';
  
  protected prompt = `You are evaluating content from a PDF document about Levitation Boots technology. Be very inclusive - only filter out truly useless content.

Content to evaluate:
"""
{content}
"""

Rate this content from 0-10:
- 0-2: Completely blank, only formatting marks, or pure legal boilerplate with no informational value
- 3-5: Basic metadata, page numbers, headers, or transitional text with minimal information
- 6-10: Any actual content about levitation boots, technical specs, narratives, discussions, or any substantive text

Important: PDFs are curated sources. Be very lenient and keep most content unless it's clearly useless (like blank pages or pure formatting).

Respond in JSON format: {"score": X, "reason": "brief explanation", "keepContent": true/false}`
}