let app = new Vue({
    el: '#game',

    data:{
        name: '', // name of players
        score: 0, // score of player
        highScore: 0, // high score of player
        size: 4, // 4x4 grid
        grid: [], // grid of cells
        gameLost: false, // if game is lost
        gameWon: false // if game is won
    },

    methods:{
        // creates board initially and adds 2 random cells
        init: function() {
            $('#name').hide();
            $('.score_list').hide();
            $('#grid_container').show();
            $('.list-group').empty();
            this.gameLost = false;
            this.gameWon = false;
            this.highScore = Math.max(this.highScore, this.score); // keeps high score from previous game
            this.score = 0;
            this.createBoard();
            for(let i = 0; i < 2; i++) {
                this.addRandomCell();
            }
        },

        // once player clicks view leaderboards
        viewLeaderboards: function(){
            $('#grid_container').hide();
            $('.score_list').show();
            return false;
        },

        // creates board with init values
        createBoard: function() {
            this.grid = [];
            for(let i = 0; i < this.size; i++){
                let row = [];
                for(let j = 0; j < this.size; j++){
                    row.push({
                        x: i,
                        y: j,
                        value: 0,
                        class: `cell-0`
                    });
                }
                this.grid.push(row);
            }
        },

        // adds random cell of 2
        addRandomCell: function () {
            let cell_value = 2;
            let random_cell = this.getRandomCell() || [];
            this.addCell({
                x: random_cell.x,
                y: random_cell.y,
                value: cell_value,
                class: `cell-${cell_value}`
            });
        },

        // gets random cell available position on grid
        getRandomCell: function() {
            let zero_values = [];
            for(let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if(this.grid[i][j].value === 0)
                        zero_values.push(this.grid[i][j]);
                }
            }
            if(zero_values.length > 0) {
                let random_index = Math.floor(Math.random() * zero_values.length);
                return zero_values[random_index];
            }
        },

        // adds random cell to specified position
        addCell: function(cell) {
            if(this.grid[cell.x])
                this.grid[cell.x].splice(cell.y, 1, cell);
            else
                return null;
        },

        // merges each row/col if adjacent cells are equal
        merge: function(row, gameCheck){
            let merged = [];
            let temp = [];
            row.forEach(cell => cell ? temp.push(cell) : null);
            for(let i = 0; i < temp.length; i++){
                if(temp[i+1] && temp[i] === temp[i+1]){
                    if(!gameCheck) // only update score on initial merge, not game check
                        this.updateScore(temp[i] + temp[i+1]);
                    merged.push(temp[i] + temp[i+1]);
                    i++;
                } else {
                    merged.push(temp[i]);
                }
            }

            // update rest of row with zeros if needed
            for(let i = 0; i < this.size; i++){
                if(i >= merged.length)
                    merged.push(0);
            }
            return merged;
        },

        // update score and high score
        updateScore: function (score){
            this.score += score;
            this.highScore = Math.max(this.highScore, this.score);
        },

        // return list of rows in grid
        getRows: function(){
            let rows = [];
            for(let i = 0; i < this.size; i++){
                let row = [];
                for(let j = 0; j < this.size; j++){
                    row.push(this.grid[i][j].value);
                }
                rows.push(row);
            }
            return rows;
        },

        // return list of cols in grid
        getColumns: function(){
            let columns = [];
            for(let i = 0; i < this.size; i++){
                let col = [];
                for(let j = 0; j < this.size; j++){
                    col.push(this.grid[j][i].value);
                }
                columns.push(col);
            }
            return columns;
        },

        // checks if player has lost the game
        isGameLost: function(){
            let rows = this.getRows();
            let cols = this.getColumns();
            let endGame = true;

            // checks if no rows can be merged
            rows.forEach(row => {
                let mergedRow = this.merge(row, true);
                for(let i = 0; i < row.length; i++){
                    if(row[i] !== mergedRow[i] || row[i] === 0) {
                        endGame = false;
                        break;
                    }
                }
            });

            // checks if no cols can be merged
            cols.forEach(col => {
                let mergedCol = this.merge(col, true);
                for(let i = 0; i < col.length; i++){
                    if(col[i] !== mergedCol[i] || col[i] === 0) {
                        endGame = false;
                        break;
                    }
                }
            });

            // if true, game is lost. add player and score to firebase
            if(endGame){
                setPlayer();
                getData();
            }
            this.gameLost = endGame;
        },

        // checks if game is won
        isGameWon: function(){
            this.grid.flat().forEach(cell => {
                if(cell.value === 2048) {
                    setPlayer();
                    getData();
                    this.gameWon = true;
                }
            });
        },

        // action once player moves left or right
        moveLeftOrRight: function(key){
            let hasMoved = false;
            this.grid.forEach(row => {
                let values = []
                let merged = [];

                switch(key){
                    case 'ArrowLeft': // merges row to left
                        values = row.map(cell => cell.value);
                        merged = this.merge(values, false);
                        for(let i = 0; i < values.length; i++){
                            if(values[i] !== merged[i])
                                hasMoved = true;
                        }
                        break;
                    case 'ArrowRight': // reverses row and merges to right
                        values = row.map(cell => cell.value).reverse();
                        merged = this.merge(values, false).reverse()
                        let i = 0;
                        let j = merged.length - 1;
                        while(i < values.length){
                            if(values[j] !== merged[i])
                                hasMoved = true;
                            i++;
                            j--;
                        }
                        break;
                    default:
                        throw 'Invalid Key';
                }

                // update values
                merged.forEach((cell, i) => {
                    row[i].value = cell;
                    cell ? row[i].class = `cell-${cell}` : row[i].class = 'cell-0';
                });
            });
            return hasMoved;
        },

        // action once player moves up or down
        moveUpOrDown: function(key) {
            let hasMoved = false;
            for (let i = 0; i < this.size; i++) {
                let values = [];
                for (let j = 0; j < this.size; j++) {
                    values.push(this.grid[j][i].value);
                }
                let merged = [];
                switch(key) {
                    case 'ArrowUp': // merges col up
                        merged = this.merge(values, false);
                        for (let i = 0; i < values.length; i++) {
                            if (values[i] !== merged[i])
                                hasMoved = true;
                        }
                        break;
                    case 'ArrowDown': // reverse col and merge down
                        merged = this.merge(values.reverse(), false);
                        for (let i = 0; i < values.length; i++) {
                            if (values[i] !== merged[i])
                                hasMoved = true;
                        }
                        merged = merged.reverse();
                        break;
                    default:
                        throw 'Invalid Key';
                }

                // update col values
                merged.forEach((cell, j) => {
                    this.grid[j][i].value = cell;
                    cell ? this.grid[j][i].class = `cell-${cell}` : this.grid[j][i].class = 'cell-0';
                });
            }
            return hasMoved;
        },

        // listener for key downs
        keyListener: function(e){
            switch(e.key) {
                case 'ArrowLeft':
                case 'ArrowRight':
                    if (this.moveLeftOrRight(e.key)) {
                        this.addRandomCell();
                        this.isGameLost();
                        this.isGameWon();
                    }
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                    if (this.moveUpOrDown(e.key)) {
                        this.addRandomCell();
                        this.isGameLost();
                        this.isGameWon();
                    }
                    break;
                default:
                    throw 'Invalid Key';
            }
        }
    }
});

// event listener for each key down by user
window.addEventListener('keydown', function(e) {
    if(!app.gameLost && !app.gameWon) // once game is over, player cannot move cells
        app.keyListener(e);
});
