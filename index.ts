import type { MatchResponseData, VersusMatch as MatchInfo } from "./types"
import fs from "node:fs/promises"
import {stringify} from "yaml"
import { $ } from "bun"

const matchId = process.argv[2]

const url = `https://mcsrranked.com/api/matches/${matchId}`

const data = await fetch(url)
const json: MatchResponseData = await data.json()

const player1 = json.data.players[0]
const player2 = json.data.players[1]

const playerNicknameMap = {
    [player1.uuid]: player1.nickname,
    [player2.uuid]: player2.nickname,
}

const importantEvents = [
    "story.enter_the_nether",
    "nether.find_bastion",
    "nether.find_fortress",
    "projectelo.timeline.blind_travel",
    "story.follow_ender_eye",
    "story.enter_the_end",
]

const eventHumanReadableMap: Record<typeof importantEvents[number], string> = {
    "story.enter_the_nether": "Enter Nether",
    "nether.find_bastion": "Find Bastion",
    "nether.find_fortress": "Find Fortress",
    "projectelo.timeline.blind_travel": "Blind",
    "story.follow_ender_eye": "Follow Ender Eye",
    "story.enter_the_end": "Enter End",
};

const splits = new Map<string,Record<string, string>>([
    [player1.uuid, {}],
    [player2.uuid, {}],
])

const convertMs = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

let completionTime = -1;

for(const completion of json.data.completions) {
    completionTime = completion.time;

    splits.set(completion.uuid,
        {
            ...splits.get(completion.uuid)!,
            "Completion": convertMs(completion.time)
        }
    )
}

for(const event of json.data.timelines) {
    if(!importantEvents.includes(event.type)) {
        continue
    } 

    splits.set(event.uuid,
        {
            ...splits.get(event.uuid)!,
            [eventHumanReadableMap[event.type]]: convertMs(event.time)
        }
    )
}

const versusUrl = `https://mcsrranked.com/api/users/${player1.uuid}/versus/${player2.uuid}/matches`
const versusData = await fetch(versusUrl)
const versusJson: {
    status: "success",
    data: MatchInfo[]
} = await versusData.json()

const matches: { winner: string, time: string }[] = []


for(const match of versusJson.data.slice(0,5)) {
    matches.push({
        winner: playerNicknameMap[match.result.uuid],
        time: convertMs(match.result.time)
    })
}

const matchesFormatted = matches
    .map(({winner, time}) => `${winner.toUpperCase()} ${time}`)
    .join("\n")

const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const date = new Date(json.data.date * 1000);

const fileDateFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false // Use 24-hour format
}).format(date).replace(/[/:,\s]/g, '-');


const outputData = {
    date: formatter.format(date),
    players: {
        [player1.nickname.toUpperCase()]: {
            elo: player1.eloRate,
            leaderboard: player1.eloRank,
            formatted: `#${player1.eloRank} – ${player1.eloRate}`
        },
        [player2.nickname.toUpperCase()]: {
            elo: player2.eloRate,
            leaderboard: player2.eloRank,
            formatted: `#${player2.eloRank} – ${player2.eloRate}`
        },
    },
    splits: {
        named: {
            [player1.nickname.toUpperCase()]: splits.get(player1.uuid),
            [player2.nickname.toUpperCase()]: splits.get(player2.uuid),
        },
        flat: {
            [player1.nickname.toUpperCase()]: Object.values(splits.get(player1.uuid)!).join("\n"),
            [player2.nickname.toUpperCase()]: Object.values(splits.get(player2.uuid)!).join("\n"),
        }
    },
    matches,
    matchesFormatted
}

const player1Vod = json.data.vod.find(({uuid}) => uuid === player1.uuid)!
const player2Vod = json.data.vod.find(({uuid}) => uuid === player2.uuid)!

const getTwitchTime = (vodTime: number) => {
    const endTime = json.data.date - vodTime
    const startTime = endTime - (completionTime / 1000)

    return `${
        convertMs((startTime - 30) * 1000)
    }-${
        convertMs((endTime + 30) * 1000)
    }` // 10-24 seconde leeway
}

const outputString = stringify(outputData)

const dirName = `${player1.nickname}-${player2.nickname}-${fileDateFormat}`
console.log(dirName)

fs.mkdir(dirName, { recursive: true })

await fs.writeFile(
    `${dirName}/info.yaml`, 
    outputString
)

console.log(`bunx twitch-dlp ${player1Vod.url} --download-sections "*${getTwitchTime(player1Vod.startsAt)}" -o ${dirName}/${player1.nickname}.mp4`)
console.log(`bunx twitch-dlp ${player2Vod.url} --download-sections "*${getTwitchTime(player2Vod.startsAt)}" -o ${dirName}/${player2.nickname}.mp4`)

await Promise.all([
  $`bunx twitch-dlp ${player1Vod.url} --download-sections "*${getTwitchTime(player1Vod.startsAt)}" -o ${dirName}/${player1.nickname}.mp4`,
  $`bunx twitch-dlp ${player2Vod.url} --download-sections "*${getTwitchTime(player2Vod.startsAt)}" -o ${dirName}/${player2.nickname}.mp4`
]);
