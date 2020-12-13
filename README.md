It is a bot to play mega chess, it was made for an Eventbrite preselection.

It is created in Javascript to connect with a server through websocket.
The bot receives different events from the server, including the corresponding turn.
with the update of the board, the bot will be in charge of looking for the best
possible move to respond with the initial and final squares of the movement.

On each turn the board is received along with the corresponding color of pieces.
The bot will find the best move to respond to the server in a given time.

MegaChess

https://megachess.herokuapp.com/

MegaChess is a code game where the participants, using artificial intelligence, must compete. This game bears a resemblance to Chess.
The server is in charge of creating the games and tournaments, controlling the players' turns and the validation of the moves.
This particular chess is about a 16 x 16 board, containing 64 pieces per color (4 pieces where there was 1 original piece on the 8 x 8 board)
To play, each player has to develop a program that connects to a WebSocket located on the server, using any programming language.
The nature of WebSockets allows the server and its clients to exchange messages or events. So players can challenge each other, play games or tournaments.
