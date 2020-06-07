

(function () {

  'use strict';

  /**
  * Initializes the  object.
  *
  * @api private
  */
  var Sopa = function () {

    // Letras usadas para llenar espacios en blanco en la sopa de letras
    const LETTERS = 'abcdefghijklmnoprstuvwy';

    // La lista de todas las orientaciones posibles.
    var allOrientations = ['horizontal','horizontalBack','vertical','verticalUp',
                           'diagonal','diagonalUp','diagonalBack','diagonalUpBack'];

    // La definición de la orientación, calcula el siguiente cuadrado dado un cuadrado inicial (x, y) y la distancia (i) desde ese cuadrado.
    var orientations = {
      horizontal:     function(x,y,i) { return {x: x+i, y: y  }; },
      horizontalBack: function(x,y,i) { return {x: x-i, y: y  }; },
      vertical:       function(x,y,i) { return {x: x,   y: y+i}; },
      verticalUp:     function(x,y,i) { return {x: x,   y: y-i}; },
      diagonal:       function(x,y,i) { return {x: x+i, y: y+i}; },
      diagonalBack:   function(x,y,i) { return {x: x-i, y: y+i}; },
      diagonalUp:     function(x,y,i) { return {x: x+i, y: y-i}; },
      diagonalUpBack: function(x,y,i) { return {x: x-i, y: y-i}; }
    };

    //Determina si una orientación es posible dado el cuadrado inicial (x, y),
     // la altura (h) y el ancho (w) del rompecabezas, y la longitud de la palabra (l).
     // Devuelve verdadero si la palabra se ajustará comenzando en el cuadrado provisto usando
     // la orientación especificada.
    var checkOrientations = {
      horizontal:     function(x,y,h,w,l) { return w >= x + l; },
      horizontalBack: function(x,y,h,w,l) { return x + 1 >= l; },
      vertical:       function(x,y,h,w,l) { return h >= y + l; },
      verticalUp:     function(x,y,h,w,l) { return y + 1 >= l; },
      diagonal:       function(x,y,h,w,l) { return (w >= x + l) && (h >= y + l); },
      diagonalBack:   function(x,y,h,w,l) { return (x + 1 >= l) && (h >= y + l); },
      diagonalUp:     function(x,y,h,w,l) { return (w >= x + l) && (y + 1 >= l); },
      diagonalUpBack: function(x,y,h,w,l) { return (x + 1 >= l) && (y + 1 >= l); }
    };

    // Determina el siguiente cuadrado válido posible dado que el cuadrado (x, y) era]
     // inválido y una longitud de palabra de (l). Esto reduce en gran medida el número de
     // cuadrados que deben ser revisados. Devolver {x: x + 1, y: y} siempre funcionará
     // pero no será óptimo.
    var skipOrientations = {
      horizontal:     function(x,y,l) { return {x: 0,   y: y+1  }; },
      horizontalBack: function(x,y,l) { return {x: l-1, y: y    }; },
      vertical:       function(x,y,l) { return {x: 0,   y: y+100}; },
      verticalUp:     function(x,y,l) { return {x: 0,   y: l-1  }; },
      diagonal:       function(x,y,l) { return {x: 0,   y: y+1  }; },
      diagonalBack:   function(x,y,l) { return {x: l-1, y: x>=l-1?y+1:y    }; },
      diagonalUp:     function(x,y,l) { return {x: 0,   y: y<l-1?l-1:y+1  }; },
      diagonalUpBack: function(x,y,l) { return {x: l-1, y: x>=l-1?y+1:y  }; }
    };

    /**
    * Inicializa la sopa y coloca palabras en la sopa de una en una.
    * 
    * Devuelve una matrix válida con todas las palabras o nulo si es válido
    * no se encontró el sopa.
    *
    * @param {[String]} words: La lista de palabras para encajar en la sopa
    * @param {[Options]} options: Las opciones para usar al completar la sopa
    */
    var fillPuzzle = function (words, options) {

      var puzzle = [], i, j, len;

      // inicializa la sopa en blanco
      for (i = 0; i < options.height; i++) {
        puzzle.push([]);
        for (j = 0; j < options.width; j++) {
          puzzle[i].push('');
        }
      }

      // agrega cada palabra a la sopa de una en una
      for (i = 0, len = words.length; i < len; i++) {
        if (!placeWordInPuzzle(puzzle, options, words[i])) {
          //si una palabra no encaja en el rompecabezas, ríndete
          return null;
        }
      }

      // return la sopa
      return puzzle;
    };

    /**
    * Agrega la palabra especificada a la sopa al encontrar todas las posibles
     * ubicaciones donde se ajustará la palabra y luego seleccionar aleatoriamente una. Opciones
     * controla si la superposición de palabras se debe maximizar o no.
     * 
     * Devuelve verdadero si la palabra se colocó con éxito, de lo contrario, falso.
    *
    * @param {[[String]]} puzzle: El estado actual de la sopa.
    * @param {[Options]} options: Las opciones para usar al completar la sopa
    * @param {String} word: La palabra para encajar en la sopa.
    */
    var placeWordInPuzzle = function (puzzle, options, word) {

      // encuentra todas las mejores ubicaciones donde esta palabra encajaría
      var locations = findBestLocations(puzzle, options, word);

      if (locations.length === 0) {
        return false;
      }

      // selecciona una ubicación al azar y coloca la palabra allí
      var sel = locations[Math.floor(Math.random() * locations.length)];
      placeWord(puzzle, word, sel.x, sel.y, orientations[sel.orientation]);

      return true;
    };

    /**
    * Itera a través de la sopa y determina todos los lugares donde
     * la palabra encajará. Las opciones determinan si la superposición se debe maximizar o
     * no.
     * *
     * Devuelve una lista de objetos de ubicación que contienen un cooridinado x, y
     * indicando el comienzo de la palabra, la orientación de la palabra y el
     * número de letras que se superponen con la letra existente.
     * *
    * @param {[[String]]} puzzle: El estado actual del rompecabezas.
    * @param {[Options]} options: Las opciones para usar al completar la sopa
    * @param {String} word: La palabra para encajar en la sopa.
    */
    var findBestLocations = function (puzzle, options, word) {

      var locations = [],
          height = options.height,
          width = options.width,
          wordLength = word.length,
          maxOverlap = 0; // comenzaremos a mirar super posicion = 0

      // recorre todas las orientaciones posibles en esta posición
      for (var k = 0, len = options.orientations.length; k < len; k++) {

        var orientation = options.orientations[k],
            check = checkOrientations[orientation],
            next = orientations[orientation],
            skipTo = skipOrientations[orientation],
            x = 0, y = 0;

        // recorre cada posición en el tablero
        while( y < height ) {

          // ver si esta orientación es posible en esta ubicación
          if (check(x, y, height, width, wordLength)) {

            // determina si la palabra se ajusta a la posición actual
            var overlap = calcOverlap(word, puzzle, x, y, next);

            // si la superposición fue mayor que las superposiciones anteriores que hemos visto
            if (overlap >= maxOverlap || (!options.preferOverlap && overlap > -1)) {
              maxOverlap = overlap;
              locations.push({x: x, y: y, orientation: orientation, overlap: overlap});
            }

            x++;
            if (x >= width) {
              x = 0;
              y++;
            }
          } else {
            // si la celda actual no es válida, salte a la siguiente celda donde
             // esta orientación es posible. esto reduce en gran medida el número
             // de los controles que tenemos que hacer en general
            var nextPossible = skipTo(x,y,wordLength);
            x = nextPossible.x;
            y = nextPossible.y;
          }

        }
      }

      // finalmente pode todas las ubicaciones posibles que encontramos por
       // solo usando los que tienen la superposición máxima que calculamos
      return options.preferOverlap ?
             pruneLocations(locations, maxOverlap) :
             locations;
    };

    /**
    * Determina si una palabra en particular encaja o no en un determinado
     * Orientación dentro del rompecabezas.
     * *
     * Devuelve el número de letras superpuestas con palabras existentes si la palabra
     * encaja en la posición especificada, -1 si la palabra no encaja.
    *
    * @param {String} word: La palabra para encajar en el rompecabezas.
    * @param {[[String]]} puzzle: El estado actual del rompecabezas.
    * @param {int} x: La posicion de X para revisar
    * @param {int} y: La posicion de Y para revisar
    * @param {function} fnGetSquare: Función que devuelve el siguiente cuadrado
    */
    var calcOverlap = function (word, puzzle, x, y, fnGetSquare) {
      var overlap = 0;

      // atraviesa los cuadrados para determinar si la palabra encaja
      for (var i = 0, len = word.length; i < len; i++) {

        var next = fnGetSquare(x, y, i),
            square = puzzle[next.y][next.x];

        // si el cuadrado del rompecabezas ya contiene la letra
         // lo estás buscando, luego cuéntalo como un cuadrado superpuesto
        if (square === word[i]) {
          overlap++;
        }
        // si contiene una letra diferente, nuestra palabra no cabe
         // aquí, devuelve -1
        else if (square !== '' ) {
          return -1;
        }
      }

      // si toda la palabra se superpone, omítala para asegurarse de que las palabras no
       // oculto en otras palabras
      return overlap;
    };

    /**
    * Si se indicó la maximización de superposición, esta función se utiliza para podar
     * lista de ubicaciones válidas hasta las que contienen la superposición máxima
     * que se calculó previamente.
     * *
     * Devuelve el conjunto de ubicaciones podado.
    *
    * @param {[Location]} locations: El conjunto de ubicaciones para podar
    * @param {int} overlap: El nivel requerido de superposición
    */
    var pruneLocations = function (locations, overlap) {
      var pruned = [];
      for(var i = 0, len = locations.length; i < len; i++) {
        if (locations[i].overlap >= overlap) {
          pruned.push(locations[i]);
        }
      }
      return pruned;
    };

    /**
    * Coloca una palabra en la sopa dada una posición inicial y orientación.
    *
    * @param {[[String]]} puzzle: El estado actual de la sopa
    * @param {String} word: La palabra para encajar en el rompecabezas.
    * @param {int} x: La posición x para verificar
    * @param {int} y: La posición y para verificar
    * @param {function} fnGetSquare: Función que devuelve el siguiente cuadrado
    */
    var placeWord = function (puzzle, word, x, y, fnGetSquare) {
      for (var i = 0, len = word.length; i < len; i++) {
        var next = fnGetSquare(x, y, i);
        puzzle[next.y][next.x] = word[i];
      }
    };

    return {

      /**
      * Devuelve la lista de todas las orientaciones posibles.
      * @api public
      */
      validOrientations: allOrientations,

      /**
      * Devuelve las funciones de orientación para atravesar palabras.
      * @api public
      */
      orientations: orientations,

      /**
      * Genera un nuevo rompecabezas de búsqueda de palabras (búsqueda de palabras).
       * *
       * Configuraciones:
       * *
       * altura: altura deseada del rompecabezas, por defecto: la más pequeña posible
       * ancho: ancho deseado del rompecabezas, predeterminado: el más pequeño posible
       * orientaciones: lista de orientaciones a usar, por defecto: todas las orientaciones
       * fillBlanks: verdadero para completar los espacios en blanco, predeterminado: verdadero
       * maxAttempts: número de intentos antes de aumentar el tamaño del rompecabezas, predeterminado: 3
       * maxGridGrowth: aumenta el número de cuadrículas de rompecabezas, por defecto: 10
       * preferOverlap: maximiza la superposición de palabras o no, por defecto: verdadero
       * *
       * Devuelve el rompecabezas que se creó.
      *
      * @param {[String]} words: Lista de palabras para incluir en el rompecabezas.
      * @param {options} settings: Las opciones a usar para este rompecabezas
      * @api public
      */
      newPuzzle: function(words, settings) {
        if (!words.length) {
          throw new Error('Zero words provided');
        }
        var wordList, puzzle, attempts = 0, gridGrowths = 0, opts = settings || {};

        // copia y ordena las palabras por longitud, insertando palabras en el rompecabezas
         // de más largo a más corto funciona mejor
        wordList = words.slice(0).sort();

        // inicializar las opciones
        var maxWordLength = wordList[0].length;
        var options = {
          height:           opts.height || maxWordLength,
          width:            opts.width || maxWordLength,
          orientations:     opts.orientations || allOrientations,
          fillBlanks:       opts.fillBlanks !== undefined ? opts.fillBlanks : true,
          allowExtraBlanks: opts.allowExtraBlanks !== undefined ? opts.allowExtraBlanks : true,
          maxAttempts:      opts.maxAttempts || 3,
          maxGridGrowth:    opts.maxGridGrowth !== undefined ? opts.maxGridGrowth : 10,
          preferOverlap:    opts.preferOverlap !== undefined ? opts.preferOverlap : true
        };

        // agrega las palabras al rompecabezas
         // dado que los rompecabezas son aleatorios, intente crear uno válido hasta
         // maxAttempts y luego aumenta el tamaño del rompecabezas y vuelve a intentarlo
        while (!puzzle) {
          while (!puzzle && attempts++ < options.maxAttempts) {
            puzzle = fillPuzzle(wordList, options);
          }

          if (!puzzle) {
            gridGrowths++;
            if (gridGrowths > options.maxGridGrowth) {
              throw new Error(`No valid ${options.width}x${options.height} grid found and not allowed to grow more`);
            }
            console.log(`No valid ${options.width}x${options.height} grid found after ${attempts - 1} attempts, trying with bigger grid`);
            options.height++;
            options.width++;
            attempts = 0;
          }
        }

        // rellena espacios vacíos con letras al azar
        if (options.fillBlanks) {
            var lettersToAdd, fillingBlanksCount = 0, extraLetterGenerator;
            if (typeof options.fillBlanks === 'function') {
                extraLetterGenerator = options.fillBlanks;
            } else if (typeof options.fillBlanks === 'string') {
                lettersToAdd = options.fillBlanks.toLowerCase().split('');
                extraLetterGenerator = () => lettersToAdd.pop() || (fillingBlanksCount++ && '');
            } else {
                extraLetterGenerator = () => LETTERS[Math.floor(Math.random() * LETTERS.length)];
            }
            var extraLettersCount = this.fillBlanks({puzzle, extraLetterGenerator: extraLetterGenerator});
            if (lettersToAdd && lettersToAdd.length) {
                throw new Error(`Some extra letters provided were not used: ${lettersToAdd}`);
            }
            if (lettersToAdd && fillingBlanksCount && !options.allowExtraBlanks) {
                throw new Error(`${fillingBlanksCount} extra letters were missing to fill the grid`);
            }
            var gridFillPercent = 100 * (1 - extraLettersCount / (options.width * options.height));
            console.log(`Blanks filled with ${extraLettersCount} random letters - Final grid is filled at ${gridFillPercent.toFixed(0)}%`);
        }

        return puzzle;
      },

      /**
      * Envuelva alrededor de `newPuzzle` permitiendo encontrar una solución sin algunas palabras.
      *
      * @param {options} settings: Las opciones a utilizar para este rompecabezas.
      * Lo mismo que `newPuzzle` + allowedMissingWords
      */
      newPuzzleLax: function(words, opts) {
        try {
            return this.newPuzzle(words, opts);
        } catch (e) {
            if (!opts.allowedMissingWords) {
                throw e;
            }
            var opts = Object.assign({}, opts); // copia superficial
            opts.allowedMissingWords--;
            for (var i = 0; i < words.length; i++) {
                var wordList = words.slice(0);
                wordList.splice(i, 1);
                try {
                    var puzzle = this.newPuzzleLax(wordList, opts);
                    console.log(`Solution found without word "${words[i]}"`);
                    return puzzle;
                } catch (e) {} // continuar si dio error
            }
            throw e;
        }
      },

      /**
      * Rellena los espacios vacíos del rompecabezas con letras aleatorias.
      *
      * @param {[[String]]} puzzle: El estado actual de la sopa
      * @api public
      */
      fillBlanks: function ({puzzle, extraLetterGenerator}) {
        var extraLettersCount = 0;
        for (var i = 0, height = puzzle.length; i < height; i++) {
          var row = puzzle[i];
          for (var j = 0, width = row.length; j < width; j++) {
            if (!puzzle[i][j]) {
              puzzle[i][j] = extraLetterGenerator();
              extraLettersCount++;
            }
          }
        }
        return extraLettersCount;
      },

      /**
      * Devuelve la ubicación inicial y la orientación de las palabras especificadas
       * dentro del rompecabezas. Cualquier palabra que no se encuentre se devuelve en el
       * notFound array.
       * *
       * Devoluciones
       * x posición de inicio de palabra
       * y posición de inicio de palabra
       * orientación de la palabra
       *   palabra
       * superposición (siempre igual a word.length)
      *
      * @param {[[String]]} puzzle: El estado actual de la sopa 
      * @param {[String]} words: La lista de palabras que buscar
      * @api public
      */
      solve: function (puzzle, words) {
        var options = {
              height:       puzzle.length,
              width:        puzzle[0].length,
              orientations: allOrientations,
              preferOverlap: true
            },
            found = [],
            notFound = [];

        for(var i = 0, len = words.length; i < len; i++) {
          var word = words[i],
              locations = findBestLocations(puzzle, options, word);

          if (locations.length > 0 && locations[0].overlap === word.length) {
            locations[0].word = word;
            found.push(locations[0]);
          } else {
            notFound.push(word);
          }
        }

        return { found: found, notFound: notFound };
      },

      /**
      * Envía un rompecabezas a la consola, útil para la depuración.
       * Devuelve una cadena formateada que representa el rompecabezas.
      *
      * @param {[[String]]} puzzle: El estado actual del rompecabezas.
      * @api public
      */
      print: function (puzzle) {
        var puzzleString = '';
        for (var i = 0, height = puzzle.length; i < height; i++) {
          var row = puzzle[i];
          for (var j = 0, width = row.length; j < width; j++) {
            puzzleString += (row[j] === '' ? ' ' : row[j]) + ' ';
          }
          puzzleString += '\n';
        }

        console.log(puzzleString);
        return puzzleString;
      }
    };
  };

  /**
  * Permitir que la biblioteca se use tanto en el navegador como en node.js
  */
  var root = typeof exports !== "undefined" && exports !== null ? exports : window;
  root.wordfind = Sopa();

}).call(this);
