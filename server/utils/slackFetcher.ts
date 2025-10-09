
interface SlackData {
  source: string;
  content: string;
}

interface SlackMessage {
  user: string;
  text: string;
  timestamp: string;
}

interface SlackResponse {
  messages: SlackMessage[];
  has_more: boolean;
  next_page?: number;
}

const SLACK_API_BASE = 'https://lev-boots-slack-api.jona-581.workers.dev';
const CHANNELS = ['lab-notes', 'engineering', 'offtopic'];
const RATE_LIMIT_DELAY = 1000; // 1 second delay between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds delay for retries

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        console.log(`Rate limited, waiting ${RETRY_DELAY}ms before retry...`);
        await sleep(RETRY_DELAY);
        return fetchWithRetry(url, retries - 1);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
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

async function fetchChannelMessages(channel: string): Promise<SlackMessage[]> {
  const allMessages: SlackMessage[] = [];
  let page = 1;
  let hasMore = true;

  console.log(`Fetching messages from Slack channel: ${channel}`);

  while (hasMore) {
    const url = `${SLACK_API_BASE}/?channel=${channel}&page=${page}`;
    console.log(`Fetching page ${page} from ${channel}...`);

    try {
      const response = await fetchWithRetry(url);
      const data: SlackResponse = await response.json();

      if (data.messages && data.messages.length > 0) {
        allMessages.push(...data.messages);
        console.log(`Fetched ${data.messages.length} messages from ${channel} page ${page}`);
      }

      hasMore = data.has_more;
      if (hasMore && data.next_page) {
        page = data.next_page;
      } else {
        page++;
      }

      // Rate limiting delay between requests
      if (hasMore) {
        await sleep(RATE_LIMIT_DELAY);
      }
    } catch (error) {
      console.error(`Error fetching ${channel} page ${page}:`, error);
      hasMore = false;
    }
  }

  console.log(`Total messages fetched from ${channel}: ${allMessages.length}`);
  return allMessages;
}

export const fetchSlackMessages = async (): Promise<SlackData[]> => {
  console.log('Fetching data from Slack channels...');
  const formattedData: SlackData[] = [];

  for (const channel of CHANNELS) {
    try {
      const messages = await fetchChannelMessages(channel);
      
      if (messages.length === 0) {
        console.log(`No messages found in channel: ${channel}`);
        continue;
      }

      // Group messages into chunks for better context
      const chunkSize = 10; // Group 10 messages together
      for (let i = 0; i < messages.length; i += chunkSize) {
        const chunk = messages.slice(i, Math.min(i + chunkSize, messages.length));
        
        const content = chunk
          .map(msg => `[${new Date(msg.timestamp).toISOString()}] ${msg.user}: ${msg.text}`)
          .join('\n\n');

        formattedData.push({
          source: `slack-${channel}`,
          content: `Channel: ${channel}\n\n${content}`
        });
      }
      
      // Rate limiting delay between channels
      if (CHANNELS.indexOf(channel) < CHANNELS.length - 1) {
        await sleep(RATE_LIMIT_DELAY);
      }
    } catch (error) {
      console.error(`Failed to fetch data from channel ${channel}:`, error);
    }
  }

  console.log(`Total Slack data chunks created: ${formattedData.length}`);
  return formattedData;
};
