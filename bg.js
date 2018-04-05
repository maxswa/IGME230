let board = [];
let newBoard = [];
let score = [];
let roll = {
	doubles: false,
	total: 3,
	dice: [{value:1,taken:false},{value:2,taken:false}]
};
let activeChecker;
let turn;
let oldPos;
let checkerPos;
let allowDrag = false;
let stakes = 1;


window.onload = () => {
	score[1] = 0;
	score[2] = 0;
	setupDragging();
	document.querySelector("#start").addEventListener("click", startGame);
}

initBoard = () => {
	let tempBoard = [];

	for (let i = 1; i <= 24; i++) {
		tempBoard[i] = {player: 0, checkers: 0};
	}
	//This represents checkers on the bar:
	tempBoard[0] = {player1: 0, player2: 0};
	tempBoard[1] = {player: 2, checkers: 2};
	tempBoard[6] = {player: 1, checkers: 5};
	tempBoard[8] = {player: 1, checkers: 3};
	tempBoard[12] = {player: 2, checkers: 5};
	tempBoard[13] = {player: 1, checkers: 5};
	tempBoard[17] = {player: 2, checkers: 3};
	tempBoard[19] = {player: 2, checkers: 5};
	tempBoard[24] = {player: 1, checkers: 2};
	//This represents scored checkers:
	tempBoard[25] = {player1: 0, player2: 0};


	return tempBoard;
}

setupDragging = () => {
	document.onmousemove = (e) => {
		e.preventDefault();

		if(activeChecker) {
			activeChecker.style.position = "absolute";
			activeChecker.style.left = (e.pageX - activeChecker.clientWidth/2) + "px";
			activeChecker.style.top = (e.pageY - activeChecker.clientHeight/2) + "px";
		}
	}
	document.onmouseup = (e) => {
		e.preventDefault();
		if (activeChecker) {
			activeChecker.parentElement.removeChild(activeChecker);
			let underMouse = document.elementsFromPoint(e.pageX, e.pageY);
			let bearOff = canBearOff(turn);
			let newPoint;

			for (let element of underMouse) {
				if(element.classList.contains("point") || element.classList.contains("playerZone")) {
					newPoint = element;
				}
			}

			if(newPoint) {
				if (bearOff && availableMoves(turn, checkerPos).includes(parseInt(newPoint.getAttribute("number"))) && (newPoint.getAttribute("number") == 0 || newPoint.getAttribute("number") == 25)) {
					let scoreZone = document.querySelector("#p" + turn + "Zone");
					newBoard[checkerPos].checkers--;
					if (newBoard[checkerPos].checkers == 0) {
						newBoard[checkerPos].player = 0;
					}
					turn == 1 ? newBoard[25].player1++ : newBoard[25].player2++;

					for (let die of roll.dice) {
						if(turn == 1) {
							if(die.value >= (checkerPos - newPoint.getAttribute("number")) && !die.taken) {
								die.taken = true;
								break;
							}
						}
						else {
							if(die.value >= (newPoint.getAttribute("number") - checkerPos) && !die.taken) {
								die.taken = true;
								break;
							}
						}
					}
				}
				else if (newPoint && availableMoves(turn, checkerPos).includes(parseInt(newPoint.getAttribute("number")))) {
					let barCheckers = turn == 1 ? newBoard[0].player1 : newBoard[0].player2;
					let turnPoint = turn == 1 ? 25 : 0;
					if(barCheckers > 0 && checkerPos != turnPoint) {
						//TODO Change this to an on-screen warning:
						console.log("You must get your checkers off the bar first!");
					}
					else {
						if(checkerPos == 0 || checkerPos == 25) {
							turn == 1 ? newBoard[0].player1-- : newBoard[0].player2--;
						}
						else {
							newBoard[checkerPos].checkers--;
							if (newBoard[checkerPos].checkers == 0) {
								newBoard[checkerPos].player = 0;
							}
						}
						if (newBoard[newPoint.getAttribute("number")].player == 0 || newBoard[newPoint.getAttribute("number")].player == turn) {
							newBoard[newPoint.getAttribute("number")].checkers++;
						}
						else {
							turn == 1 ? newBoard[0].player2++ : newBoard[0].player1++;
						}
						newBoard[newPoint.getAttribute("number")].player = turn;
						for (let die of roll.dice) {
							if(turn == 1) {
								if(die.value == (checkerPos - newPoint.getAttribute("number")) && !die.taken) {
									die.taken = true;
									break;
								}
							}
							else {
								if(die.value == (newPoint.getAttribute("number") - checkerPos) && !die.taken) {
									die.taken = true;
									break;
								}
							}
						}
					}
				}
			}

			let diceImages = document.querySelectorAll(".die");
			for (let i = 0; i < roll.dice.length; i++) {
				if(roll.dice[i].taken) {
					for(let die of diceImages) {
						if(die.getAttribute("number") == i) {
							die.style.opacity = "0.5";
						}
					}
					if(!document.querySelector("#undo")) {
						let nav = document.querySelector("#buttonArea");
						let undoBut = document.createElement("button");
						undoBut.id = "undo";
						undoBut.appendChild(document.createTextNode("Undo"));
						nav.appendChild(undoBut);
						undoBut.addEventListener("click", undoMoves);
					}
				}
			}

			let done = true;
			for (let die of roll.dice) {
				if(!die.taken) {
					done = false;
				}
			}
			renderCheckers(newBoard);

			if(newBoard[25].player1 == 15) {
				endGame(1, false);
			}
			else if (newBoard[25].player2 == 15) {
				endGame(2, false);
			}
			else if(done || !canMove(turn)) {
				endMove(true);
			}

			activeChecker = null;
			clearHighlights();
		}
	}
}

renderCheckers = (layout) => {
	doMousedown = (e) => {
		e.preventDefault();
		if (allowDrag) {
			if(e.target.parentElement === document.querySelector("#bar")) {
				if(turn == e.target.getAttribute("player")) {
					activeChecker = e.target;
					oldPos = activeChecker.parentElement;
					let coords = activeChecker.getBoundingClientRect();
					turn == 1 ? checkerPos = 25 : checkerPos = 0;
					activeChecker.parentElement.removeChild(activeChecker);
					activeChecker = newChecker(turn);
					activeChecker.className = "activeChecker";
					activeChecker.style.left = coords.left + "px";
					activeChecker.style.top = coords.top + "px";
					document.body.appendChild(activeChecker);
					highlightMoves(availableMoves(turn, checkerPos));
				}
			}
			else if(newBoard[parseInt(e.target.parentElement.getAttribute("number"))].player == turn){
				activeChecker = e.target;
				oldPos = activeChecker.parentElement;
				let coords = activeChecker.getBoundingClientRect();
				checkerPos = parseInt(activeChecker.parentElement.getAttribute("number"));
				activeChecker.parentElement.removeChild(activeChecker);
				activeChecker = newChecker(turn);
				activeChecker.className = "activeChecker";
				activeChecker.style.left = coords.left + "px";
				activeChecker.style.top = coords.top + "px";
				document.body.appendChild(activeChecker);
				highlightMoves(availableMoves(turn, checkerPos));
			}
		}
	}

	clearBoard();

	let points = document.querySelectorAll(".point");

	for (let point of points) {
		let lastChecker = null;
		for (let i = 0; i < layout[point.getAttribute("number")].checkers; i++) {
			let checker = newChecker(layout[point.getAttribute("number")].player);

			if (point.getAttribute("number") > 12) {
				checker.style.width = (100 + (i*1.5)) + "%";
				point.appendChild(checker);
			}
			else {
				checker.style.bottom = i*20 + "%";
				checker.style.width = (100 - (i*1.5)) + "%";
				if (lastChecker) {
					point.insertBefore(checker, lastChecker);
				}
				else {
					point.appendChild(checker);
				}
				lastChecker = checker;
			}
		}
	}

	for (let i = 0; i < layout[0].player1; i++) {
		document.querySelector("#bar").appendChild(newChecker(1));
	}
	for (let i = 0; i < layout[0].player2; i++) {
		document.querySelector("#bar").appendChild(newChecker(2));
	}

	for (let i = 0; i < layout[25].player1; i++) {
		let check = newChecker(1);
		check.className = "scoredChecker";
		document.querySelector("#p1Zone").appendChild(check);
	}
	for (let i = 0; i < layout[25].player2; i++) {
		let check = newChecker(2);
		check.className = "scoredChecker";
		document.querySelector("#p2Zone").appendChild(check);
	}

	let allCheckers = document.querySelectorAll(".checker");
	for(let checker of allCheckers) {
		checker.addEventListener("mousedown", doMousedown);
	}
}

startGame = () => {
	let nav = document.querySelector("#buttonArea");
	nav.removeChild(document.querySelector("#start"));

	board = initBoard();
	renderCheckers(board);
	turn = 2;
	stakes = 1;
	newTurn();
}

endGame = (player, pass) => {
	if(!pass) {
		if(player == 1) {
			let backGammon = false;
			for (let i = 1; i < 7; i++) {
				if(newBoard[i].player == 2) {
					backGammon = true;
				}
			}
			if(newBoard[0].player2 > 0) {
				backGammon = true;
			}

			if(backGammon) {
				stakes *= 3;
			}
			else if(newBoard[25].player2 == 0) {
				stakes *= 2;
			}
		}
		else {
			let backGammon = false;
			for (let i = 19; i < 25; i++) {
				if(newBoard[i].player == 1) {
					backGammon = true;
				}
			}
			if(newBoard[0].player1 > 0) {
				backGammon = true;
			}

			if(backGammon) {
				stakes *= 3;
			}
			else if(newBoard[25].player1 == 0) {
				stakes *= 2;
			}
		}
	} 
	score[player] += stakes;
	clearBoard();
	document.querySelector("#player" + player + " .score").textContent = score[player];

	let curPlayer = document.querySelectorAll(".currentPlayer");
	for (let element of curPlayer) {
		element.classList.remove("currentPlayer");
	}

	let nav = document.querySelector("#buttonArea");
	while (nav.firstChild) {
		nav.removeChild(nav.firstChild);
	}

	let startBut = document.createElement("button");
	startBut.id = "start";
	startBut.appendChild(document.createTextNode("Start Game"));
	nav.appendChild(startBut);
	startBut.addEventListener("click", startGame);
}

otherPlayer = (player) => player == 1 ? 2 : 1; 

newTurn = () => {
	turn == 1 ? turn = 2 : turn = 1;

	let curPlayer = document.querySelector("#player" + turn);
	curPlayer.classList.add("currentPlayer");

	let nav = document.querySelector("#buttonArea");
	let rollBut = document.createElement("button");
	let dubBut = document.createElement("button");

	rollBut.id = "roll";
	rollBut.appendChild(document.createTextNode("Roll Dice"));
	dubBut.id = "double";
	dubBut.appendChild(document.createTextNode("Double"));

	nav.appendChild(rollBut);
	nav.appendChild(dubBut);

	rollBut.addEventListener("click", rollDice);
	dubBut.addEventListener("click", proposeDouble);
}

proposeDouble = () => {
	let other = (turn == 1) ? 2 : 1;
	let curPlayer = document.querySelector(".currentPlayer");
	curPlayer.classList.remove("currentPlayer");
	curPlayer = document.querySelector("#player" + other);
	curPlayer.classList.add("currentPlayer");

	let nav = document.querySelector("#buttonArea");
	let takeBut = document.createElement("button");
	let passBut = document.createElement("button");

	while (nav.firstChild) {
		nav.removeChild(nav.firstChild);
	}

	takeBut.id = "take";
	takeBut.appendChild(document.createTextNode("Take"));
	passBut.id = "pass";
	passBut.appendChild(document.createTextNode("Pass"));

	nav.appendChild(takeBut);
	nav.appendChild(passBut);

	takeBut.addEventListener("click", doubleStakes);
	passBut.addEventListener("click", passDouble);
}

doubleStakes = () => {
	let curPlayer = document.querySelector(".currentPlayer");
	curPlayer.classList.remove("currentPlayer");
	curPlayer = document.querySelector("#player" + turn);
	curPlayer.classList.add("currentPlayer");

	let nav = document.querySelector("#buttonArea");
	let rollBut = document.createElement("button");
	let dubBut = document.createElement("button");

	stakes *= 2;
	while (nav.firstChild) {
		nav.removeChild(nav.firstChild);
	}

	rollBut.id = "roll";
	rollBut.appendChild(document.createTextNode("Roll Dice"));
	nav.appendChild(rollBut);
	rollBut.addEventListener("click", rollDice);
}

passDouble = () => {
	let nav = document.querySelector("#buttonArea");
	while (nav.firstChild) {
		nav.removeChild(nav.firstChild);
	}

	endGame(turn, true);
}

endMove = (move) => {
	allowDrag = false;
	let nav = document.querySelector("#buttonArea");

	let finishBut = document.createElement("button");
	finishBut.id = "finish";
	finishBut.appendChild(document.createTextNode("Finish Turn"));


	if(move && !document.querySelector("#undo")) {
		let undoBut = document.createElement("button");
		undoBut.id = "undo";
		undoBut.appendChild(document.createTextNode("Undo"));
		nav.appendChild(finishBut);
		nav.appendChild(undoBut);
		undoBut.addEventListener("click", undoMoves);
	}
	else {
		nav.appendChild(finishBut);
	}
	

	finishBut.addEventListener("click", finishTurn);
}

finishTurn = () => {
	let nav = document.querySelector("#buttonArea");
	let curPlayer = document.querySelector("#player" + turn);
	curPlayer.classList.remove("currentPlayer");

	board = cloneBoard(newBoard);
	nav.removeChild(document.querySelector("#finish"));
	if(document.querySelector("#undo")) {
		nav.removeChild(document.querySelector("#undo"));
	}
	nav.removeChild(document.querySelector("#diceArea"));

	newTurn();
}

undoMoves = () => {
	let nav = document.querySelector("#buttonArea");
	let diceImages = document.querySelectorAll(".die");
	newBoard = cloneBoard(board);
	renderCheckers(board);
	allowDrag = true;

	for (let die of diceImages) {
		die.style.opacity = "1";
	}

	for (let die of roll.dice) {
		die.taken = false;
	}

	if(document.querySelector("#finish")) {
		nav.removeChild(document.querySelector("#finish"));
	}
	nav.removeChild(document.querySelector("#undo"));
}

rollDice = () => {
	let nav = document.querySelector("#buttonArea");
	newBoard = cloneBoard(board);
	allowDrag = true;

	if (roll.doubles) {
		roll.dice.pop();
		roll.dice.pop();
	}

	roll.dice[0].value = Math.floor(Math.random() * 6) + 1;
	roll.dice[1].value = Math.floor(Math.random() * 6) + 1;

	if(roll.dice[0].value == roll.dice[1].value) {
		roll.doubles = true;
		roll.dice.push({value: roll.dice[0].value});
		roll.dice.push({value: roll.dice[0].value});
	}
	else {
		roll.doubles = false;
		//This code is partly from https://stackoverflow.com/a/1129270
		roll.dice.sort((a, b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0));
	}

	let diceArea = document.createElement("div");
	diceArea.id = "diceArea";

	roll.total = 0;
	for (let i = 0; i < roll.dice.length; i++) {
		roll.dice[i].taken = false;
		roll.total += roll.dice[i].value;
		let newDie = document.createElement("img");
		newDie.src = "images/dice/" + turn + "/" + roll.dice[i].value + ".png";
		newDie.className = "die";
		newDie.setAttribute("number", i);
		diceArea.appendChild(newDie);
	}

	nav.appendChild(diceArea);
	nav.removeChild(document.querySelector("#roll"));
	if(document.querySelector("#double")) {
		nav.removeChild(document.querySelector("#double"));
	}

	if(!canMove(turn)) {
		endMove(false);
	}
}

cloneBoard = (original) => {
	let copy = [];
	for (let i = 0; i < original.length; i++) {
		copy[i] = Object.assign({}, original[i]);
	}
	return copy;
}

highlightMoves = (moves) => {
	let points = document.querySelectorAll(".point");
	let scoreZones =  document.querySelectorAll(".playerZone");

	if(turn == 1) {
		if(newBoard[0].player1 > 0) {
			for (let point of points) {
				for (let move of moves) {
					if(point.getAttribute("number") == move && point.getAttribute("number") > 18 && oldPos == document.querySelector("#bar")) {
						point.classList.add("highlighted");
					}
				}
			}
		}
		else {
			for (let point of points) {
				for (let move of moves) {
					if(point.getAttribute("number") == move) {
						point.classList.add("highlighted");
					}
				}
			}
			for (let zone of scoreZones) {
				for (let move of moves) {
					if(zone.getAttribute("number") == move) {
						zone.classList.add("highlighted");
					}
				}
			}
		}
	}
	else {
		if(newBoard[0].player2 > 0) {
			for (let point of points) {
				for (let move of moves) {
					if(point.getAttribute("number") == move && point.getAttribute("number") < 7 && oldPos == document.querySelector("#bar")) {
						point.classList.add("highlighted");
					}
				}
			}
		}
		else{
			for (let point of points) {
				for (let move of moves) {
					if(point.getAttribute("number") == move) {
						point.classList.add("highlighted");
					}
				}
			}
			for (let zone of scoreZones) {
				for (let move of moves) {
					if(zone.getAttribute("number") == move) {
						zone.classList.add("highlighted");
					}
				}
			}
		}
	}
}

clearHighlights = () => {
	let points = document.querySelectorAll(".point");
	let scoreZones =  document.querySelectorAll(".playerZone");

	for (let point of points) {
		point.classList.remove("highlighted");
	}
	for (let zone of scoreZones) {
		zone.classList.remove("highlighted");
	}
}

clearBoard = () => {
	let points = document.querySelectorAll(".point");
	let bar = document.querySelector("#bar");
	let p1Zone = document.querySelector("#p1Zone");
	let p2Zone = document.querySelector("#p2Zone");

	for (let point of points) {
		while (point.firstChild) {
			point.removeChild(point.firstChild);
		}
	}

	while (bar.firstChild) {
		bar.removeChild(bar.firstChild);
	}
	while (p1Zone.firstChild) {
		p1Zone.removeChild(p1Zone.firstChild);
	}
	while (p2Zone.firstChild) {
		p2Zone.removeChild(p2Zone.firstChild);
	}
}

newChecker = (player) => {
	let checker = document.createElement("img");
	checker.src = "images/checkers/" + player + ".png";
	checker.className = "checker";
	checker.setAttribute("player", player);

	return checker;
}

canBearOff = (player) => {
	let bearOff = true;

	if (player == 1) {
		if(newBoard[0].player1 != 0) {
			bearOff = false;
		}
		for(let i = 7; i <= 24; i++) {
			if(newBoard[i].player == 1) {
				bearOff = false;
			}
		}
	}
	else {
		if(newBoard[0].player2 != 0) {
			bearOff = false;
		}
		for(let i = 18; i > 0; i--) {
			if(newBoard[i].player == 2) {
				bearOff = false;
			}
		}
	}

	return bearOff;
}

canMove = (player) => {
	let result = false;

	if (player == 1) {
		if(newBoard[0].player1 > 0) {
			if(availableMoves(player, 25).length > 0) {
				result = true;
			}
		} 
		else {
			for (let i = 1; i <= 24; i++) {
				if (newBoard[i].player == player) {
					if(availableMoves(player, i).length != 0) {
						result = true;
					}
				}
			}
		}
	}
	else {
		if(newBoard[0].player2 > 0) {
			if(availableMoves(player, 0).length > 0) {
				result = true;
			}
		}
		else {
			for (let i = 1; i <= 24; i++) {
				if (newBoard[i].player == player) {
					if(availableMoves(player, i).length != 0) {
						result = true;
					}
				}
			}
		}
	}

	return result;
}

availableMoves = (player, checkerLoc) => {
	let moves = [];
	let bearOff = canBearOff(player);

	if(player == 1) {
		if (checkerLoc == 0) {
			for (let i = 0; i < roll.dice.length; i++) {
				if(!roll.dice[i].taken && (checkerLoc - roll.dice[i].value) > 0) {
					if(validMove(player, (25 - roll.dice[i].value))) {
						moves.push(25 - roll.dice[i].value);
					}
				}
			}
		}
		else {
			for (let i = 0; i < roll.dice.length; i++) {
				if(!roll.dice[i].taken) {
					if ((checkerLoc - roll.dice[i].value) > 0) {
						if(validMove(player, (checkerLoc - roll.dice[i].value))) {
							moves.push(checkerLoc - roll.dice[i].value);
						}
					}
					else if ((checkerLoc - roll.dice[i].value) == 0 && bearOff) {
						moves.push(0);
					}
					else if ((checkerLoc - roll.dice[i].value) <= 0 && bearOff && checkerLoc == furthestChecker(player)) {
						moves.push(0);
					}
				}
			}
		}
	}
	else {
		for (let i = 0; i < roll.dice.length; i++) {
			if(!roll.dice[i].taken) {
				if ((checkerLoc + roll.dice[i].value) <= 24) {
					if(validMove(player, (checkerLoc + roll.dice[i].value))) {
						moves.push(checkerLoc + roll.dice[i].value);
					}
				}
				else if ((checkerLoc + roll.dice[i].value) == 25 && bearOff) {
					moves.push(25);
				}
				else if ((checkerLoc + roll.dice[i].value) >= 25 && bearOff && checkerLoc == furthestChecker(player)) {
					moves.push(25);
				}
			}
		}
	}

	return moves;
}

furthestChecker = (player) => {
	if (player == 1) {
		for(let i = 24; i > 0; i--) {
			if(newBoard[i].player == player) {
				return i;
			}
		}
	}
	else {
		for(let i = 0; i <= 24; i++) {
			if(newBoard[i].player == player) {
				return i;
			}
		}
	}
}

validMove = (player, point) => {
	return (board[point].player == player || board[point].player == 0) ? true : (board[point].checkers == 1) ? true : false;
}