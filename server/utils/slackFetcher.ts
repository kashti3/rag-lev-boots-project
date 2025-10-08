
interface SlackData {
  source: string;
  content: string;
}

export const fetchSlackMessages = async (): Promise<SlackData[]> => {
  console.log('Fetching data from Slack... (Not implemented yet)');
  return Promise.resolve([]);
};
