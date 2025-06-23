type PR = {
  title: string;
  closed: boolean;
  merged: boolean;
  base: string;
  merge_commit_sha: string;
}; 

type ApiError = {
  status: number;
  rateLimitRemaining: number | null;
};
type ApiResult<T> = T | ApiError;

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const result = await chrome.storage.sync.get("github_token");
    const token = result.github_token;
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
  } catch (e) {
    console.error("Could not get token from storage", e);
  }
  return {};
}

export async function getPRDetails(pr: string): Promise<ApiResult<PR>> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://api.github.com/repos/nixos/nixpkgs/pulls/${pr}`,
    { headers }
  );

  if (!response.ok) {
    const rateLimitRemainingHeader = response.headers.get('x-ratelimit-remaining');
    return { 
        status: response.status, 
        rateLimitRemaining: rateLimitRemainingHeader ? parseInt(rateLimitRemainingHeader) : null
    };
  }

  const data = await response.json();

  return {
    title: data.title,
    closed: data.state === "closed" && !data.merged_at,
    merged: data.merged_at !== null,
    base: data.base?.ref,
    merge_commit_sha: data.merge_commit_sha,
  };
}

export async function isCommitInBranch(
  branch: string,
  commit: string
): Promise<ApiResult<boolean>> {
  const headers = await getAuthHeaders();
  const url = `https://api.github.com/repos/nixos/nixpkgs/compare/${branch}...${commit}`;
  const response = await fetch(url, { headers });
  
  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    const rateLimitRemainingHeader = response.headers.get('x-ratelimit-remaining');
    return { 
        status: response.status, 
        rateLimitRemaining: rateLimitRemainingHeader ? parseInt(rateLimitRemainingHeader) : null
    };
  }

  const data = await response.json();
  if (data.status === "identical" || data.status === "behind") {
    return true;
  }
  return false;
} 