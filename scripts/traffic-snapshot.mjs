import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readData } from './validate.mjs';

const exec = promisify(execFile);
const { site } = readData();
const repo = new URL(site.repository).pathname.slice(1);
const endpoints = {
  repository: `repos/${repo}`,
  views: `repos/${repo}/traffic/views`,
  clones: `repos/${repo}/traffic/clones`,
  referrers: `repos/${repo}/traffic/popular/referrers`,
  paths: `repos/${repo}/traffic/popular/paths`,
};

const datasets = await Promise.all(Object.entries(endpoints).map(async ([key, endpoint]) => {
  try {
    const { stdout } = await exec('gh', ['api', endpoint], { timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
    const value = JSON.parse(stdout);
    const data = key === 'repository' ? {
      stars: value.stargazers_count,
      forks: value.forks_count,
      default_branch: value.default_branch,
      updated_at: value.updated_at,
    } : value;
    return [key, { status: 'available', data }];
  } catch {
    // Do not copy CLI stderr, credentials, or environment details into reports.
    return [key, { status: 'unavailable', data: null, reason: 'GitHub CLI, access, response, or network check failed.' }];
  }
}));

console.log(JSON.stringify({
  observed_at: new Date().toISOString(),
  repository: site.repository,
  note: 'Rolling-window observations; overlapping snapshots must not be summed. Unavailable is not zero.',
  datasets: Object.fromEntries(datasets),
}, null, 2));
