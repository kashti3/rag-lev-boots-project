import { BaseGatekeeper } from './BaseGatekeeper';
import { SourceType } from './types';

export class WebArticleGatekeeper extends BaseGatekeeper {
  protected sourceType: SourceType = 'web-article';
  
  protected prompt = `You are evaluating content from a web article about Levitation Boots. Filter out web navigation and ads while keeping article content.

Content to evaluate:
"""
{content}
"""

Rate this content from 0-10:
- 0-2: Navigation menus, cookie notices, social media buttons, ads, footers, "Subscribe" prompts
- 3-4: Website metadata, author bios, related article links, comments sections
- 5-6: Brief mentions, supporting content, image captions, pull quotes
- 7-10: Main article content, technical information, analysis, interviews, product descriptions

Important: Web articles are curated sources about Levitation Boots, so be inclusive of actual article content while filtering out typical web page cruft.

Look for:
- Article body text about levitation boots
- Technical specifications or descriptions
- Quotes from experts or users
- Analysis or opinion pieces
- Historical information
- Product reviews or comparisons

Respond in JSON format: {"score": X, "reason": "brief explanation", "keepContent": true/false}`;
}