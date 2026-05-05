let lcd = null; // displayen
let isResult = false; // Håller koll på om displayen visar ett slutresultat
let lastExpression = ''; // Sparar den senaste fullständiga uträkningen

let isComma = false;

function init() {
    if (!document.getElementById('lcd')) return; // Säkerhetskoll
    lcd = document.getElementById('lcd');

    // Vänta tills typsnittet är laddat innan vi mäter textstorlek, annars blir det fel på Android
    document.fonts.ready.then(() => {
        adjustFontSize();
    });

    let keyBoard = document.getElementById('keyBoard');
    keyBoard.onpointerdown = buttonClick;

    // Initiera valutaomvandlare
    getRates(); // Hämta kurser direkt vid start för att visa datum

    const convertBtn = document.getElementById('convertBtn');
    convertBtn.onpointerdown = convertCurrency;
    
    // Lokalisering av knapptext
    if (!navigator.language.startsWith('sv')) {
        convertBtn.textContent = 'Convert Amount';
    }

    document.getElementById('swapBtn').onpointerdown = swapCurrencies;
    
    // Starta animationen
    typeWriter("BYGREN", 0);
}

/**
 * Skriver ut text bokstav för bokstav i displayen
 */
function typeWriter(text, i) {
    // Avbryt animationen om användaren redan börjat skriva något
    if (i > 0 && lcd.textContent !== text.substring(0, i)) return;

    if (i < text.length) {
        // Om det är första bokstaven, ersätt startvärdet (t.ex. "0") istället för att lägga till
        if (i === 0) {
            lcd.textContent = text.charAt(i);
        } else {
            lcd.textContent += text.charAt(i);
        }
        adjustFontSize();
        setTimeout(() => typeWriter(text, i + 1), 150); // Hastighet: 150ms per bokstav
    } else {
        // Vänta 1 sekund efter att hela ordet skrivits ut och växla sedan till 0
        setTimeout(() => {
            if (lcd.textContent === text) {
                clearLCD();
            }
        }, 1000);
    }
}

/**
 * Händelsehanterare för kalkylatorns tangentbord
 */
function buttonClick(e) {
    let btnElement = e.target.closest('button');
    if (!btnElement) return;
    let btn = btnElement.id;

    // kollar om siffertangent är nedtryckt
    if (btn.substring(0, 1) === 'b' && btn !== 'back') {
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
            case 'back':
                backspace(); // Raderar sista tecknet
                break;
            case 'para':
                addParenthesis(); // Hanterar parenteser
                break;

            case 'add':
            case 'sub':
            case 'mul':
            case 'div':
            case 'pow':
                setOperator(btn); // Lägger till operator i uttrycket
                break;
        }
    }
}

/**
 *  Lägger till siffra på display.
 */
function addDigit(digit) {
    // Om displayen visar 0, Error eller fortfarande kör start-animationen
    if (isResult || lcd.textContent === '0' || lcd.textContent === 'Error' || /[A-Z]/.test(lcd.textContent)) {
        document.getElementById('history').textContent = '';
        lcd.textContent = digit;
        isResult = false;
    } else {
        lcd.textContent += digit;
    }
    adjustFontSize();
}

/**
 * Lägger till decimaltecken
 */
function addComma() {
    if (isResult) isResult = false;
    document.getElementById('history').textContent = '';

    if (!isComma) {
        let content = lcd.textContent;
        
        // Om valuta visas, starta om med en ny decimal siffra (0.)
        if (/[A-Z]/.test(content) && content !== 'Error' && content !== 'BYGREN') {
            lcd.textContent = "0.";
            isComma = true;
            adjustFontSize();
            return;
        }

        const lastChar = content.slice(-1);
        // Om displayen slutar på en operator eller är tom, lägg till en inledande nolla
        if (content === '' || isNaN(parseInt(lastChar))) {
            lcd.textContent += "0.";
        } else {
            lcd.textContent += ".";
        }
        isComma = true;
    }
    adjustFontSize();
}

/**
 * Hanterar parenteser i uttrycket
 */
function addParenthesis() {
    if (isResult) isResult = false;
    document.getElementById('history').textContent = '';

    let content = lcd.textContent;

    // Om valuta visas, extrahera talet så vi kan använda implicit multiplikation (t.ex. 100() blir 100*() )
    if (/[A-Z]/.test(content) && content !== 'Error' && content !== 'BYGREN') {
        content = parseFloat(content).toString();
        lcd.textContent = content;
    }

    if (content === '0' || content === 'Error' || /[A-Z]/.test(content)) {
        lcd.textContent = '(';
    } else {
        const openCount = (content.match(/\(/g) || []).length;
        const closeCount = (content.match(/\)/g) || []).length;
        const lastChar = content.slice(-1);

        if (openCount > closeCount && (!isNaN(parseInt(lastChar)) || lastChar === ')')) {
            lcd.textContent += ')';
        } else {
            lcd.textContent += '(';
        }
    }
    isComma = false;
    adjustFontSize();
}

/**
 * Raderar sista tecknet på displayen
 */
function backspace() {
    let content = lcd.textContent;

    // Om vi visar ett resultat och trycker backspace, återställ hela uträkningen
    if (isResult) {
        lcd.textContent = lastExpression;
        isResult = false;
        document.getElementById('history').textContent = '';
        adjustFontSize();
        return;
    }

    // Om valuta visas, ta bara bort valutakoden och behåll talet för vidare redigering
    if (/[A-Z]/.test(content) && content !== 'Error' && content !== 'BYGREN') {
        lcd.textContent = parseFloat(content);
        isComma = lcd.textContent.includes('.');
        adjustFontSize();
        return;
    }

    if (content !== '0') {
        lcd.textContent = content.slice(0, -1);
        // Om displayen blir tom eller bara har ett minustecken kvar, återställ till 0
        if (lcd.textContent === '' || lcd.textContent === '-') {
            lcd.textContent = '0';
        }
        // Kontrollera om det aktuella talet vi raderar i har en decimalpunkt
        const parts = lcd.textContent.split(/[\+\-×÷\^]/);
        const lastPart = parts[parts.length - 1];
        isComma = lastPart.includes('.');
        adjustFontSize();
    }
}

/**
 * Sparar operator.
 */
function setOperator(operator) {
    let symbol = '';
    if (isResult) {
        isResult = false;
        document.getElementById('history').textContent = '';
    }
    const operators = ['+', '-', '×', '÷', '^'];
    
    switch (operator) {
        case 'add': symbol = '+'; break;
        case 'sub': symbol = '-'; break;
        case 'mul': symbol = '×'; break;
        case 'div': symbol = '÷'; break;
        case 'pow': symbol = '^'; break;
    }

    let content = lcd.textContent;

    // Om displayen innehåller valuta, fortsätt beräkna med det numeriska värdet
    if (/[A-Z]/.test(content) && content !== 'Error' && content !== 'BYGREN') {
        lcd.textContent = parseFloat(content) + symbol;
    } else if (content === '0' || content === 'Error' || /[A-Z]/.test(content)) {
        if (symbol === '-') lcd.textContent = '-';
        else lcd.textContent = '0' + symbol;
    } else if (operators.includes(content.slice(-1))) {
        // Om sista tecknet redan är en operator, byt ut den istället för att lägga till en ny
        lcd.textContent = content.slice(0, -1) + symbol;
    } else {
        lcd.textContent += symbol;
    }
    isComma = false; // Tillåt decimalpunkt för nästa tal i uttrycket
    adjustFontSize();
}

/**
 * Beräknar ovh visar resultatet på displayen.
 */
function calculate() {
    try {
        let rawContent = lcd.textContent.trim();

        // Om displayen innehåller valuta, ta bort den så att beräkningen kan fortsätta med bara talet
        if (/[A-Z]/.test(rawContent) && rawContent !== 'Error' && rawContent !== 'BYGREN') {
            rawContent = parseFloat(rawContent).toString();
        }

        // Hantera ofullständiga parenteser för visning i historiken
        const openCount = (rawContent.match(/\(/g) || []).length;
        const closeCount = (rawContent.match(/\)/g) || []).length;
        if (openCount > closeCount) {
            rawContent += ')'.repeat(openCount - closeCount);
        }
        lastExpression = rawContent;
        document.getElementById('history').textContent = rawContent;

        // Ersätt de visuella symbolerna med matematiska operatorer innan beräkning
        let expression = rawContent
            .replace(/\u00A0/g, ' ')      // Ersätt hårda mellanslag (NBSP) med vanliga
            .replace(/\s/g, '')           // Ta bort ALLA mellanslag
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/[–—]/g, '-');       // Hantera iOS "Smart Punctuation" (en-dash/em-dash) till minus

        let result = math.evaluate(expression);
        
        if (!isFinite(result)) {
            lcd.textContent = "Error";
        } else {
            // Begränsa antalet decimaler för att inte spräcka displayen
            if (result.toString().includes('.') && result.toString().split('.')[1].length > 8) {
                result = parseFloat(result.toFixed(8));
            }
            lcd.textContent = result;
        }
        isResult = true;
    } catch (e) {
        lcd.textContent = "Error";
        isResult = true;
    }
    isComma = lcd.textContent.toString().includes('.');
    adjustFontSize();
}

/**
 * Justerar fontstorleken baserat på antal tecken i displayen
 */
function adjustFontSize() {
    let currentFontSize = 65;

    // 1. Skapa ett osynligt skuggelement om det inte redan finns
    let ruler = document.getElementById('lcd-ruler');
    if (!ruler) {
        ruler = document.createElement('span');
        ruler.id = 'lcd-ruler';
        
        // Dölj elementet men behåll det i DOM:en så det går att mäta
        ruler.style.visibility = 'hidden'; 
        ruler.style.position = 'absolute'; 
        ruler.style.top = '0';
        ruler.style.left = '0';
        ruler.style.zIndex = '-1000';
        ruler.style.pointerEvents = 'none';
        ruler.style.whiteSpace = 'nowrap'; // Förhindrar radbrytningar
        document.body.appendChild(ruler);
    }

    // 2. Kopiera texten och typsnittet från LCD:n till skuggelementet
    ruler.textContent = lcd.textContent;
    ruler.style.fontFamily = window.getComputedStyle(lcd).fontFamily;
    ruler.style.fontSize = currentFontSize + 'px';
    ruler.style.lineHeight = '1';

    // 3. Räkna ut exakt hur mycket plats vi har att leka med i rutan
    // clientWidth inkluderar padding, så vi måste dra bort den.
    const computedStyle = window.getComputedStyle(lcd);
    const paddingLeft = parseFloat(computedStyle.paddingLeft);
    const paddingRight = parseFloat(computedStyle.paddingRight);
    const availableWidth = lcd.clientWidth - paddingLeft - paddingRight;

    // 4. Mät och krymp på SKUGGELEMENTET (offsetWidth mäter bredden direkt)
    while (ruler.offsetWidth > availableWidth && currentFontSize > 13) {
        currentFontSize -= 1;
        ruler.style.fontSize = currentFontSize + 'px';
    }

    // 5. Tillämpa den slutgiltiga, uträknade storleken på den riktiga rutan
    lcd.style.fontSize = currentFontSize + 'px';
}

/** Rensar display */
function clearLCD() {
    lcd.textContent = '0';
    document.getElementById('history').textContent = '';
    isComma = false;
    adjustFontSize();
}

/** Rensar allt, reset */
function memClear() {
    clearLCD();
}

// Säkrare initiering för PWA
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
