const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

let initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3002, () => {
      console.log("Server is running at http://localhost:3002");
    });
  } catch (e) {
    console.log(`db error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//get players list api-1

app.get("/players/", async (request, response) => {
  try {
    const getPlayersQuery = `SELECT * FROM player_details ORDER BY player_id;`;

    const playersArray = await db.all(getPlayersQuery);

    response.send(
      playersArray.map((eachItem) => convertDbObjectToResponseObject(eachItem))
    );
  } catch (e) {
    console.log(`error at ${e.message}`);
  }
});

//get player api-2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;

  const player = await db.get(getPlayerQuery);
  response.send({
    playerId: player.player_id,
    playerName: player.player_name,
  });
});

// put player api-3

app.put("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const playerDetails = request.body;
    const { playerName } = playerDetails;
    const updatePlayerQuery = `UPDATE player_details SET
        player_name = '${playerName}'`;

    await db.run(updatePlayerQuery);
    response.send("Player Details Updated");
  } catch (e) {
    console.log(`error from put${e.message}`);
  }
});

//get api-4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;

  const match = await db.get(getMatchQuery);
  response.send({
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  });
});

//api-5

function convertItTOResponse(eachMatch) {
  return {
    matchId: eachMatch.match_id,
    match: eachMatch.match,
    year: eachMatch.year,
  };
}

app.get("/players/:playerId/matches", async (request, response) => {
  try {
    const { playerId } = request.params;

    const getMatchDetails = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id = ${playerId};`;

    const matches = await db.all(getMatchDetails);
    response.send(matches.map((eachItem) => convertItTOResponse(eachItem)));
  } catch (e) {
    console.log(`error at api-5 :${e.message}`);
  }
});

// api-6

function convertItTOPlayerResponse(eachMatch) {
  return {
    playerId: eachMatch.player_id,
    playerName: eachMatch.player_name,
  };
}

// /matches/:matchId/players'

app.get("/matches/:matchId/players/", async (request, response) => {
  try {
    const { matchId } = request.params;

    const getPlayerDetails = `
    SELECT
	      player_details.player_id AS playerId,
	      player_name AS playerName
	    FROM player_details INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id
        WHERE match_id=${matchId};`;

    const players = await db.all(getPlayerDetails);
    response.send(players);
  } catch (e) {
    console.log(`error at api-5 :${e.message}`);
  }
});

//api-7

// /players/:playerId/playerScores/

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreDetailsQuery = ` SELECT

    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes

     FROM 

    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id

    WHERE player_details.player_id = ${playerId};`;
  const playerScore = await db.get(getPlayerScoreDetailsQuery);
  response.send(playerScore);
});

module.exports = app;
