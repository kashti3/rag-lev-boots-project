
interface WebArticleData {
  source: string;
  content: string;
}

export const fetchWebArticles = async (): Promise<WebArticleData[]> => {
  console.log('Fetching data from web articles... (Not implemented yet)');
  return Promise.resolve([]);
};
