let lcd = null; // displayen

let memory = 0; // Lagrat/gamla värdet från display
let arithmetic = null; // Vilken beräkning som skall göras +,-, x eller /

function init() {
    lcd = document.getElementById('lcd');
    let keyBoard = document.getElementById('keyBoard')
    keyBoard.onclick = buttonClick;
}

/**
 * Händelsehanterare för kalkylatorns tangentbord
 */
function buttonClick(e) {
    let btn = e.target.id; //id för den tangent som tryckte ner

    // kollar om siffertangent är nedtryckt
    if (btn.substring(0, 1) === 'b') {
        let digit = btn.substring(1, 2); // plockar ut siffran från id:et
        addDigit(digit);    // Läger till siffran på display
    } else {
        switch (btn) {
            case 'comma':
                addComma(); // Läger till komma
                break;
            case 'clear':
                memClear(); // Raderar minne och display
                break;
            case 'enter':
                calculate();// Beräknar ett resultat
                break;

            case 'add':
            case 'sub':
            case 'mul':
            case 'div':
                setOperator(btn); // Sparar operatsrn (+, -, *, /)
                break;
        }
    }
}

/**
 *  Lägger till siffra på display.
 */
function addDigit(digit) {
    lcd.value += digit;
}

/**
 * Lägger till decimaltecken
 */
function addComma() {
    if (!isComma) {
        if (lcd.value === '')
            lcd.value += "0.";
        else
            lcd.value += ".";
        isComma = true;
    }
}

/**
 * Sparar operator.
 */
function setOperator(operator){
    memory = parseFloat(lcd.value); // Sparar displyens värde
    // En operatorär redan vald. Då skall den först utföras
    if (arithmetic != null){
        calculate();
    }else{
        clearLCD(); // Rensar display för att kunna mata in  nytt värde.
    }
    arithmetic = operator;
}

/**
 * Beräknar ovh visar resultatet på displayen.
 */
function calculate() {
    if (arithmetic != null) {
        let result = 0;
        let valueFromLCD = parseFloat(lcd.value);
        switch (arithmetic) {
            case 'add':
                result = parseFloat(memory) + valueFromLCD;
                break;
            case 'sub':
                result = parseFloat(memory) - valueFromLCD;
                break;
            case 'mul':
                result = parseFloat(memory) * valueFromLCD;
                break;
            case 'div':
                result = parseFloat(memory) / valueFromLCD;
                break;
        }

        memClear();
        memory = lcd.value = result;
    }
}

/** Rensar display */
function clearLCD() {
    lcd.value = '';
    isComma = false;
}

/** Rensar allt, reset */
    function memClear(){
    memory = 0;
    arithmetic = null;
    clearLCD();
}

window.onload = init;
