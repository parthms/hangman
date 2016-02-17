var Hangman = (function($) {
    var mod = function() {
        this.model = {
            email: "parthshah12@gmail.com",
            server: "http://hangman.coursera.org/hangman/game",
            allGuesses: []
        };

        this.elements = {};

        this.templates = {
            errorMsg: "<div class='errorMsg'>Oops! Something went wrong!</div>"
        };

        this.initElements();
        this.init();
    };

    mod.fn = mod.prototype;

    mod.fn.initElements = function() {
        this.elements.hangman = $("#hangman");
        this.elements.phrase = $("#phrase");
        this.elements.letters = $("#alphabet .letter");
        this.elements.incorrectGuesses = $("#incorrectGuesses");
        this.elements.numIncorrectGuessesLeft = $("#numIncorrectGuessesLeft span");
        this.elements.canvas = $("#gallowCanvas");
    };

    mod.fn.init = function() {
        this.startNewGame();
        this.bindEvents();
    };

    mod.fn.startNewGame = function() {
        var self = this;

        $.ajax({
            type: "POST",
            url: self.model.server,
            crossDomain: true,
            dataType: "json",
            data: JSON.stringify({
                email: this.model.email
            }),
            success: function(data, textStatus, jqXHR) {
                self.saveData(data);
                self.updateGameState();
                self.drawGallow();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                self.elements.hangman.empty();
                self.elements.hangman.append(self.templates.errorMsg);
            }
        });
    };

    mod.fn.restartGame = function() {
        this.elements.letters.removeClass("inactive");
        this.model.allGuesses = [];
        this.elements.incorrectGuesses.empty();
        this.startNewGame();
    };

    mod.fn.guessLetter = function(letter) {
        var self = this;

        $.ajax({
            type: "POST",
            url: self.model.server + "/" + self.model.gameKey,
            crossDomain: true,
            dataType: "json",
            data: JSON.stringify({
                guess: letter
            }),
            success: function(data, textStatus, jqXHR) {
                self.saveData(data);
                self.updateGameState(letter);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                self.elements.hangman.empty();
                self.elements.hangman.append(self.templates.errorMsg);
            }
        });
    };

    mod.fn.saveData = function(data) {
        this.model.gameKey = data.game_key;
        this.model.phrase = data.phrase;
        this.model.state = data.state;
        this.model.numTriesLeft = parseInt(data.num_tries_left);
    };

    mod.fn.updateGameState = function(letter) {
        var message,
            isGameOver = false,
            lost = false,
            self = this;

        this.elements.phrase.html(this.model.phrase);
        this.elements.numIncorrectGuessesLeft.html(this.model.numTriesLeft);

        if (this.model.state === "won") {
            message = "Congratulations! Your bravery and skill saved this person! Want to continue saving lives?";
            isGameOver = true;
        }
        else if (this.model.state === "lost") {
            message = "Oh no! The poor person just died. Want to try and save someone else?";
            isGameOver = true;
            lost = true;
        }
        else {
            if (letter) {
                // Check to see if the letter guessed was incorrect.
                if (this.model.phrase.indexOf(letter.toUpperCase()) === -1 && this.model.phrase.indexOf(letter.toLowerCase()) === -1) {
                    this.renderIncorrectGuess(letter);
                    this.drawGallow();
                }
            }
        }

        if (isGameOver) {
            // Render the final incorrect letter guessed and the right leg on the gallow to show end of game.
            if (lost) {
                this.drawGallow();
                this.renderIncorrectGuess(letter);
            }

            // This is wrapped in a set timeout call so that the final incorrect letter guessed can be rendered.
            setTimeout(function() {
                if (confirm(message)) {
                    self.restartGame();
                }
                else {
                    // Disable pointer events on the alphabet in case the user hits cancel on the confirm dialog.
                    self.elements.letters.css("pointer-events", "none");
                }
            }, 0);
        }
    };

    mod.fn.renderIncorrectGuess = function(incorrectGuess) {
        var self = this;

        // If we have an incorrect guess then add to the incorrect guesses div with the inactive class so that it is invisible.
        self.elements.incorrectGuesses.append("<div class='letter inactive'><span>" + incorrectGuess + "</span></div>");

        // This set timeout is necessary for the transition to opacity = 1 to work as expected.
        setTimeout(function() {
            self.elements.incorrectGuesses.find('.letter').removeClass("inactive");
        }, 0);
    };

    mod.fn.drawLine = function(context, from, to) {
        context.beginPath();
        context.moveTo(from[0], from[1]);
        context.lineTo(to[0], to[1]);
        context.stroke();
    };

    mod.fn.drawGallow = function() {
        var canvas = this.elements.canvas[0],
            c = canvas.getContext("2d"),
            incorrectGuesses = this.elements.incorrectGuesses.find('.letter').size();

        // Reset the canvas.
        canvas.width = canvas.width;

        c.lineWidth = 5;
        c.strokeStyle = '#663300';
        c.fillStyle = '#663300';

        // Draw gallow base
        this.drawLine(c, [10,190], [180,190]);

        // Draw gallow pole
        this.drawLine(c, [30,190], [30,10]);

        // Draw top of gallow
        c.lineTo(160,10);
        c.stroke();


        if (incorrectGuesses > 0) {
            c.strokeStyle = 'black';
            c.lineWidth = 3;

            // Draw rope
            this.drawLine(c, [145,10], [145,30]);

            // Draw head
            c.beginPath();
            c.moveTo(160, 45);
            c.arc(145, 45, 15, 0, (Math.PI/180)*360);
            c.stroke();

            if (incorrectGuesses > 1) {
                // Draw body
                this.drawLine(c, [145,60], [145,130]);
            }

            if (incorrectGuesses > 2) {
                // Draw left arm
                this.drawLine(c, [145,80], [110,90]);
            }

            if (incorrectGuesses > 3) {
                // Draw right arm
                this.drawLine(c, [145,80], [180,90]);
            }

            if (incorrectGuesses > 4) {
                // Draw left leg
                this.drawLine(c, [145,130], [130,170]);
            }

            if (this.model.state === "lost") {
                // Draw right leg
                this.drawLine(c, [145,130], [160,170]);
            }
        }
    };

    mod.fn.bindEvents = function() {
        var self = this;

        self.elements.letters.click(function() {
            var letter = $(this).find("span").html();

            // Sanity check
            if ($(this).hasClass("inactive") || self.model.allGuesses.indexOf(letter) !== -1) {
                return;
            }

            self.guessLetter(letter);
            $(this).addClass("inactive");
            self.model.allGuesses.push(letter);
        });
    };

    return mod;

})(jQuery);