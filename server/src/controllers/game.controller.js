import * as games from '../services/game.service.js';

export const create = async (req, res) => res.status(201).json({ success: true, game: await games.createGame(req.user.id, req.body.difficulty) });
export const active = async (req, res) => res.json({ success: true, game: await games.activeGame(req.user.id) });
export const get = async (req, res) => res.json({ success: true, game: await games.getGame(req.user.id, req.params.gameId) });
export const save = async (req, res) => res.json({ success: true, game: await games.saveGame(req.user.id, req.params.gameId, req.body.currentBoard, req.body.elapsedSeconds) });
export const move = async (req, res) => res.json({ success: true, ...await games.makeMove(req.user.id, req.params.gameId, req.body.row, req.body.col, req.body.value) });
export const hint = async (req, res) => res.json({ success: true, ...await games.giveHint(req.user.id, req.params.gameId) });
export const abandon = async (req, res) => res.json({ success: true, game: await games.abandonGame(req.user.id, req.params.gameId) });
export const complete = async (req, res) => res.json({ success: true, ...await games.completeGame(req.user.id, req.params.gameId) });
export const history = async (req, res) => res.json({ success: true, ...await games.gameHistory(req.user.id, req.query) });
