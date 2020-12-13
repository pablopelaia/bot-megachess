const MY_TOKEN = 'd8f03c50-5872-4c72-ada2-6263a5121d37'

const ws = new WebSocket(`ws://megachess.herokuapp.com/service?authtoken=${MY_TOKEN}`)

ws.onopen = () => {
    console.log('conected')
}

ws.onmessage = e => {
    let data = JSON.parse(e.data)
    lisentMessage(data)
}

function lisentMessage(msg) {

    switch (msg.event) {
        case "update_user_list":
            console.log("Jugadores online:", msg.data.users_list)

            return

        case "ask_challenge":
            send("accept_challenge", { "board_id": msg.data.board_id })

            return

        case "your_turn":

            const board_id = msg.data.board_id
            const turn_token = msg.data.turn_token
            const turn = msg.data.actual_turn[0].toString().toUpperCase()

            console.log(
                'Es tu turno, rival:',
                msg.data.opponent_username
            )

            console.log(
                'Tu color:',
                msg.data.actual_turn,
                "movidas restantes:",
                msg.data.move_left
            )

            const cordsMove = movePiece(msg.data.board, turn)

            send("move",
                {
                    "board_id": board_id,
                    "turn_token": turn_token,
                    "from_row": cordsMove.from_row,
                    "from_col": cordsMove.from_col,
                    "to_row": cordsMove.to_row,
                    "to_col": cordsMove.to_col
                }
            )

            return

        case "gameover":

            console.log('El juego ha concluído')
            console.log(msg.data.white_username, ' puntos:', msg.data.white_score)
            console.log(msg.data.black_username, ' puntos:', msg.data.black_score)

            return

        default:
            console.log('unknown event')
    }
}

function send(action, data) {
    message = ({ action, data })
    ws.send(JSON.stringify(message))
}

function movePiece(board, turn) {

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

    const chess = assingColors(board, colors.piecesBlacks, colors.piecesWhites, turn);

    let move = searchBestMove(
        board,
        chess.movedOponent,
        chess.myPieces,
        chess.oponentPieces,
        turn
    );

    return changeForRowAndCol(move);
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
    According to the turn, it assigns its own pieces and rival pieces the corresponding color.
    Call 'searchMoves' in charge of  look for possible opponent's moves.
    Map the array of rival pieces and call 'searchMoves' to get the possible moves on the next turn.
    
    Parameters: board(str) blacksr (array) whites (array) turn(str)

    return: own pieces, rival pieces and possible opponent's moves (JSON)
    */

    let myPieces = []
    let oponentPieces = []
    let movedOponent = []
    let anotherTurn
    let auxiliar

    if (turn == 'B') {
        anotherTurn = 'W'
        myPieces = piecesBlacks
        oponentPieces = piecesWhites
    } else {
        anotherTurn = 'B'
        myPieces = piecesWhites
        oponentPieces = piecesBlacks
    }


    oponentPieces.map(op => {
        auxiliar = searchMoves(
            movedOponent,
            oponentPieces,
            myPieces,
            board[op].toUpperCase(),
            op,
            anotherTurn
        )
        movedOponent = movedOponent.concat(auxiliar)
    })

    return { myPieces, oponentPieces, movedOponent }
}

function searchMoves(moved, pieces, piecesAnotherTurn, piece, square, turn) {

    /*
    Identify the piece and call the functions in charge of looking for its possible movements.

    Parameters: pieces color of turn(array) pices another color (array) piece(str)
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
            let movements = verticalAndHorizontal(moved, pieces, piecesAnotherTurn, square)
            let diagonal = diagonals(moved, pieces, piecesAnotherTurn, square)

            return movements.concat(diagonal)
    }
}

function movementKing(moved, pieces, square) {

    /*
    The eight possible moves of a king are assigned, they are added by group.
    'verticalMargins' is called, a function that verifies that the movement is within the lateral margins.
    Filter: non-repeated movements, not occupied by the same color and within horizontal margins.

    Parameters: possible piece movements(array) board(str) pieces color of turn(array)
    pices another color(array) piece(str) current square(int) turn(str)

    return: possible piece movements(array)
    */

    let possible = [square - 16, square + 16]

    let steps = [square - 15, square - 1, square + 17]

    if (verticalMargins(square, -1)) possible = possible.concat(steps)

    steps = [square - 17, square + 1, square + 15]

    if (verticalMargins(square, 1)) possible = possible.concat(steps)

    possible = possible.filter(p =>
        (horizontalMargins(p) && !moved.includes(p) && !pieces.includes(p))
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
    'CheckOnBoard' and 'verticalMargins' are called to verify that the moves do not leave the board.
    Filter: non-repeated movements.

    Parameter: possible piece movements(array) pieces color of turn(array) square(int) turn(str)

    return: possible piece movements(array)
    */

    let possible = {}
    let newMoved = []

    if (turn == 'W') {
        possible = {
            single: square - 16,
            double: square > 191 ? square - 32 : 256,
            eatLeft: verticalMargins(square, -1) ? square - 17 : 256,
            eatRight: verticalMargins(square, 1) ? square - 15 : 256
        }
    } else {
        possible = {
            single: square + 16,
            double: square < 64 ? square + 32 : 256,
            eatLeft: verticalMargins(square, -1) ? square + 17 : 256,
            eatRight: verticalMargins(square, 1) ? square + 15 : 256
        }
    }

    if (!pieces.includes(possible.single)) {

        newMoved.push(possible.single)

        if (pieces.includes(possible.double)) newMoved.push(possible.double)
    }

    if (piecesAnotherTurn.includes(possible.eatLeft)) newMoved.push(possible.eatLeft)

    if (piecesAnotherTurn.includes(possible.eatRight)) newMoved.push(possible.eatRight)

    return newMoved.filter(n => horizontalMargins(n) && !moved.includes(n))
}

function movementHorse(moved, pieces, square) {

    /*
    Start with the eight possible movements of a horse divided into four groups,
    according to how many squares it moves to the right or left
    'verticalMargins' is called to verify that the movements are within the lateral margins.
    Filter: non-repeated movements, not occupied by the same color and within horizontal margins.

    Parameter: possible piece movements(array) square(int) turn(str)

    return: possible piece movements(array)
    */

    let possible = []

    if (verticalMargins(square, -1)) possible = possible.concat(square - 33, square + 31)

    if (verticalMargins(square, -2)) possible = possible.concat(square - 18, square + 14)

    if (verticalMargins(square, 2)) possible = possible.concat(square - 14, square + 18)

    if (verticalMargins(square, 1)) possible = possible.concat(square - 31, square + 33)

    possible = possible.filter(p =>
        (!pieces.includes(p) && horizontalMargins(p) && !moved.includes(p))
    )

    return possible
}

function diagonals(moved, pieces, piecesAnotherTurn, square) {

    /*
    Function that works for both bishops and queens, looks for the diagonal movements of the piece
    Take the piece as the center and analyze the four possible directions.
    Call 'addSteps' to search the different segments with different parameters

    Parameter: possible piece movements(array)  pieces color of turn(array)
    pices another color(array) square(int)

    return: possible piece movements(array)
    */

    let possible = []
    let steps = [-17, -15, 15, 17]

    possible = possible.concat(nextStep(moved, pieces, piecesAnotherTurn, square, steps))

    return possible
}

function verticalAndHorizontal(moved, pieces, piecesAnotherTurn, square) {

    /*
    Function that works for both towers and queens,
    Take the piece as the center and analyze the four possible directions.
    Call 'addSteps' to search the different segments with different parameters

    Parameter: possible piece movements(array)  pieces color of turn(array)
    pices another color(array) square(int)

    return: possible piece movements(array)
    */

    let possible = []
    let steps = [-16, -1, 1, 16]

    possible = possible.concat(nextStep(moved, pieces, piecesAnotherTurn, square, steps))

    return possible
}

function nextStep(moved, pieces, piecesAnotherTurn, square, steps) {

    /*
    Function that looks for movements in a given direction.
    It goes through a segment in the same direction as long as it stays inside the board.
    Use the 'horizontalMargins' and 'verticalMargins' functions to ensure that moves are within the board.
    Filtered: non-repeated movement and squares not occupied by the same color.
    If there is a rival piece on the destination square, the move is added but the segment is cut.

    Parameter: possible piece movements(array) square with movement(int)
    pieces color of turn(array) pices another color(array) segment direction(int)

    return: possible piece movements(array)
    */

    let possible = []
    let direction

    steps.map(step => {

        if (step == -17 || step == -1 || step == 15) {
            direction = -1
        } else {
            (step == 16 || step == -16) ? direction = 0 : direction = 1
        }

        let move = square + step
        let toContinue = verticalMargins(square, direction)

        while (toContinue && horizontalMargins(move) && !pieces.includes(move)) {

            if (!moved.includes(move)) possible.push(move)

            toContinue = (!piecesAnotherTurn.includes(move) && verticalMargins(move, direction))

            move = move + step
        }
    })

    return possible
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
    let captured = false

    pieces.map(square => {
        const piece = board[square].toUpperCase()

        let movements = searchMoves(
            [],
            pieces,
            piecesAnotherTurn,
            piece,
            square,
            turn
        )

        if (!captured) {
            let move = selectMove(
                bestMove,
                movements,
                movedOponent,
                moveTowards,
                piece,
                piecesAnotherTurn,
                pieceToMove,
                square,
                turn
            )

            captured = move.captured
            pieceToMove = move.pieceToMove
            moveTowards = move.moveTowards
            bestMove = move.bestMove
        }
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
    movements,
    movedOponent,
    moveTowards,
    piece,
    piecesAnotherTurn,
    pieceToMove,
    square,
    turn
) {

    /*
    Search among the possible movements which is the best option.
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

    const pointPiece = searchPoint(piece)
    let captured = false
    let bestScore = bestMove
    let initial = pieceToMove
    let destiny = moveTowards

    movements.map(move => {
        let partialPoints = pointPiece

        if (!captured) {
            if (piecesAnotherTurn.includes(move)) captured = true

            if (captured) {
                bestScore = 2000
                initial = square
                destiny = move

            } else {
                partialPoints = lookUpScore(move, movedOponent, partialPoints, piece, turn)

                if (partialPoints > bestScore) {
                    bestScore = partialPoints
                    initial = square
                    destiny = move
                }
            }
        }
    })

    return { bestMove: bestScore, captured, pieceToMove: initial, moveTowards: destiny }
}

function lookUpScore(move, movedOponent, partialPoints, piece, turn) {

    let pieceValue = partialPoints
    let partialScore = partialPoints

    if (piece == 'P' && crowned(move, turn)) {
        partialScore = 50
        pieceValue = 5
    }

    if (movedOponent.includes(move)) partialScore = partialScore - pieceValue * 10

    return partialScore
}

function crowned(move, color) {

    /*
    Checks if the received pawn can be crowned on the given move.

    Parameter: movement(int) color(str)

    return: boolean
    */

    if (color == 'W' && move > 127 && move < 144) return true

    if (color == 'B' && move > 111 && move < 128) return true

    return false
}

function horizontalMargins(square) {

    return (square < 256 && square > (-1))
}

function verticalMargins(square, step) {

    switch (step) {
        case -1:
            return (square % 16) > 0 ? true : false

        case -2:
            return (square % 16) > 1 ? true : false

        case 2:
            return (square % 16) < 14 ? true : false

        case 1:
            return (square % 16) < 15 ? true : false
        
        case 0:
            return true
    }
}

function changeForRowAndCol(move) {

    /*
    Parameter: initial and destination squares(JSON)
    return: corresponding rows and columns of each square(JSON)
    */

    return {
        from_col: searchCol(move.pieceToMove),
        from_row: searchRow(move.pieceToMove),
        to_col: searchCol(move.moveTowards),
        to_row: searchRow(move.moveTowards)
    }
}

function searchCol(square) {
    return square % 16
}

function searchRow(square) {
    return (square - searchCol(square)) / 16
}

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