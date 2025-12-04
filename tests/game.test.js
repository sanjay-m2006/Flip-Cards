/**
 * Basic DOM test to verify startGame produces correct card counts per difficulty.
 * Uses jest with jsdom environment.
 */

/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

describe('difficulty board sizes', () => {
	let documentBody;
	beforeEach(() => {
		document.documentElement.innerHTML = html;
		// load the script under test
		const scriptPath = path.resolve(__dirname, '..', 'js', 'game.js');
		// Clear require cache
		delete require.cache[require.resolve(scriptPath)];
		require(scriptPath);
	});

	test('easy creates 8 cards', () => {
		document.getElementById('difficulty').value = 'easy';
		document.getElementById('numPlayers').value = '2';
		document.getElementById('startGame').click();
		const cards = document.querySelectorAll('#gameBoard .card');
		expect(cards.length).toBe(8);
	});

	test('medium creates 16 cards', () => {
		document.getElementById('difficulty').value = 'medium';
		document.getElementById('numPlayers').value = '2';
		document.getElementById('startGame').click();
		const cards = document.querySelectorAll('#gameBoard .card');
		expect(cards.length).toBe(16);
	});

	test('hard creates 24 cards', () => {
		document.getElementById('difficulty').value = 'hard';
		document.getElementById('numPlayers').value = '2';
		document.getElementById('startGame').click();
		const cards = document.querySelectorAll('#gameBoard .card');
		expect(cards.length).toBe(24);
	});
});