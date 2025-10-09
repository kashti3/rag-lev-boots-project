
interface WebArticleData {
  source: string;
  content: string;
}

const ARTICLE_BASE_URL = 'https://gist.githubusercontent.com/JonaCodes/394d01021d1be03c9fe98cd9696f5cf3/raw/article-';
const ARTICLE_IDS = [
  'military-deployment-report',
  'urban-commuting',
  'hover-polo',
  'warehousing',
  'consumer-safety'
];

const RATE_LIMIT_DELAY = 500; // 500ms delay between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second delay for retries

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url);
    
    if (!response.ok && retries > 0) {
      if (response.status === 429 || response.status === 403) {
        console.log(`Rate limited or forbidden, waiting ${RETRY_DELAY}ms before retry...`);
        await sleep(RETRY_DELAY);
        return fetchWithRetry(url, retries - 1);
      }
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Request failed, retrying... (${retries} retries left)`);
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
}

async function fetchArticle(articleNumber: number, articleId: string): Promise<WebArticleData | null> {
  const url = `${ARTICLE_BASE_URL}${articleNumber}_${articleId}.md`;
  
  try {
    console.log(`Fetching article ${articleNumber}: ${articleId}...`);
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch article ${articleId}: HTTP ${response.status}`);
      return null;
    }
    
    const content = await response.text();
    console.log(`Successfully fetched article ${articleId} (${content.length} characters)`);
    
    return {
      source: `web-article-${articleId}`,
      content: content
    };
  } catch (error) {
    console.error(`Error fetching article ${articleId}:`, error);
    return null;
  }
}

export const fetchWebArticles = async (): Promise<WebArticleData[]> => {
  console.log('Fetching web articles from GitHub Gist...');
  const articles: WebArticleData[] = [];
  
  // Fetch articles sequentially with rate limiting
  for (let i = 0; i < ARTICLE_IDS.length; i++) {
    const articleId = ARTICLE_IDS[i];
    const article = await fetchArticle(i + 1, articleId);
    
    if (article) {
      articles.push(article);
    }
    
    // Add delay between requests (except for the last one)
    if (i < ARTICLE_IDS.length - 1) {
      await sleep(RATE_LIMIT_DELAY);
    }
  }
  
  console.log(`Successfully fetched ${articles.length} out of ${ARTICLE_IDS.length} articles`);
  return articles;
};
