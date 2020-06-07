

(function (document, $, wordfind) {
  'use strict';



    /**
    * Dibuja el la matriz insertando filas de botones en el.
    *
    * @param {String} el: El elemento jQuery para escribir el rompecabezas
    * @param {[[String]]} puzzle: El rompecabezas para dibujar
    */
    var drawPuzzle = function (el, puzzle) {
      var output = '';
     // por cada fila en la matriz
      for (var i = 0, height = puzzle.length; i < height; i++) {
        // agrega un div para representar una fila en el rompecabezas
        var row = puzzle[i];
        output += '<div>';
        // iteramos para recorrer los elementos de cada calomna
        for (var j = 0, width = row.length; j < width; j++) {
            // agrega nuestro botón con la clase apropiada
            output += '<button class="puzzleSquare" x="' + j + '" y="' + i + '">';
            output += row[j] || '&nbsp;';
            output += '</button>';
        }
        // cierra nuestro div que representa una fila
        output += '</div>';
      }

      $(el).html(output);
    };

    var getWords = function () {
      return $('input.word').toArray().map(wordEl => wordEl.value.toLowerCase()).filter(word => word);
    };

    /**
    * Dados dos puntos, asegúrese de que sean adyacentes y determine qué
    * orientación el segundo punto es relativo al primero
    *
    * @param {int} x1: La coordenada x del primer punto
    * @param {int} y1: La coordenada y del primer punto
    * @param {int} x2: La coordenada x del segundo punto
    * @param {int} y2: La coordenada y del segundo punto
    */
    var calcOrientation = function (x1, y1, x2, y2) {

      for (var orientation in wordfind.orientations) {
        var nextFn = wordfind.orientations[orientation];
        var nextPos = nextFn(x1, y1, 1);

        if (nextPos.x === x2 && nextPos.y === y2) {
          return orientation;
        }
      }

      return null;
    };


  /**
  * Inicializa el objeto .
   * *
   * Crea un nuevo juego de búsqueda de palabras y dibuja el tablero y las palabras.
   * *
   * Devuelve el rompecabezas que se creó.
  *
  * @param {String} puzzleEl: Selector para usar al insertar el rompecabezas
  * @param {Options} options: Opciones para usar al crear el rompecabezas
  */
  var Juego = function (puzzleEl, options) {

    // Class properties, game initial config:
    var wordList, puzzle;

    /**
     * Eventos de juego.
     * *
     * Los siguientes eventos manejan los giros, la selección de palabras, la búsqueda de palabras y
     * juego terminado.
     * *
     */

    // Estado del juego
    var startSquare, selectedSquares = [], curOrientation, curWord = '';

    /**
     * Evento que maneja el mouse hacia abajo en un nuevo cuadrado. Inicializa el estado del juego.
     * a la letra que fue seleccionada.
     * *
     */
    var startTurn = function () {
      $(this).addClass('selected');
      startSquare = this;
      selectedSquares.push(this);
      curWord = $(this).text();
    };
    
    var touchMove = function(e) {
      var xPos = e.originalEvent.touches[0].pageX;
      var yPos = e.originalEvent.touches[0].pageY;
      var targetElement = document.elementFromPoint(xPos, yPos);
      select(targetElement)
    };
    
    var mouseMove = function() { 
      select(this);
    };

    /**
     * Evento que maneja el mouse sobre un nuevo cuadrado. Asegura que la nueva plaza
     * está adyacente al cuadrado anterior y el nuevo cuadrado está a lo largo del camino
     * de una palabra real.
     * 
     */
    var select = function (target) {
      // si el usuario aún no ha comenzado una palabra, simplemente regrese
      if (!startSquare) {
        return;
      }

      // si el nuevo cuadrado es en realidad el cuadrado anterior, simplemente regrese
      var lastSquare = selectedSquares[selectedSquares.length-1];
      if (lastSquare == target) {
        return;
      }

      // ver si el usuario realizó una copia de seguridad y corrige el estado de Cuadrados seleccionados si
       // lo hicieron
      var backTo;
      for (var i = 0, len = selectedSquares.length; i < len; i++) {
        if (selectedSquares[i] == target) {
          backTo = i+1;
          break;
        }
      }

      while (backTo < selectedSquares.length) {
        $(selectedSquares[selectedSquares.length-1]).removeClass('selected');
        selectedSquares.splice(backTo,1);
        curWord = curWord.substr(0, curWord.length-1);
      }


      // ver si esto es solo una nueva orientación desde el primer cuadrado
       // esto es necesario para facilitar la selección de palabras diagonales
      var newOrientation = calcOrientation(
          $(startSquare).attr('x')-0,
          $(startSquare).attr('y')-0,
          $(target).attr('x')-0,
          $(target).attr('y')-0
          );

      if (newOrientation) {
        selectedSquares = [startSquare];
        curWord = $(startSquare).text();
        if (lastSquare !== startSquare) {
          $(lastSquare).removeClass('selected');
          lastSquare = startSquare;
        }
        curOrientation = newOrientation;
      }

      // ver si el movimiento tiene la misma orientación que el último movimiento
      var orientation = calcOrientation(
          $(lastSquare).attr('x')-0,
          $(lastSquare).attr('y')-0,
          $(target).attr('x')-0,
          $(target).attr('y')-0
          );

      // si el nuevo cuadrado no tiene una orientación válida, simplemente ignóralo.
       // esto hace que la selección de palabras diagonales sea menos frustrante
      if (!orientation) {
        return;
      }

      // finalmente, si no hubo orientación previa o si este movimiento es a lo largo
       // la misma orientación que el último movimiento, luego juega el movimiento
      if (!curOrientation || curOrientation === orientation) {
        curOrientation = orientation;
        playTurn(target);
      }
    };

    /**
    * Actualiza el estado del juego cuando la selección anterior era válida.
    *
    * @param {el} square: El elemento jQuery que se jugó
    */
    var playTurn = function (square) {

      // asegúrese de que todavía estamos formando una palabra válida
      for (var i = 0, len = wordList.length; i < len; i++) {
        if (wordList[i].indexOf(curWord + $(square).text()) === 0) {
          $(square).addClass('selected');
          selectedSquares.push(square);
          curWord += $(square).text();
          break;
        }
      }
    };

    /**
     * Evento que maneja el mouse hacia arriba en un cuadrado. Comprueba si una palabra válida
     * fue creado y actualiza la clase de las letras y la palabra si lo fue. Entonces
     * restablece el estado del juego para comenzar una nueva palabra.
     * 
     */
    var endTurn = function () {
      // ver si formamos una palabra válida
      for (var i = 0, len = wordList.length; i < len; i++) {
        
        if (wordList[i] === curWord) {
          $('.selected').addClass('found');
          wordList.splice(i,1);
          $('input.word[value="' + curWord + '"]').addClass('wordFound');
        }

        if (wordList.length === 0) {
          $('.puzzleSquare').addClass('complete');
        }
      }

      // restablecer el turno
      $('.selected').removeClass('selected');
      startSquare = null;
      selectedSquares = [];
      curWord = '';
      curOrientation = null;
    };

    /*Inicio Constructor */
    $('input.word').removeClass('wordFound');

    // Propiedades de clase, configuración inicial del juego:
    wordList = getWords().sort();
    puzzle = wordfind.newPuzzleLax(wordList, options);

    // Dibuja todas las palabras
    drawPuzzle(puzzleEl, puzzle);

    // adjunta eventos a los botones
     // agrega eventos de forma optimista para windows 8 touch
    if (window.navigator.msPointerEnabled) {
      $('.puzzleSquare').on('MSPointerDown', startTurn);
      $('.puzzleSquare').on('MSPointerOver', select);
      $('.puzzleSquare').on('MSPointerUp', endTurn);
    } else {
      $('.puzzleSquare').mousedown(startTurn);
      $('.puzzleSquare').mouseenter(mouseMove);
      $('.puzzleSquare').mouseup(endTurn);
      $('.puzzleSquare').on("touchstart", startTurn);
      $('.puzzleSquare').on("touchmove", touchMove);
      $('.puzzleSquare').on("touchend", endTurn);
    }

    /**
    * Resuelve un rompecabezas existente.
    *
    * @param {[[String]]} puzzle: El rompecabezas para resolver
    */
    this.solve = function() {
      var solution = wordfind.solve(puzzle, wordList).found;

      for( var i = 0, len = solution.length; i < len; i++) {
        var word = solution[i].word,
            orientation = solution[i].orientation,
            x = solution[i].x,
            y = solution[i].y,
            next = wordfind.orientations[orientation];

        var wordEl = $('input.word[value="' + word + '"]');
        if (!wordEl.hasClass('wordFound')) {
          for (var j = 0, size = word.length; j < size; j++) {
            var nextPos = next(x, y, j);
            $('[x="' + nextPos.x + '"][y="' + nextPos.y + '"]').addClass('solved');
          }

          wordEl.addClass('wordFound');
        }
      }
    };
  };

  Juego.emptySquaresCount = function () {
    var allSquares = $('.puzzleSquare').toArray();
    return allSquares.length - allSquares.filter(b => b.textContent.trim()).length;
  };

  // Metodo estatico
  Juego.insertWordBefore = function (el, word) {
    $('<li><input class="word" value="' + (word || '') + '"></li>').insertBefore(el);
  };



  window.Juego = Juego;

}(document, jQuery, wordfind));
