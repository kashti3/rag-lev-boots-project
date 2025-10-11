
interface SlackData {
  source: string;
  content: string;
}

interface SlackMessage {
  id: string;
  channel: string;
  user: string;
  role: string;
  ts: string;
  text: string;
  thread_ts: string;
}

interface SlackResponse {
  channel: string;
  page: number;
  limit: number;
  total: number;
  items: SlackMessage[];
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
  let totalPages = 1;

  console.log(`Fetching messages from Slack channel: ${channel}`);

  while (page <= totalPages) {
    const url = `${SLACK_API_BASE}/?channel=${channel}&page=${page}`;
    console.log(`Fetching page ${page} from ${channel}...`);

    try {
      const response = await fetchWithRetry(url);
      const data: SlackResponse = await response.json();

      if (data.items && data.items.length > 0) {
        allMessages.push(...data.items);
        console.log(`Fetched ${data.items.length} messages from ${channel} page ${page}`);
      }

      // Calculate total pages based on total messages and limit
      if (page === 1) {
        totalPages = Math.ceil(data.total / data.limit);
        console.log(`Total pages to fetch: ${totalPages} (${data.total} messages total)`);
      }

      page++;

      // Rate limiting delay between requests
      if (page <= totalPages) {
        await sleep(RATE_LIMIT_DELAY);
      }
    } catch (error) {
      console.error(`Error fetching ${channel} page ${page}:`, error);
      break; // Exit loop on error
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

      // Return all messages as JSON for the gatekeeper to process with hybrid approach
      formattedData.push({
        source: `slack-${channel}`,
        content: JSON.stringify(messages)
      });
      
      console.log(`Fetched ${messages.length} messages from ${channel}`);
      
      // Rate limiting delay between channels
      if (CHANNELS.indexOf(channel) < CHANNELS.length - 1) {
        await sleep(RATE_LIMIT_DELAY);
      }
    } catch (error) {
      console.error(`Failed to fetch data from channel ${channel}:`, error);
    }
  }

  console.log(`Total Slack channels fetched: ${formattedData.length}`);
  return formattedData;
};
