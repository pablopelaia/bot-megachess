define([], function () {
    return {
        movePiece: function (board, turn) {
            /*
            Look for the movement that will be sent to the server.
            Call 'divideByColor' to divide the board by colors.
            Call 'assingColors' to divide your own pieces and those of your opponents by color.
            It will also look for the opponent's attack moves.
            Call 'searchBestMove' to get the starting and ending square of the move.
            Call 'changeForRowAndCol' to get the corresponding rows and columns from both squares.
        
            Parameters: board(str) turn(str)
        
            return: coordinates of the move(JSON)
            */

            printBoard(board);

            const colors = divideByColor(board);

            const chess = assingColors(
                board,
                colors.piecesBlacks,
                colors.piecesWhites,
                turn
            );

            let move = searchBestMove(
                board,
                chess.movedOponent,
                chess.myPieces,
                chess.oponentPieces,
                turn
            );

            return changeForRowAndCol(move);
        }
    }
})

function printBoard(board) {

    const line = '--------------------------------------'
    let print = ''
    console.log(line)
    print = ''

    for (let i = 0; i < board.length; i++) {
        print += board[i]
        if (i % 16 == 15) {
            console.log(print)
            print = ''
        }
    }
    console.log(line)
}

function divideByColor(board) {

    /*
    Go through the board and divide by colors, return a JSON with these two arrangements obtained.

    Parameter: board(str)

    return: black and white pieces(JSON)
    */

    let piecesBlacks = []
    let piecesWhites = []

    for (let i = 0; i < board.length; i++) {
        if (board[i] != ' ')
            board[i] === board[i].toUpperCase() ? piecesWhites.push(i) : piecesBlacks.push(i)
    }

    return { piecesBlacks, piecesWhites }
}

function assingColors(board, piecesBlacks, piecesWhites, turn) {

    /*
    According to the turn, it assigns his own pieces and rival pieces the corresponding color.
    Call 'searchMoves' in charge of  look for possible opponent's moves.
    Map the array of rival pieces and call 'searchMoves' to get the possible moves on the next turn.
    
    Parameters: board(str) blacksr (array) whites (array) turn(str)

    return: own pieces, rival pieces and possible opponent's moves (JSON)
    */

    let myPieces = []
    let oponentPieces = []
    let movedOponent = []
    let anotherTurn

    if (turn == 'B') {
        anotherTurn = 'W'
        myPieces = piecesBlacks
        oponentPieces = piecesWhites
    } else {
        anotherTurn = 'B'
        myPieces = piecesWhites
        oponentPieces = piecesBlacks
    }

    oponentPieces.map(op =>
        movedOponent.concat(
            searchMoves(
                movedOponent,
                oponentPieces,
                myPieces,
                board[op].toUpperCase(),
                op,
                anotherTurn
            )
        )
    )

    return { myPieces, oponentPieces, movedOponent }
}

function searchMoves(moved, pieces, piecesAnotherTurn, piece, square, turn) {

    /*
    Identify the piece and call the functions in charge of looking for its possible movements.

    Parameters: board(str) pieces color of turn(array) pices another color (array) piece(str)
    current square(int) turn(str)

    return: possible piece movements(array)
    */

    switch (piece) {
        case 'K':
            return movementKing(moved, pieces, square)

        case 'P':
            return movementPawn(moved, pieces, piecesAnotherTurn, square, turn)

        case 'H':
            return movementHorse(moved, pieces, square)

        case 'B':
            return diagonals(moved, pieces, piecesAnotherTurn, square)

        case 'R':
            return verticalAndHorizontal(moved, pieces, piecesAnotherTurn, square)

        case 'Q':
            let newMoved = diagonals(moved, pieces, piecesAnotherTurn, square)
            newMoved = newMoved.concat(
                verticalAndHorizontal(moved, pieces, piecesAnotherTurn, square)
            )

            return newMoved
    }
}

function movementKing(moved, pieces, square) {

    /*
    The eight possible moves of a king are assigned, they are added by group.
    'checkMargin' is called, a function that verifies that the movement is within the lateral margins.
    Filter: non-repeated movements, not occupied by the same color and within horizontal margins.

    Parameters: possible piece movements(array) board(str) pieces color of turn(array)
    pices another color(array) piece(str) current square(int) turn(str)

    return: possible piece movements(array)
    */

    let possible = [square - 16, square + 16]

    if (checkMargin(square, -1)) possible.concat(square - 17, square - 1, square + 15)

    if (checkMargin(square, 1)) possible.concat(square - 15, square + 1, square + 17)

    possible = possible.filter(p =>
        (checkOnBoard(p) && !moved.includes(p) && !pieces.includes(p))
    )

    return possible
}

function movementPawn(moved, pieces, piecesAnotherTurn, square, turn) {

    /*
    The color of the pawn is identified and a JSON;
    JSON is assigned with the four possible moves of a pawn.
    It is verified that the movements are valid when assigning them in the JSON.
    It is verified that the pawn can advance one or two steps (if applicable).
    It is vedified that the pawn can eat diagonally.
    'CheckOnBoard' and 'checkMargin' are called to verify that the moves do not leave the board.
    Filter: non-repeated movements.

    Parameter: possible piece movements(array) pieces color of turn(array) square(int) turn(str)

    return: possible piece movements(array)
    */

    let possible = {}
    let newMoved = []

    if (turn == 'W') {
        possible = {
            single: square - 16,
            double: square > 176 ? square - 32 : 256,
            eatLeft: checkMargin(square, -17) ? square - 17 : 256,
            eatRight: checkMargin(square, -15) ? square - 15 : 256
        }
    } else {
        possible = {
            single: square + 16,
            double: square < 64 ? square + 32 : 256,
            eatLeft: checkMargin(square, 17) ? square + 17 : 256,
            eatRight: checkMargin(square, 15) ? square + 15 : 256
        }
    }

    if (!pieces.includes(possible.single)) {

        newMoved.push(possible.single)

        if (pieces.includes(possible.double)) newMoved.push(possible.double)
    }

    if (piecesAnotherTurn.includes(possible.eatLeft)) newMoved.push(possible.eatLeft)

    if (piecesAnotherTurn.includes(possible.eatRight)) newMoved.push(possible.eatRight)

    return newMoved.filter(n => checkOnBoard(n) && !moved.includes(n))
}

function movementHorse(moved, pieces, square) {

    /*
    Start with the eight possible movements of a horse divided into four groups,
    according to how many squares it moves to the right or left
    'CheckMargin' is called to verify that the movements are within the lateral margins.
    Filter: non-repeated movements, not occupied by the same color and within horizontal margins.

    Parameter: possible piece movements(array) square(int) turn(str)

    return: possible piece movements(array)
    */

    let possible = []

    if (checkMargin(square, -1)) possible.concat(square - 33, square + 31)
    if (checkMargin(square, -2)) possible.concat(square - 18, square + 14)
    if (checkMargin(square, 2)) possible.concat(square - 14, square + 18)
    if (checkMargin(square, 1)) possible.concat(square - 31, square + 33)

    possible = possible.filter(p =>
        (!pieces.includes(p) && checkOnBoard(p) && !moved.includes(p))
    )

    return possible
}

function diagonals(moved, pieces, piecesAnotherTurn, square) {

    /*
    Function that works for both bishops and queens, looks for the diagonal movements of the piece
    Take the piece as the center and analyze the four possible directions.
    Call 'nextStep' to search the different segments with different parameters

    Parameter: possible piece movements(array)  pieces color of turn(array)
    pices another color(array) square(int)

    return: possible piece movements(array)
    */

    let possible = []

    possible.concat(
        nextStep(moved, square, pieces, piecesAnotherTurn, -17)
    )

    possible.concat(
        nextStep(moved, square, pieces, piecesAnotherTurn, -15)
    )

    possible.concat(
        nextStep(moved, square, pieces, piecesAnotherTurn, 15)
    )

    possible.concat(
        nextStep(moved, square, pieces, piecesAnotherTurn, 17)
    )

    return possible
}

function verticalAndHorizontal(moved, pieces, piecesAnotherTurn, square) {

    /*
    Function that works for both towers and queens,
    looking for the horizontal and vertical movements of the piece.
    Take the piece as the center and analyze the four possible directions.
    Call 'nextStep' to search the different segments with different parameters

    Parameter: possible piece movements(array) pieces color of turn(array)
    pices another color(array) square(int)

    return: possible piece movements(array)
    */

    let possible = []

    possible.concat(
        nextStep(moved, square, pieces, piecesAnotherTurn, -16)
    )

    possible.concat(
        nextStep(moved, square, pieces, piecesAnotherTurn, -1)
    )

    possible.concat(
        nextStep(moved, square, pieces, piecesAnotherTurn, 16)
    )

    possible.concat(
        nextStep(moved, square, pieces, piecesAnotherTurn, 1)
    )

    return possible
}

function nextStep(moved, movement, pieces, piecesAnotherTurn, step) {

    /*
    Function that looks for movements in a given direction.
    It goes through a segment in the same direction as long as it stays inside the board.
    Use the 'checkOnBoard' and 'checkMargin' functions to ensure that moves are within the board.
    Filtered: non-repeated movement and squares not occupied by the same color.
    If there is a rival piece on the destination square, the move is added but the segment is cut.

    Parameter: possible piece movements(array) square with movement(int)
    pieces color of turn(array) pices another color(array) segment direction(int)

    return: possible piece movements(array)
    */

    let possible = []
    let toContinue = (checkMargin(movement, step))
    let move = movement + step

    while (toContinue && checkOnBoard(movement)) {

        if (pieces.includes(movement)) {
            toContinue = false

        } else {

            if (!moved.includes(movement)) possible.push(movement)

            toContinue = (!piecesAnotherTurn.includes(movement) && checkMargin(movement, step))
        }

        move = move + step
    }

    return possible
}

function checkOnBoard(square) {

    return (square < 256 && square > (-1))
}

function checkMargin(square, step) {

    switch (step) {
        case -17, -1, 15:
            return square % 16 > 0

        case -2:
            return square % 16 > 1

        case 2:
            return square % 16 < 14

        case -15, 1, 17:
            return square % 16 < 15
    }
}

function searchBestMove(board, movedOponent, pieces, piecesAnotherTurn, turn) {

    /*
    'bestMove', 'pieceToMove' and 'moveTowards' are instantiated 
    The array of proper pieces is mapped and three functions are called:
    'searchPoint' to find the score of each piece
    'searchMoves' to search for their possible moves.
    'selectMove' to find the most appropriate movement

    Parameters: board(str) moves of rival pieces(array) pieces color of turn(array)
    pices another color(array) turn(str)

    return: initial square and destination square(JSON)
    */

    let bestMove = -20
    let pieceToMove = 0
    let moveTowards = 0

    pieces.map(p => {
        let pointPiece = searchPoint(board[p].toUpperCase())

        let movements = searchMoves(
            [],
            pieces,
            piecesAnotherTurn,
            board[p].toUpperCase(),
            p,
            turn
        )

        let move = selectMove(
            bestMove,
            board,
            movements,
            movedOponent,
            moveTowards,
            piecesAnotherTurn,
            pieceToMove,
            pointPiece,
            p,
            turn
        )

        pieceToMove = move.pieceToMove
        moveTowards = move.moveTowards
        bestMove = move.bestMove
    })

    console.log(
        'mi moviemiento:',
        board[pieceToMove],
        'de',
        pieceToMove,
        'a',
        moveTowards
    )

    return { pieceToMove, moveTowards }
}

function searchPoint(piece) {

    /*
    Find the score corresponding to the piece.

    Parameter: piece(str)

    return: score(int)
    */

    switch (piece) {
        case 'K':
            return 100

        case 'P':
            return 10

        case 'H':
            return 30

        case 'B':
            return 40

        case 'R':
            return 60

        case 'Q':
            return 5
    }
}


function selectMove(
    bestMove,
    board,
    movements,
    movedOponent,
    moveTowards,
    piecesAnotherTurn,
    pieceToMove,
    pointPiece,
    square,
    turn
) {

    /*
    Search among the possible movements which is the best option
    Call 'canICapture' to see if I could eat the rival piece.
    If the piece is a pawn, call 'crowned' to check if it can be promoted.
    It is verified if the piece can be eaten in the next movement.
    For each move we compare the 'bestMove' with the score obtained,
    If the score is higher, it is replaced along with 'pieceToMove' and 'moveTowards'.
    
    Parameters: bestMove(int) board(str) possible piece movements(array)
    moves of rival pieces(array) destination square(int) pices another color(array)
    initial square(int) score(int) square(int) turn(str)
    
    return: JSON: best move, initial square and destination square(JSON)
    */

    movements.map(move => {
        let partialPoints = pointPiece
        let pieceValue = pointPiece

        partialPoints = canICapture(board, move, partialPoints, piecesAnotherTurn)

        if (board[square] == 'P' && crowned(move, turn)) {
            partialPoints = 50
            pieceValue = 5
        }

        if (movedOponent.includes(move)) partialPoints = partialPoints - pieceValue * 10

        if (partialPoints > bestMove) {
            bestMove = partialPoints
            pieceToMove = square
            moveTowards = move
        }
    })

    return { bestMove, pieceToMove, moveTowards }
}

function canICapture(board, move, partialPoints, piecesAnotherTurn) {

    /*
    Comprueba si hay una pieza rival en la casilla del movimiento dado,
    de ser así, se busca el puntaje de la pieza para reasignar valor al puntaje,
    de lo contrario se devuelve el mismo valor recibido

    Parámetros: board(str) movement(int) partial score(int) pices another color(array)

    return: partial score(int)
    */

    if (piecesAnotherTurn.includes(move)) return searchPoint(board[move].toUpperCase()) * 10

    return partialPoints

}

function crowned(move, color) {

    /*
    Checks if the received pawn can be crowned on the given move.

    Parameter: movement(int) color(str)

    return: boolean
    */

    if (color == 'W' && move > 127 && move < 144) return true

    if (color == 'P' && move > 111 && move < 128) return true

    return false
}

function changeForRowAndCol(move) {

    /*
    Parameter: initial and destination squares(JSON)
    return: corresponding rows and columns of each square(JSON)
    */

    const searchCol = m => m % 16
    const searchRow = m => (m - searchCol(m)) / 16

    return {
        from_col: searchCol(move.pieceToMove),
        from_row: searchRow(move.pieceToMove),
        to_col: searchCol(move.moveTowards),
        to_row: searchRow(move.moveTowards)
    }
}