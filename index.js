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
            console.log("Jugadores online:")
            msg.data.users_list.map(u => console.log('*', u))

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

            send('get_connected_users', {})

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
    Objectives: Find the best move to send to the server.

    1 Print the board by console.
    2 Call 'assingColors' to place your own and rival pieces in the corresponding array.
    3 Call 'getOponetentsMoves' to get the opponent's moves.
    4 Call 'getTheBestMove' to get the starting and ending square of the move.
    5 Finally it calls 'getMoveCoords' to return the corresponding rows and columns of both squares.

    Parameters: board(str) turn(str)

    return: coordinates of the move(JSON)
    */

    printBoard(board);

    const chess = assingColors(board, turn);

    const oponentMoves = getOponetentsMoves(board, chess.oponentPieces, chess.myPieces, chess.oponentTurn)

    const move = getTheBestMove(board, oponentMoves, chess.myPieces, chess.oponentPieces, turn);

    return getMoveCoords(move);
}

function assingColors(board, turn) {

    /*
    Objective: Distribute the pieces by color.

    1 Go around the board to divide the pieces into colors.
    2 Assign the corresponding arrays to own pieces and rival pieces according to the turn.
    
    Parameter: board(str) turn(str)

    return: black and white pieces(JSON)
    */

    let piecesBlacks = []
    let piecesWhites = []
    let myPieces = []
    let oponentPieces = []
    let oponentTurn

    for (let i = 0; i < board.length; i++) {

        if (board[i] != ' ')
            board[i] === board[i].toUpperCase() ?
                piecesWhites.push(i) : piecesBlacks.push(i)
    }

    if (turn == 'B') {
        oponentTurn = 'W'
        myPieces = piecesBlacks
        oponentPieces = piecesWhites
    } else {
        oponentTurn = 'B'
        myPieces = piecesWhites
        oponentPieces = piecesBlacks
    }

    return { myPieces, oponentPieces, oponentTurn }
}

function getOponetentsMoves(board, pieces, anotherPieces, turn) {

    /*
    Objective: Find the possible moves for the next turn. These movements will serve to verify if a piece can be eaten.
    
    1 Map the opponent's piece array.
    2 For each piece call 'getPossibleMoves' to obtain the possible moves for the next move. 

    Parameters: board(str) turn color pieces(array) pices another color(array) turn(str)

    return: possible rival piece movements(array)
    */

    let moves = []

    pieces.map(square => {
        move = getPossibleMoves(
            moves,
            pieces,
            anotherPieces,
            board[square].toUpperCase(),
            square,
            turn
        )
    })

    return moves
}

function getPossibleMoves(currentMoves, pieces, piecesAnotherTurn, piece, square, turn) {

    /*
    Objective: Identify the piece and call the functions in charge of looking for its possible move.
    This function is used by own and rival pieces, according to the received parameters.

    Parameters: possible piece movements(aray) pieces color of turn(array)
    pices another color (array) piece(str) mcurrent square(int) turn(str)

    board(str) pieces of turn(array) pices another color(array) turn(str)

    return: possible piece movements(array)
    */

    switch (piece) {
        case 'K':
            return getKingMoves(currentMoves, pieces, square)

        case 'P':
            return getPawnMoves(currentMoves, pieces, piecesAnotherTurn, square, turn)

        case 'H':
            return getHorseMoves(currentMoves, pieces, square)

        case 'B':
            return getDiagonalsMoves(currentMoves, pieces, piecesAnotherTurn, square)

        case 'R':
            return getStraightLineMoves(currentMoves, pieces, piecesAnotherTurn, square)

        case 'Q':
            let moves = getStraightLineMoves(currentMoves, pieces, piecesAnotherTurn, square)
            return getDiagonalsMoves(moves, pieces, piecesAnotherTurn, square)
    }
}

function getKingMoves(currentMoves, pieces, square) {

    /*
    he eight possible moves of a king are assigned.
    The movements are divided into three groups to facilitate margin filters.
    Call 'checkMarginsY' and 'checkMarginsX' to verify that the movements are within theboard.
    See that there are no non-repeated moves and that the squares are not occupied by pieces of
    the same color. Current movements are concatenated with those obtained.

    Parameters: possible piece movements(array) pieces (array) current square(int)

    return: possible piece movements(array)
    */

    let moves = [square - 16, square + 16]

    if (checkMarginsY(square, -1)) moves = moves.concat(square - 15, square - 1, square + 17)

    if (checkMarginsY(square, 1)) moves = moves.concat(square - 17, square + 1, square + 15)

    moves = moves.filter(move =>
        (checkMarginsX(move) && !currentMoves.includes(move) && !pieces.includes(move))
    )

    return currentMoves.concat(moves)
}

function getPawnMoves(currentMoves, pieces, piecesAnotherTurn, square, turn) {

    /*
    1 Se identifica el color del peón y se le asigna un JSON con sus cuatro posibles movimientos.
    2 Se compruba si el primer paso es posible.
    3 Si fue posible el anterior se comprueba si se puede realizar el segundo paso.
    4 Se comprueba si se puede comer a la izquierda y derecha.
    5 En cada paso se verifican los márgenes con las funciones 'CheckOnBoard' y 'checkMarginsY'
    6 Se verifica que no se repitan los movimientos.
    7 Current movements are concatenated with those obtained.

    Parameters: possible piece movements(array) turn color pieces (array)
    pieces another color(array) current square(int) turn(str)

    return: possible piece movements(array)
    */

    let pawnMoves = {}
    let moves = []

    if (turn == 'W') {
        pawnMoves = {
            single: square - 16,
            double: square > 191 ? square - 32 : 256,
            eatLeft: checkMarginsY(square, -1) ? square - 17 : 256,
            eatRight: checkMarginsY(square, 1) ? square - 15 : 256
        }
    } else {
        pawnMoves = {
            single: square + 16,
            double: square < 64 ? square + 32 : 256,
            eatLeft: checkMarginsY(square, -1) ? square + 17 : 256,
            eatRight: checkMarginsY(square, 1) ? square + 15 : 256
        }
    }

    if (!pieces.includes(pawnMoves.single) && !piecesAnotherTurn.includes(pawnMoves.single)) {

        moves.push(pawnMoves.single)

        if (!pieces.includes(pawnMoves.double) && !piecesAnotherTurn.includes(pawnMoves.double))
            moves.push(pawnMoves.double)
    }

    if (piecesAnotherTurn.includes(pawnMoves.eatLeft)) !moves.push(pawnMoves.eatLeft)

    if (piecesAnotherTurn.includes(pawnMoves.eatRight)) !moves.push(pawnMoves.eatRight)

    moves = moves.filter(move => checkMarginsX(move) && !currentMoves.includes(move))

    return currentMoves.concat(moves)
}

function getHorseMoves(currentMoves, pieces, square) {

    /*
    1 The eight possible movements of a horse divided into four groups are added according
    to how many squares it moves to the right or to the left.
    2 'checkMarginsY' is called to verify that the movements are within the lateral margins.
    3 Filter: non-repeated movements, not occupied by the same color and within
    horizontal margins.
    4 The current movements are concatenated with those obtained.

    Parameters: possible piece movements(array) pieces (array) turn(str)
    
    return: possible piece movements(array)
    */

    let moves = []

    if (checkMarginsY(square, -1)) moves = moves.concat(square - 33, square + 31)

    if (checkMarginsY(square, -2)) moves = moves.concat(square - 18, square + 14)

    if (checkMarginsY(square, 2)) moves = moves.concat(square - 14, square + 18)

    if (checkMarginsY(square, 1)) moves = moves.concat(square - 31, square + 33)

    moves = moves.filter(move =>
        (!pieces.includes(move) && checkMarginsX(move) && !currentMoves.includes(move))
    )

    return currentMoves.concat(moves)
}

function getDiagonalsMoves(currentMoves, pieces, piecesAnotherTurn, square) {

    /*
    Function that works for both bishops and queens, looks for the diagonal movements
    of the piece. Take the piece as the center and analyze the four possible directions.
    Call 'getSegments' to search the different segments with different parameters

    Parameters: possible piece movements(array) turn color pieces (array)
    pieces another color(array) current square(int)

    return: possible piece movements(array)
    */

    let segmentDirections = [-17, -15, 15, 17]

    return getSegments(currentMoves, pieces, piecesAnotherTurn, square, segmentDirections)
}

function getStraightLineMoves(currentMoves, pieces, piecesAnotherTurn, square) {

    /*
    Function that works for both towers and queens, Take the piece as the center
    and analyze the four possible directions. Call 'getSegments' to search the
    different segments with different parameters

    Parameters: possible piece movements(array) turn color pieces (array)
    pieces another color(array) current square(int)

    return: possible piece movements(array)
    */

    let segmentDirections = [-16, -1, 1, 16]

    return getSegments(currentMoves, pieces, piecesAnotherTurn, square, segmentDirections)
}

function getSegments(currentMoves, pieces, piecesAnotherTurn, square, segmentDirections) {

    /*
    Objective: Search for movements in a certain direction.

    1 Map the array of addresses.
    2 For each item obtained, see which direction that segment will go.
    3 Enter a while loop and within it call the functions in charge of maintaining
    the movements within the board (checkMarginsX 'and' checkMarginsY ')
    4 Check for repeated movements.
    5 If a square has a piece, it exits the while loop, if it is the opponent's piece,
    the move is added before exiting.
    6 Current movements are concatenated with those obtained.

    Parameters: possible piece movements(array) turn color pieces (array)
    pieces another color(array) current square(int) the four directions of the segments(array) 

    return: possible piece movements(array)
    */

    let moves = currentMoves
    let direction

    segmentDirections.map(goTo => {

        (goTo == -17 || goTo == -1 || goTo == 15) ? direction = -1 :
            (goTo == 16 || goTo == -16) ? direction = 0 : direction = 1

        let move = square + goTo
        let nextStep = checkMarginsY(square, direction)

        while (nextStep && checkMarginsX(move) && !pieces.includes(move)) {

            if (!moves.includes(move)) moves.push(move)

            nextStep = (!piecesAnotherTurn.includes(move) && checkMarginsY(move, direction))

            move = move + goTo
        }
    })

    return moves
}

function getTheBestMove(board, oponentMoves, pieces, piecesAnotherTurn, turn) {

    /*
    Objective: Get the most convenient move. Make it a priority to eat an opponent's piece.

    1 Map the array of your own parts.
    2 For each piece obtained, look for the possible movements of it.
    3 If you have not been able to capture a part yet, it calls 'selectTheBestMove' and
    passes it, among other parameters, the movements obtained from the part.
    4 'selectTheBestMove' will return the best movement option in each turn, once all
    the pieces have been reviewed, the most convenient movement is obtained.

    Parameters: board(str) oponent moves(array) turn color pieces (array)
    pieces another color(array) turn(str)

    return: initial square and destination square(JSON)
    */

    let bestMove = -20
    let pieceToMove = 0
    let moveTowards = 0
    let captured = false

    pieces.map(square => {
        const piece = board[square].toUpperCase()

        let moves = getPossibleMoves(
            [],
            pieces,
            piecesAnotherTurn,
            piece,
            square,
            turn
        )

        if (!captured) {
            let move = selectTheBestMove(
                bestMove,
                moves,
                oponentMoves,
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

function selectTheBestMove(
    bestMove,
    moves,
    oponentMoves,
    moveTowards,
    piece,
    piecesAnotherTurn,
    pieceToMove,
    square,
    turn
) {

    /*
    1 Maps the movement array of the received part.
    2 If you haven't eaten a piece yet, check if that move can be made, if so, reassign
    values to the initial move and the target move, with square and the move respectively.
    3 If it continues without capturing, 'getMovePoints' is called to get the score for that move.
    4 If the score obtained exceeds the previous one, this is replaced together with the initial
    square and the destination.
    
    Parameters: bestMove(int) possible piece movements(array)
    moves of rival pieces(array) destination square(int) pices another color(array)
    initial square(int) current square(int) turn(str)
    
    return: best move, had captured, initial square and destination square(JSON)
    */

    const pointPiece = getPiecePoints(piece)
    let captured = false
    let bestScore = bestMove
    let initial = pieceToMove
    let destiny = moveTowards

    moves.map(move => {
        let partialPoints = pointPiece

        if (!captured) {
            if (piecesAnotherTurn.includes(move)) captured = true

            if (captured) {
                initial = square
                destiny = move

            } else {
                partialPoints = getMovePoints(move, oponentMoves, partialPoints, piece, turn)

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

function getPiecePoints(piece) {

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

function getMovePoints(move, oponentMoves, partialPoints, piece, turn) {

    /*
    If the piece is a pawn, it calls 'isCrowned' to verify if there is promote,
    if so, the value of the piece and the score of the move are changed. It is
    verified with the opponent's movements if the piece can be eaten in the next
    turn, if so, the value is changed. If the value has been modified, the new
    value is returned, otherwise the movement value will be the same as the part.
    
    Parameters: move(int) moves of rival pieces(array) points(int) piece(str) turn(str)
    
    return: points of movement received(int)
    */

    let pieceValue = partialPoints
    let partialScore = partialPoints

    if (piece == 'P' && isCrowned(move, turn)) {
        partialScore = 50
        pieceValue = 5
    }

    if (oponentMoves.includes(move)) partialScore = partialScore - pieceValue * 10

    return partialScore
}

function isCrowned(move, color) {

    /*
    Checks if the received pawn can be isCrowned on the given move.

    Parameter: movement(int) color(str)

    return: boolean
    */

    if (color == 'W' && move > 127 && move < 144) return true

    if (color == 'B' && move > 111 && move < 128) return true

    return false
}

function checkMarginsX(square) {

    return (square < 256 && square > (-1))
}

function checkMarginsY(square, yDirection) {

    switch (yDirection) {
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

function getMoveCoords(move) {

    /*
    Parameter: initial and destination squares(JSON)
    return: corresponding rows and columns of each square(JSON)
    */

    const getCol = (square) => square % 16
    const getRow = (square) => (square - getCol(square)) / 16

    return {
        from_col: getCol(move.pieceToMove),
        from_row: getRow(move.pieceToMove),
        to_col: getCol(move.moveTowards),
        to_row: getRow(move.moveTowards)
    }
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