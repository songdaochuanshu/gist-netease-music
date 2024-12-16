(async function () {
    try {
        /**
         * 获取用户播放记录
         */
        const recordResponse = await user_record({
            cookie: `MUSIC_U=${userToken}`,
            uid: userId,
            type: 1, // last week
        });

        if (!recordResponse.body || !Array.isArray(recordResponse.body.weekData)) {
            console.error('Invalid response from user_record API');
            return;
        }

        const { weekData } = recordResponse.body;

        // 日志输出原始数据
        console.log('Raw week data:', weekData);

        // 过滤掉 playCount 为 0 的项目
        const validWeekData = weekData.filter(data => data.playCount > 0);

        let totalPlayCount = 0;
        validWeekData.forEach(data => {
            totalPlayCount += data.playCount;
        });

        const icons = ['🥇', '🥈', '🥉', '', ''];

        /**
         * 构建歌曲/播放次数图表
         */
        const lines = validWeekData.slice(0, 5).map((data, index) => {
            const playCount = data.playCount;
            const artists = data.song.ar.map(a => a.name).join('/');
            const name = `${data.song.name} - ${artists}`;
            const icon = index < icons.length ? icons[index].padEnd(2) : '';

            return `${icon}${name} · ${playCount} plays`;
        }).join('\n');

        /**
         * 更新 Gist
         */
        const octokit = new Octokit({ auth: githubToken });
        const gist = await octokit.gists.get({ gist_id: gistId });
        const filename = Object.keys(gist.data.files)[0];

        await octokit.gists.update({
            gist_id: gistId,
            files: {
                [filename]: {
                    content: lines,
                },
            },
        });

        console.log('Gist updated successfully.');
    } catch (error) {
        console.error(`Error occurred: ${error.message}`); 