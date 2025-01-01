require('dotenv').config();
const { Octokit } = require('@octokit/rest');
const { user_record } = require('NeteaseCloudMusicApi');

const {
  GIST_ID: gistId,
  GH_TOKEN: githubToken,
  USER_ID: userId,
  USER_TOKEN: userToken,
} = process.env;

if (!gistId || !githubToken || !userId || !userToken) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

async function getUserRecord() {
  try {
    const record = await user_record({
      cookie: `MUSIC_U=${userToken}`,
      uid: userId,
      type: 1, // last week
    });
    return record.body.weekData;
  } catch (error) {
    console.error(`Unable to get user record \n${error}`);
    throw error;
  }
}

function formatWeekData(weekData) {
  const icon = ['🥇', '🥈', '🥉', '', ''];
  return weekData.slice(0, 5).map((data, index) => {
    const playCount = data.playCount;
    const artists = data.song.ar.map(a => a.name).join('/');
    const name = `${data.song.name} - ${artists}`;
    return `${icon[index].padEnd(2)}${name} · ${playCount} plays`;
  }).join('\n');
}

async function updateGist(content) {
  try {
    const octokit = new Octokit({ auth: `token ${githubToken}` });
    const gist = await octokit.gists.get({ gist_id: gistId });
    const filename = Object.keys(gist.data.files)[0];
    await octokit.gists.update({
      gist_id: gistId,
      files: {
        [filename]: {
          filename: `🎵 My last week in music`,
          content: content,
        },
      },
    });
    console.log('Gist updated successfully.');
  } catch (error) {
    console.error(`Unable to update gist\n${error}`);
  }
}

(async () => {
  try {
    const weekData = await getUserRecord();
    const formattedData = formatWeekData(weekData);
    await updateGist(formattedData);
  } catch (error) {
    console.error('An error occurred during the process:', error);
  }
})();



