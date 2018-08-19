// Discord.js
const Discord = require('discord.js');
// 標準入力
const stdin = process.openStdin();

// token.template.js、settings.template.js から記入済みの token.js、settings.js を作成して下さい
const DiscordToken = require('./token.js');
const DiscordSettings = require('./settings.js');

const client = new Discord.Client();

// メンバーがゲームをプレイしているか判定します
function getPlayingGame(member) {
    let game = member.presence.game;
    if (game !== null) {
        if (game.applicationID in DiscordSettings.games)
            return [game.applicationID, DiscordSettings.games[game.applicationID]];
    }
    return [];
}

// メンバーの役職を更新します
function updateMember(member) {
    let [playingGame, playingRole] = getPlayingGame(member);
    let hasRole = member.roles.has(playingRole);

    // 役職なしでゲームを起動していたら
    if (!hasRole && playingGame !== undefined) {
        // 役職をつける
        member.addRole(playingRole);

        console.log("added role %s", member.displayName);
    }
    // 役職ありでゲームを起動していなかったら
    else if (hasRole && playingGame === undefined) {
        // 役職を外す
        member.removeRole(playingRole);

        console.log("removed role %s", member.displayName);
    }
}

// メンバーの役職を削除します
function removeRole(member) {
    for (let playingGame in DiscordSettings.games) {
        let playingRole = DiscordSettings.games[playingGame];
        let hasRole = member.roles.has(playingRole);

        // 役職あったら
        if (hasRole) {
            // 役職を外す
            member.removeRole(playingRole);

            console.log("removed role %s", member.displayName);
        }
    }
}

// 全員
function doAllMember(func) {
    for (let [serverid, server] of client.guilds) {
        if (DiscordSettings.servers.includes(serverid)) {
            for (let [memberid, member] of server.members) {
                func(member);
            }
        }
    }
}

// Bot準備
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    doAllMember((member) => {
        updateMember(member);
    })

    console.log('member update finished');
});

// RichPresenceが更新されたら役職を変更する
client.on('presence', (oldMember, newMember) => {
    updateMember(newMember);
});

// コンソールコマンド
stdin.addListener('data', (d) => {
    let input = d.toString().trim();
    if (input === 'clean') {
        console.log('cleaning role...');

        doAllMember((member) => {
            removeRole(member);
        });

        console.log('cleaning finished');
    }
});

// Bot開始
client.login(DiscordToken.token);
