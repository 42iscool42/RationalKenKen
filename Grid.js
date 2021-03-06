/** A grid object keeps track of the state of the board and is capable of
 * validating the player's entries.
 *
 * @param size The size of the grid
 */
function Grid(size) {
	if (size <= 1) {
		throw new Error("Grid size must be at least 2");
	}
	this.size = size;
	this.fractions = this.createFractions();
	this.cells = this.createSquareArray(size);

	this.table = document.createElement("table");
	for (let i = 0; i < size; i++) {
		let row = document.createElement("tr");
		for (let j = 0; j < size; j++) {
			let cell = new Cell();
			this.cells[j][i] = cell;
			row.appendChild(cell.element);
		}
		this.table.appendChild(row);
	}

	let groupsGood = false;
	let groupPoints = this.makeGroups();
	while (!areGroupsGood(groupPoints, this.fractions)) {
		groupPoints = this.makeGroups();
	}

	this.groups = [];

	for (let i = 0; i < groupPoints.length; i++) {
		this.groups[i] = new Group(groupPoints[i], this.fractions, this.cells);
	}
}

/** Returns the HTML representation of the grid
 */
Grid.prototype.getElement= function() {
	return this.table;
}

/** Checks to see if the fractions entered by the user into the HTML
 * representation are valid.  If a cell is invalid, it will be highlighted red.
 * Returns true if the board has the correct answers filled in and false 
 * otherwise
 *
 * @return True if all the entered fractions are correct and false otherwise.
 */
Grid.prototype.validate = function() {
	let gridValid = true;
	// Check columns
	for (let i = 0; i < this.size; i++) {
		let seenNums = new Array();
		let seenDenoms = new Array();
		for (let j = 0; j < this.size; j++) {
			this.cells[i][j].clearValidity();

			let currFrac = this.cells[i][j].getFraction();

			let num = currFrac.numerator;
			let denom = currFrac.denominator;

			let numIndex = seenNums.indexOf(num);
			let denomIndex = seenDenoms.indexOf(denom);

			if (numIndex != -1) {
				this.cells[i][numIndex].invalidNumerator();
				this.cells[i][j].invalidNumerator();
				gridValid = false;

			} else if (num < 1 || num > this.size) {
				this.cells[i][j].invalidNumerator();
				gridValid = false;
			}

			if (denomIndex != -1) {
				this.cells[i][denomIndex].invalidDenominator();
				this.cells[i][j].invalidDenominator();
				gridValid = false;

			} else if (denom < 1 || denom > this.size) {
				this.cells[i][j].invalidDenominator();
				gridValid = false;
			}

			seenNums.push(num);
			seenDenoms.push(denom);
		}
	}

	// Check rows
	for (let i = 0; i < this.size; i++) {
		let seenNums = new Array();
		let seenDenoms = new Array();
		for (let j = 0; j < this.size; j++) {
			let currFrac = this.cells[j][i].getFraction();
			
			let currNum = currFrac.numerator;
			let currDenom = currFrac.denominator;

			let numIndex = seenNums.indexOf(currNum);
			let denomIndex = seenDenoms.indexOf(currDenom);

			if (numIndex != -1) {
				this.cells[numIndex][i].invalidNumerator();
				this.cells[j][i].invalidNumerator();
				gridValid = false;
			}

			if (denomIndex != -1) {
				this.cells[denomIndex][i].invalidDenominator();
				this.cells[j][i].invalidDenominator();
				gridValid = false;
			}

			seenNums.push(currNum);
			seenDenoms.push(currDenom);
		}
	}

	for (let i = 0; i < this.groups.length; i++) {
		let groupValid = this.groups[i].validate();
		gridValid = gridValid && groupValid;
	}

	return gridValid;
}

/** Creates the fractions that will be used as a basis for the goals of the 
 * sections of the grids.
 * @modifies this
 */
Grid.prototype.createFractions = function() {
	let numerators = this.createSquareArray(this.size);
	let denominators = this.createSquareArray(this.size);

	for (let i = 0; i < this.size; i++) {
		for (let j = 0; j < this.size; j++) {
			numerators[i][j] = ((i + j) % this.size) + 1;
			denominators[i][j] = ((i + j) % this.size) + 1;
		}
	}

	this.shuffle2d(numerators);
	this.shuffle2d(denominators);

	let fractions = new Array(this.size);
	for (let i = 0; i < this.size; i++) {
		fractions[i] = new Array(this.size);
		for (let j = 0; j < this.size; j++) {
			fractions[i][j] = new Fraction(numerators[i][j], denominators[i][j]);
		}
	}

	return fractions;
}

/** Shuffles the rows and columns of a 2d array
 * @param array The array to be shuffled
 * @modifies array
 */
Grid.prototype.shuffle2d = function(array) {
	let size = array.length;
	// Shuffle the horizontal lines
	for (let i = size; i > 0; i--) {
		let a = Math.floor(Math.random() * i);
		let tmp = array[a];
		array[a] = array[i - 1];
		array[i - 1] = tmp;
	}

	// Shuffle the vertical lines
	for (let i = size; i > 0; i--) {
		let a = Math.floor(Math.random() * i);
		for (let j = 0; j < size; j++) {
			let tmp = array[j][a];
			array[j][a] = array[j][i - 1];
			array[j][i - 1] = tmp;
		}
	}
}

/** Shuffles array
 * @param array The array to be shuffled
 */
Grid.prototype.shuffle1d = function(array) {
	let size = array.length;
	for (let i = size; i > 0; i--) {
		let a = Math.floor(Math.random() * i);
		let tmp = array[a];
		array[a] = array[i - 1];
		array[i - 1] = tmp;
	}
}

/** Randomly creates the groups for the grid and returns an array of arrays of
 * points where the points in each sub array represent the cells that belong to
 * that group.  The groups are guaranteed to be contiguous and cover the entire
 * board.
 *
 * @return An array of arrays of points where each subarray represents the points
 *         in that group.
 */
Grid.prototype.makeGroups = function() {
	let maxGroupSize = 3;
	let groups = new Array();
	let firstGroup = new Array();
	for (let i = 0; i < this.size; i++) {
		for (let j = 0; j < this.size; j++) {
			firstGroup.push([i, j]);
		}
	}
	this.shuffle1d(firstGroup);
	groups.push(firstGroup);
	let finishedGroups = new Array();

	while (groups.length > 0) {
		let nextGroup = groups.pop();

		let aLoc = Math.floor(Math.random() * nextGroup.length);
		let nucleusA = nextGroup.splice(aLoc, 1)[0];
		let groupA = new Array();
		groupA.push(nucleusA)

		let bLoc = Math.floor(Math.random() * nextGroup.length);
		let nucleusB = nextGroup.splice(bLoc, 1)[0];
		let groupB = new Array();
		groupB.push(nucleusB);

		while (nextGroup.length > 0) {
			let nextPoint = nextGroup.pop();
			let adjacentA = this.isAdjacent(groupA, nextPoint);
			let adjacentB = this.isAdjacent(groupB, nextPoint);

			if (adjacentA && adjacentB) {
				if (Math.random() < .5) {
					groupA.push(nextPoint);
				} else {
					groupB.push(nextPoint);
				}
			} else if (adjacentA) {
				groupA.push(nextPoint);
			} else if (adjacentB) {
				groupB.push(nextPoint);
			} else {
				nextGroup.unshift(nextPoint);
			}
		}

		if (groupA.length <= maxGroupSize) {
			finishedGroups.push(groupA);
		} else {
			groups.push(groupA);
		}

		if (groupB.length <= maxGroupSize) {
			finishedGroups.push(groupB)
		} else {
			groups.push(groupB);
		}
	}

	return finishedGroups;
}

/** Given an array of points gridGroup, returns true if point is adjacent to any
 * point in that array.
 *
 * @param gridGroup and array of points
 * @param point A point (an array of an x and y coodinate)
 * @returns true if point is adjacent to any point in gridGroup
 */
Grid.prototype.isAdjacent = function(gridGroup, point) {
	for (let i = 0; i < gridGroup.length; i++) {
		let currPoint = gridGroup[i];
		if ((Math.abs(currPoint[0] - point[0]) === 1 && currPoint[1] - point[1] === 0) || 
			(Math.abs(currPoint[1] - point[1]) === 1 && currPoint[0] - point[0] === 0)) {
			return true;
		}
	}

	return false;
}

/** Creates an empty square array of size size.
 * @param size the size of the array
 * @return A square array of size size by size
 */
Grid.prototype.createSquareArray = function(size) {
	let array = new Array(size);
	for (let i = 0; i < size; i++) {
		array[i] = new Array(size);
	}

	return array;
}

/** Removes any entries that have been put in the cells in the html
 * representation of this board.
 */
Grid.prototype.clear = function() {
	for (let i = 0; i < this.size; i++) {
		for (let j = 0; j < this.size; j++) {
			this.cells[i][j].clear();
		}
	}
}

/**
 * Checks that there there is only one solution for the provided groups
 * @param groups Array of groups of points
 * @param fractions Assignment of fractions to the grid
 * @return True if these groups have a unique assignment and false otherwise
 */
function areGroupsGood(groups, fractions) {
	for (let i = 0; i < groups.length - 1; i++) {
		for (let j = i + 1; j < groups.length; j++) {
			if (canCommute(groups[i], groups[j], fractions)) {
				return false;
			}
		}
	}

	return true;
}

/**
 * Checks to see if between two groups there is the possibility to rearrange the
 * contents and still have a valid solution
 * @param group1 The first group of points
 * @param group2 The second group of points
 * @param fractions The assignment of fractions to the grid
 */
function canCommute(group1, group2, fractions) {
	let group1XOverlap = [];
	let group2XOverlap = [];
	let group1YOverlap = [];
	let group2YOverlap = [];

	for (let i = 0; i < group1.length; i++) {
		for (let j = 0; j < group2.length; j++) {
			if (group1[i][0] === group2[j][0]) {
				if (group1XOverlap.findIndex(createPointFinder(group1[i])) === -1) {
					group1XOverlap.push(group1[i]);
				}

				if (group2XOverlap.findIndex(createPointFinder(group2[j])) === -1) {
					group2XOverlap.push(group2[j]);	
				}
			}

			if (group1[i][1] === group2[j][1]) {
				if (group1YOverlap.findIndex(createPointFinder(group1[i])) === -1) {
					group1YOverlap.push(group1[i]);
				}

				if (group2YOverlap.findIndex(createPointFinder(group2[j])) === -1) {
					group2YOverlap.push(group2[j]);
				}
			}
		}
	}

	return checkSubsetsOverlap(group1XOverlap, group2XOverlap, fractions) ||
			checkSubsetsOverlap(group1YOverlap, group2YOverlap, fractions);
}

/**
 * Checks whether all subsets of group1 when paired with any subset of group2 are
 * able to commute within the group. Technically this check is stronger than needed
 * but it seems to work I guess.
 * @param group1 The first group of points
 * @param group2 The second group of points
 * @param fractions The assignment of fractions to the grid
 * @return true if some subsets overlap and false otherwise
 */
function checkSubsetsOverlap(group1, group2, fractions) {
	let minSize = Math.min(group1.length, group2.length);
	for (let size = 2; size <= minSize; size++) {
		let group1Sets = createSubsets(group1, size);
		let group2Sets = createSubsets(group2, size);

		for (let i = 0; i < group1Sets.length; i++) {
			for (let j = 0; j < group2Sets.length; j++) {
				if (setsEqual(group1Sets[i], group2Sets[j], fractions)) {
					return true;
				}
			}
		}
	}

	return false;
}

/**
 * Creates all subsets of size size of the array of points
 * @param points The input points
 * @param size Size of the subsets to create
 * @return An array containing all subsets of size size.
 */
function createSubsets(points, size) {
	let sets = [];
	let currentContents = [0];

	while (currentContents.length > 0) {
		if (currentContents.length == size) {
			let newSet = [];
			for (let i = 0; i < size; i++) {
				newSet.push(points[currentContents[i]]);
			}
			sets.push(newSet);

			let j = size - 1;
			for (; j >= 0 && currentContents[j] == points.length - size + j; j--) {
				currentContents.pop();
			}

			if (j >= 0) {
				currentContents[j] += 1;
			}
		} else {
			const lastPoint = currentContents[currentContents.length - 1];
			currentContents.push(lastPoint + 1);
		}
	}

	return sets;
}

/**
 * Brute force checks that the two sets of points contain the same fractions. The
 * brute force here is ok because the sets are pretty much always going to be 
 * smaller than 4.
 * @param set1 The first set
 * @param set2 The second set
 * @param fractions The assignment of fractions to the grid
 * @return true if the sets contain the same fractions and false otherwise
 */
function setsEqual(set1, set2, fractions) {
	for (let i = 0; i < set1.length; i++) {
		let curr1Frac = fractions[set1[i][0]][set1[i][1]];
		let found = false;
		for (let j = 0; j < set2.length; j++) {
			let curr2Frac = fractions[set2[j][0]][set2[j][1]];
			if (curr1Frac.equals(curr2Frac)) {
				found = true;
			}
		}

		if (!found) {
			return false;
		}
	}

	return true;
}

/**
 * Creates a function that returns true if the parameter equals the passed in
 * point.  Used for array containment since comparison doesn't seem to work for
 * arrays
 */
function createPointFinder(point) {
	return function(element) {
		return element[0] === point[0] && element[1] === point[1];
	}
}