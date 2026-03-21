import axios from 'axios';

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const REPO_OWNER = 'gedyzed';
const REPO_NAME = 'web-crawler-scraper';

export async function getGitHubStars(): Promise<number> {
    try {
        const response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        return response.data.stargazers_count;
    } catch (error) {
        console.error('Error fetching GitHub stars:', error);
        return 0; // Fallback to 0 if fetch fails
    }
}
