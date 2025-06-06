// Language-aware result page rendering
let resultStrings = null;
let currentLang = 'en';

function showresult(modalMode) {
    $root.find('.result-label')
    // Load result strings if not already loaded
    if (!resultStrings) {
        $.ajax({
            url: 'assets/js/result_strings.json?v=4',
            dataType: 'json',
            async: false,
            success: function(data) { resultStrings = data; },
            error: function() { resultStrings = null; }
        });
    }
    // Try to detect language from quiz (fallback to en)
    if (window.selectedQuizLang) {
        currentLang = window.selectedQuizLang;
    } else if (typeof getCurrentQuizLang === 'function') {
        currentLang = getCurrentQuizLang();
    }
    if (!resultStrings || !resultStrings[currentLang]) currentLang = 'en';
    const strings = resultStrings[currentLang];

    // Update result page text and layout
    $root.find('.result-title').text(strings.knowledge_check);
    let correctNum = 0;
    let totalNum = 0;
    if (typeof questions !== 'undefined' && questions.length && window.userAnswers) {
        totalNum = questions.length;
        // Debug: log user answers and correct answers
        console.log('userAnswers:', window.userAnswers);
        console.log('correctAnswers:', questions.map(q => q.correct));
        // Count correct answers, robust to type
        correctNum = questions.filter((q, i) => String(window.userAnswers[i]) === String(q.correct)).length;
        // Warn if any answers are missing
        if (window.userAnswers.length < questions.length || window.userAnswers.includes(undefined)) {
            console.warn('Some answers are missing or undefined:', window.userAnswers);
        }
    }
    if (!totalNum) totalNum = 10;
    if (typeof correctNum !== 'number' || isNaN(correctNum)) correctNum = 0;
    // Always show 8/10 for passing
    const passingNum = 8;
    // Localize labels
    $('.result_page .result-label').eq(0).text(strings.your_score);
    $('.result_page .result-label').eq(1).text(strings.passing_score);
    $root.find('.result-correct').text(`${correctNum} / ${totalNum}`);
    $root.find('.result-passing').text(`${passingNum} / ${totalNum}`);
    // Debug: log to confirm update
    console.log('Updated result-correct:', $root.find('.result-correct').text());
    console.log('Updated result-passing:', $root.find('.result-passing').text());
    // Debug: log to confirm update
    console.log('Updated result-correct:', $('.result-correct').text());
    console.log('Updated result-passing:', $('.result-passing').text());

    // Pass/fail logic
    const isPass = correctNum >= passingNum;
    const statusText = isPass ? strings.pass : strings.fail;
    const msgText = isPass ? strings.pass_msg : strings.fail_msg;
    $root.find('.result-status').text(statusText);
    $root.find('.result_msg').text(msgText);
    // Add the resource link
    $root.find('.result_link').html(`
        <span style="vertical-align:middle;display:inline-block;margin-right:8px;">
            <i class="fa-solid fa-circle-info" style="color:#0042ff;font-size:22px;"></i>
        </span>
        <a href="${strings.link_url}" target="_blank" rel="noopener" style="color:#0042ff;font-weight:bold;text-decoration:underline;vertical-align:middle;">${strings.link_url}</a>
    `);

    // Show loading, then reveal result page
    if (!modalMode) {
    $('.loadingresult').css('display', 'grid');
    setTimeout(function() {
        $('.result-correct')[0]?.offsetHeight;
        $('.result-passing')[0]?.offsetHeight;
        $('.result_page').addClass('result_page_show');
    }, 1000);
}
}

        
        
// Load questions from JSON and render quiz dynamically
let questions = [];
// Always use window.userAnswers as the global answer array
window.userAnswers = [];


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Load questions with language support
function loadQuestions(lang = 'en') {
    let file = 'assets/js/questions.json';
    let useLang = lang;
    if (lang === 'ja') {
        file = 'assets/js/questions_ja.json';
        useLang = 'ja';
    }
    $.getJSON(file, function(data) {
        // Always use 10 questions for both EN and JA
        const shuffled = shuffleArray(data.slice());
        questions = shuffled.slice(0, 10);
        // Reset global userAnswers to correct length, all undefined
        window.userAnswers = new Array(questions.length);
        // Set currentLang for localization
        currentLang = useLang;
        renderQuiz();
        // Update total question count in navigation UI (step-number-inner)
        $("#totalQuestions").text(questions.length);
        // Update step-bar to match number of questions
        const barContainer = $(".step-bar");
        if (barContainer.length) {
            barContainer.empty();
            for (let i = 0; i < questions.length; i++) {
                barContainer.append('<div class="bar"><div class="fill"></div></div>');
            }
        }
    });
}

function renderQuiz() {
    // Ensure localization is loaded before rendering
    if (!resultStrings) {
        $.ajax({
            url: 'assets/js/result_strings.json',
            dataType: 'json',
            async: false,
            success: function(data) { resultStrings = data; },
            error: function() { throw new Error('Could not load result_strings.json'); }
        });
    }
    if (!resultStrings[currentLang] || !resultStrings[currentLang].hint_label) {
        console.error('Missing localized hint_label for language:', currentLang);
        throw new Error('Missing localized hint_label for language: ' + currentLang);
    }
    let hintLabel = resultStrings[currentLang].hint_label;

    // Add style for correct answer reveal animation if not present
    if (!document.getElementById('correct-reveal-style')) {
        const style = document.createElement('style');
        style.id = 'correct-reveal-style';
        style.innerHTML = `
            .correct-reveal {
                animation: correctRevealBorder 0.7s;
                border: 2.5px solid #2ecc40 !important;
                box-sizing: border-box;
            }
            @keyframes correctRevealBorder {
                0% { border-color: #fff; }
                50% { border-color: #2ecc40; }
                100% { border-color: #fff; }
            }
        `;
        document.head.appendChild(style);
    }
    // Add modal HTML if not present
    if (!document.getElementById('hintModalOverlay')) {
        // Use localized hint label for modal header, and enforce presence
        if (!resultStrings || !resultStrings[currentLang] || !resultStrings[currentLang].hint_label) {
            console.error('Missing localized hint_label for language:', currentLang);
            throw new Error('Missing localized hint_label for language: ' + currentLang);
        }
        let hintLabel = resultStrings[currentLang].hint_label;
        const modalHtml = `
            <div id="hintModalOverlay" style="display:none;">
                <div id="hintModal">
                    <div id="hintModalHeader">
                        ${hintLabel}
                        <button id="hintModalClose" aria-label="Close">&times;</button>
                    </div>
                    <div id="hintModalBody"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Always reset and update navigation UI (step bar and question count)
    const quizContainer = $('.show-section.wrapper');
    quizContainer.empty();

    // Update total question count in step-number-inner (dynamic)
    if ($('#totalQuestions').length) {
        $('#totalQuestions').text(questions.length);
    }
    if ($('#activeStep').length) {
        $('#activeStep').text(1);
    }

    // Remove all static bars and regenerate step bar
    const barContainer = $(".step-bar");
    if (barContainer.length) {
        barContainer.empty();
        for (let i = 0; i < questions.length; i++) {
            barContainer.append('<div class="bar"><div class="fill"></div></div>');
        }
    }

    questions.forEach((q, idx) => {
        const stepNum = idx + 1;
        let answersHtml = '';
        q.answers.forEach((ans, aidx) => {
            answersHtml += `
                <div class="${aidx ? 'delay-' + (aidx * 100) : ''} bounce-left radio-field">
                    <input class="checkmark" type="radio" name="op${stepNum}" value="${ans}">
                    <label><span class="answer-text">${ans}</span><span class="answer-icon"></span></label>
                </div>
            `;
        });
        // Always show hint button if there are hints remaining and a hint_text exists
        let hintBtn = '';
        if (q.hint_text) {
            // Use localized hint_label for the button text, and enforce presence
            if (!resultStrings || !resultStrings[currentLang] || !resultStrings[currentLang].hint_label) {
                console.error('Missing localized hint_label for language:', currentLang);
                throw new Error('Missing localized hint_label for language: ' + currentLang);
            }
            let hintLabel = resultStrings[currentLang].hint_label;
            hintBtn = `<button type="button" class="hint-btn" data-hint-text="${q.hint_text.replace(/"/g, '&quot;')}" title="Show hint" style="position:relative;">
                <span class="hint-badge"><i class="fa-solid fa-lightbulb"></i></span> ${hintLabel}
                <span class="hint-notification-badge">3</span>
            </button>`;
        }
        quizContainer.append(`
            <section class="steps">
                <form id="step${stepNum}" method="post" novalidate>
                    <h2 class="q-heading">${q.question}</h2>
                    ${hintBtn}
                    <div class="form-inner">${answersHtml}</div>
                    <div class="next-prev">
                        ${stepNum === questions.length ? `<button type="button" class="apply" id="sub">Submit<i class="fa-solid fa-arrow-right"></i></button>` : ''}
                    </div>
                </form>
            </section>
        `);
    });
    // Add question mark image
    quizContainer.append('<div class="question overflow-hidden"><img src="assets/images/question-sign.png" alt="question"></div>');

    // Add floating hint button styles if not already present
    if (!document.getElementById('hint-btn-style')) {
        const style = document.createElement('style');
        style.id = 'hint-btn-style';
        style.innerHTML = `
            .hint-btn {
                position: fixed !important;
                top: 83px;
                right: 32px;
                z-index: 2147483646;
                background: #fffbe6;
                color: #0042ff;
                border-radius: 20px;
                padding: 6px 16px 6px 12px;
                font-weight: bold;
                box-shadow: 0 2px 8px rgba(0,0,0,0.07);
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                border: 1px solid #ffe066;
                transition: background 0.2s, color 0.2s;
                position: fixed;
                overflow: visible;
            }
            .hint-btn .hint-notification-badge {
                position: absolute;
                left: -10px;
                bottom: -10px;
                background: #ff4d4f;
                color: #fff;
                border-radius: 50%;
                font-size: 12px;
                width: 20px;
                height: 20px;
                line-height: 20px;
                text-align: center;
                font-weight: bold;
                pointer-events: none;
                box-shadow: 0 1px 4px rgba(0,0,0,0.10);
            }
            .hint-btn:hover {
                background: #ffe066;
                color: #222;
            }
            @media (max-width: 600px) {
                .hint-btn {
                    top: 75px;
                    right: 12px;
                    padding: 6px 10px 6px 10px;
                    font-size: 14px;
                }
            }

            /* Centered modal overlay and modal styles */
            #hintModalOverlay {
                position: fixed !important;
                top: 0; left: 0; right: 0; bottom: 0;
                width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.35);
                z-index: 2147483647 !important;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }
            #hintModal {
                background: #fff;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.18);
                max-width: 90vw;
                width: 480px;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                position: relative;
            }
            #hintModalBody {
                padding: 28px 28px 32px 28px;
                font-size: 1.08rem;
                color: #222;
                line-height: 1.6;
                word-break: break-word;
            }
            #hintModalHeader {
                font-size: 1.2rem;
                font-weight: bold;
                background: #f6f6f6;
                padding: 16px 20px 16px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid #eee;
            }
            #hintModalClose {
                background: none;
                border: none;
                font-size: 1.3rem;
                cursor: pointer;
                color: #333;
                margin-left: 12px;
                padding: 0 6px;
                border-radius: 4px;
                transition: background 0.2s;
            }
            #hintModalClose:hover {
                background: #eee;
            }
            #hintModalIframe {
                border: none;
                width: 100%;
                height: 350px;
                flex: 1 1 auto;
                background: #fafafa;
            }
            @media (max-width: 600px) {
                #hintModal {
                    width: 98vw;
                    min-width: 0;
                    max-width: 98vw;
                    border-radius: 8px;
                }
                #hintModalHeader {
                    padding: 12px 10px 12px 10px;
                }
                #hintModalIframe {
                    height: 200px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function countresult() {
    let correct = 0;
    // Do NOT reset window.userAnswers here; just read from it
    questions.forEach((q, idx) => {
        const stepNum = idx + 1;
        // Get the selected value for this question
        const val = $(`#step${stepNum} .radio-field input:checked`).val();
        // Update window.userAnswers at the correct index
        window.userAnswers[idx] = val;
        // Remove any previous icons and incorrect borders
        $(`#step${stepNum} .radio-field label .answer-icon`).empty();
        $(`#step${stepNum} .radio-field`).removeClass('incorrect');
        // Mark correct/incorrect
        $(`#step${stepNum} .radio-field`).each(function() {
            const input = $(this).find('input');
            const iconSpan = $(this).find('.answer-icon');
            // Only show icon for the selected answer
            if (input.is(':checked')) {
                if (input.val() === q.correct) {
                    iconSpan.html('<i class="fa-solid fa-check" style="color:green"></i>');
                } else {
                    iconSpan.html('<i class="fa-solid fa-xmark" style="color:red"></i>');
                    $(this).addClass('incorrect');
                }
            }
        });
        if(val === q.correct) {
            correct++;
        }
    });
    // Disable all radio buttons after submission
    $('input[type="radio"]').prop('disabled', true);
    const steps = questions.length;
    var correctprcnt = correct / steps * 100;
    $('.u_prcnt').html(correctprcnt + '%');
    $('.u_result span').html(correctprcnt + ' Points');
    if (!resultStrings) {
        $.ajax({
            url: 'assets/js/result_strings.json',
            dataType: 'json',
            async: false,
            success: function(data) { resultStrings = data; },
            error: function() { resultStrings = null; }
        });
    }
    if (window.selectedQuizLang) {
        currentLang = window.selectedQuizLang;
    } else if (typeof getCurrentQuizLang === 'function') {
        currentLang = getCurrentQuizLang();
    }
    if (!resultStrings || !resultStrings[currentLang]) currentLang = 'en';
    const strings = resultStrings[currentLang];
    if(correctprcnt >=80)
    {
        $('.pass_check').html('<i class="fa-solid fa-check"></i> ' + strings.pass);
        $('.result_msg').html(strings.pass_msg);
    } else {
        $('.pass_check').html('<i class="fa-solid fa-xmark"></i>' + strings.fail);
        $('.result_msg').html(strings.fail_msg);
    }
}

// Call loadQuestions on page load

$(document).ready(function() {
    // Hints logic
    let hintsRemaining = 3;
    let usedHints = [];
    function updateHintBadge() {
        $('.hint-notification-badge').text(hintsRemaining);
        if (hintsRemaining <= 0) {
            $('.hint-btn').hide();
        } else {
            $('.hint-btn').show();
        }
    }
    // On quiz render, reset hints and usedHints
    $(document).on('quizRendered', function() {
        hintsRemaining = 3;
        usedHints = [];
        updateHintBadge();
    });

    // Hint modal open/close logic
    $(document).on('click', '.hint-btn', function() {
        if (hintsRemaining <= 0) return;
        // Determine the current question index
        const $section = $(this).closest('section');
        const currentIdx = $section.index();
        // Only decrement and update badge the first time for this question
        if (!usedHints.includes(currentIdx)) {
            usedHints.push(currentIdx);
            hintsRemaining--;
            updateHintBadge();
        }
        // Show the hint modal as usual
        var text = $(this).attr('data-hint-text') || '';
        let hintLabel = (resultStrings && resultStrings[currentLang] && resultStrings[currentLang].hint_label) ? resultStrings[currentLang].hint_label : 'Hint';
        let hintLabelRegex = new RegExp('^\s*' + hintLabel + '\s*:?\s*', 'i');
        text = text.replace(hintLabelRegex, '');
        var hintsToShow = Math.max(hintsRemaining, 0);
        let hintWindowText = (resultStrings && resultStrings[currentLang] && resultStrings[currentLang].hint_window_text) ? resultStrings[currentLang].hint_window_text : 'Hints remaining';
        const hintFooter = `<div style=\"margin-top:18px;font-size:0.98rem;color:#666;text-align:center;\">${hintsToShow} ${hintWindowText}</div>`;
        $('#hintModalBody').html(text + hintFooter);
        $('#hintModalOverlay').show();
    });
    function closeHintModalAndDecrement() {
        $('#hintModalOverlay').hide();
        $('#hintModalBody').text('');
        // Only decrement if a hint was open and not already decremented
        if ($('#hintModalOverlay').data('pendingHintDecrement')) {
            hintsRemaining--;
            updateHintBadge();
            $('#hintModalOverlay').data('pendingHintDecrement', false);
        }
    }
    $(document).on('click', '#hintModalClose', function() {
        closeHintModalAndDecrement();
    });
    // Optional: close modal when clicking outside
    $(document).on('click', '#hintModalOverlay', function(e) {
        if (e.target === this) {
            closeHintModalAndDecrement();
        }
    });
    // Language selection modal logic
    function startQuizWithLang(lang) {
        $('#languageModal').hide();
        $('#mainContent').css('filter', '');
        loadQuestions(lang);
    }
    $('#lang-en').on('click', function() { startQuizWithLang('en'); });
    $('#lang-ja').on('click', function() { startQuizWithLang('ja'); });
    // If modal is not present (fallback), default to English
    if ($('#languageModal').length === 0) {
        loadQuestions('en');
    }

    // Navigation logic (next/prev/submit)
    function updateStepBar(currentIdx) {
        // Remove w-100 from all, then add to those up to currentIdx
        $(".step-bar .bar .fill").removeClass('w-100');
        for (let i = 0; i <= currentIdx; i++) {
            $(".step-bar .bar").eq(i).find('.fill').addClass('w-100');
        }
    }

    // Remove all .next button logic (auto-advance will be handled below)
    $(document).on('click', '.prev', function() {
        const currentSection = $(this).closest('section');
        const prevSection = currentSection.prev('section');
        if(prevSection.length) {
            currentSection.hide();
            prevSection.show();
            // Update step number
            const idx = prevSection.index();
            $('#activeStep').text(idx + 1);
            updateStepBar(idx);
        }
    });

    $(document).on('click', '#sub', function() {
    $('.show-section.wrapper section').hide();
    $(this).blur();
    setTimeout(function() {
        countresult();
        showresult(true); // pass true to indicate modal
        showResultModal();
    }, 100);
});

    // INSTANT FEEDBACK: Show check/cross icon and red border immediately on answer selection
    $(document).on('change', 'input[type="radio"]', function() {
        // Only allow instant feedback if radios are not disabled (i.e., before submit)
        if ($(this).prop('disabled')) return;
        // Remove all icons and incorrect borders for this question
        const section = $(this).closest('section');
        section.find('.radio-field label .answer-icon').empty();
        section.find('.radio-field').removeClass('incorrect');
        // Find the question index
        const formId = section.find('form').attr('id');
        const stepNum = parseInt(formId.replace('step', ''));
        const q = questions[stepNum - 1];
        // --- Update global userAnswers array immediately on every answer selection ---
        window.userAnswers[stepNum - 1] = $(this).val();

        // --- Debug: Show current score in console and optionally on page ---
        const debugCorrect = questions.filter((q, i) => String(window.userAnswers[i]) === String(q.correct)).length;
        const debugTotal = questions.length;
        console.log(`[DEBUG] Current score: ${debugCorrect} / ${debugTotal}`, window.userAnswers);
        // Optionally, show live score in a fixed corner (uncomment to enable on page)
        /*
        if (!document.getElementById('liveScoreDebug')) {
            const div = document.createElement('div');
            div.id = 'liveScoreDebug';
            div.style.position = 'fixed';
            div.style.bottom = '16px';
            div.style.right = '16px';
            div.style.background = 'rgba(0,0,0,0.7)';
            div.style.color = '#fff';
            div.style.padding = '8px 16px';
            div.style.borderRadius = '8px';
            div.style.zIndex = 99999;
            div.style.fontSize = '18px';
            document.body.appendChild(div);
        }
        document.getElementById('liveScoreDebug').textContent = `Score: ${debugCorrect} / ${debugTotal}`;
        */
        let isCorrect = false;
        let isWrong = false;
        let selectedInput = null;
        // First, clear only the incorrect/correct-reveal classes, but do NOT clear icons yet
        section.find('.radio-field').removeClass('incorrect correct-reveal');
        let correctRadioField = null;
        section.find('.radio-field').each(function() {
            const input = $(this).find('input');
            const iconSpan = $(this).find('.answer-icon');
            if (input.val() === q.correct) {
                correctRadioField = $(this);
            }
            if (input.is(':checked')) {
                selectedInput = input;
                if (input.val() === q.correct) {
                    iconSpan.html('<i class="fa-solid fa-check" style="color:green"></i>');
                    isCorrect = true;
                } else {
                    iconSpan.html('<i class="fa-solid fa-xmark" style="color:red"></i>');
                    $(this).addClass('incorrect');
                    isWrong = true;
                }
            }
        });
        // If correct, auto-advance after a short delay (for animation), but NOT on last question
        if (isCorrect && stepNum < questions.length) {
            setTimeout(function() {
                section.hide();
                const nextSection = section.next('section');
                if(nextSection.length) {
                    nextSection.show();
                    // Update step number
                    const idx = nextSection.index();
                    $('#activeStep').text(idx + 1);
                    updateStepBar(idx);
                }
            }, 900); // 900ms delay for animation
        } else if (isWrong && stepNum < questions.length) {
            // Pulse (jiggle) the correct answer after the wrong animation
            setTimeout(function() {
                if (correctRadioField) {
                    // Find the label span for the answer text
                    var answerTextSpan = correctRadioField.find('.answer-text');
                    // Add green border to the nearest .radio-field div (in case structure changes)
                    var radioFieldDiv = answerTextSpan.closest('.radio-field');
                    radioFieldDiv.addClass('flash-green-border flash-black-stroke');
                    // Make text green and bold for the flash
                    answerTextSpan.addClass('flash-green');
                    answerTextSpan.css({
                        'color': '#2ecc40',
                        'font-weight': 'bold'
                    });
                    // Remove the animation class and extra styles after it finishes (1200ms)
                    setTimeout(function() {
                        answerTextSpan.removeClass('flash-green');
                        answerTextSpan.css({
                            'color': '',
                            'font-weight': ''
                        });
                        radioFieldDiv.removeClass('flash-green-border flash-black-stroke');
                    }, 1200);
                }
                // Wait for the animation to be visible, then move to next question (unless last question)
                setTimeout(function() {
                    // Now clear all icons (after animation), then move on
                    section.find('.radio-field .answer-icon').empty();
                    if (stepNum < questions.length) {
                        section.hide();
                        const nextSection = section.next('section');
                        if(nextSection.length) {
                            nextSection.show();
                            // Update step number
                            const idx = nextSection.index();
                            $('#activeStep').text(idx + 1);
                            updateStepBar(idx);
                        }
                    }
                    // If last question, stay and let highlight show
                }, 1400); // 1400ms after flash
            }, 900); // 900ms after wrong animation
        }
    // Add style for correct answer reveal animation if not present
    if (!document.getElementById('correct-reveal-style')) {
        const style = document.createElement('style');
        style.id = 'correct-reveal-style';
        style.innerHTML = `
            .flash-green {
                animation: flashGreenText 1.2s cubic-bezier(.36,.07,.19,.97) both;
            }
            @keyframes flashGreenText {
                0% { color: #222; }
                10% { color: #2ecc40; }
                30% { color: #2ecc40; }
                50% { color: #fff; }
                70% { color: #2ecc40; }
                100% { color: #222; }
            }
            .flash-green-border {
                border: 3px solid #2ecc40 !important;
                border-radius: 10px;
                transition: border 0.2s;
            }
            .flash-black-stroke {
                box-shadow: 0 0 0 2px #111, 0 0 0 0 #2ecc40;
            }
        `;
        document.head.appendChild(style);
    }
    });

    // Show only the first question at start
    $(document).on('quizRendered', function() {
        $('section').hide();
        $('section').first().show();
        $('#activeStep').text(1);
        // Reset step-bar fill using w-100 class
        $(".step-bar .bar .fill").removeClass('w-100');
        $(".step-bar .bar").eq(0).find('.fill').addClass('w-100');
    });
    // Trigger after rendering
    $(document).ajaxStop(function() {
        $(document).trigger('quizRendered');
    });

    // --- Result Modal Implementation ---
function ensureResultModal() {
    if (!document.getElementById('resultModalOverlay')) {
        const modalHtml = `
            <div id="resultModalOverlay" class="modal show" tabindex="-1" style="display: none; background: rgba(0,0,0,0.7); position: fixed; z-index: 9999; width: 100vw; height: 100vh; top: 0; left: 0;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content p-4 text-center">
                        <img src="assets/images/Primary_Pride Logo_Black.png" alt="Logo" style="max-width: 120px; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">
                        <h2 class="result-title"></h2>
                        <div class="result-answers" style="margin: 32px 0 10px 0;">
                            <div class="result-row" style="display:flex;justify-content:center;gap:24px;align-items:center;">
                                <div class="result-label" style="font-family:'matter-semibold';font-size:22px;"></div>
                                <div class="result-value result-correct" style="font-family:'matter-semibold';font-size:22px;"></div>
                            </div>
                            <div class="result-row" style="display:flex;justify-content:center;gap:24px;align-items:center;margin-top:10px;">
                                <div class="result-label" style="font-family:'matter-semibold';font-size:22px;"></div>
                                <div class="result-value result-passing" style="font-family:'matter-semibold';font-size:22px;"></div>
                            </div>
                        </div>
                        <div class="result_show">
                            <div class="result-status" style="margin-top:10px;margin-bottom:10px;font-size:24px;font-family:'matter-semibold';"></div>
                            <div class="result_msg" style="font-size:24px;font-family:'matter-semibold'; margin-bottom:18px;"></div>
                            <div class="result_link"></div>
                        </div>
                        <button id="resultModalClose" class="btn btn-secondary mt-3">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
}
function showResultModal() {
    ensureResultModal();
    $('#resultModalOverlay').show();
    $('#resultModalClose').focus();
}
function hideResultModal() {
    $('#resultModalOverlay').hide();
}
$(document).on('click', '#resultModalClose', function() {
    hideResultModal();
});
$(document).on('click', '#resultModalOverlay', function(e) {
    if (e.target === this) {
        hideResultModal();
    }
});

// Patch the submit handler to use the modal
$(document).on('click', '#sub', function() {
    $('.show-section.wrapper section').hide();
    $(this).blur();
    setTimeout(function() {
        countresult();
        showresult(true); // show in modal
        showResultModal();
    }, 100);
});

// Patch showresult to support modal
window.showresult = function(modalMode) {
    if (!resultStrings) {
        $.ajax({
            url: 'assets/js/result_strings.json',
            dataType: 'json',
            async: false,
            success: function(data) { resultStrings = data; },
            error: function() { resultStrings = null; }
        });
    }
    if (window.selectedQuizLang) {
        currentLang = window.selectedQuizLang;
    } else if (typeof getCurrentQuizLang === 'function') {
        currentLang = getCurrentQuizLang();
    }
    if (!resultStrings || !resultStrings[currentLang]) currentLang = 'en';
    const strings = resultStrings[currentLang];

    // Use modal or legacy result page
    const $root = modalMode ? $('#resultModalOverlay') : $('.result_page');
    $root.find('.result-title').text(strings.knowledge_check);
    let correctNum = 0;
    let totalNum = 0;
    // Use the correct questions array for score calculation
    if (typeof questions !== 'undefined' && Array.isArray(questions) && window.userAnswers) {
        totalNum = questions.length;
        correctNum = questions.filter((q, i) => String(window.userAnswers[i]) === String(q.correct)).length;
        if (window.userAnswers.length < questions.length || window.userAnswers.includes(undefined)) {
            console.warn('Some answers are missing or undefined:', window.userAnswers);
        }
    }
    if (!totalNum) totalNum = 10;
    if (typeof correctNum !== 'number' || isNaN(correctNum)) correctNum = 0;
    const passingNum = 8;
    $root.find('.result-label').eq(0).text(strings.your_score);
    $root.find('.result-label').eq(1).text(strings.passing_score);
    $root.find('.result-correct').text(`${correctNum} / ${totalNum}`);
    $root.find('.result-passing').text(`${passingNum} / ${totalNum}`);
    const isPass = correctNum >= passingNum;
    const statusText = isPass ? strings.pass : strings.fail;
    const msgText = isPass ? strings.pass_msg : strings.fail_msg;
    $root.find('.result-status').text(statusText);
    $root.find('.result_msg').text(msgText);
    $root.find('.result_link').html(`<a href=\"${strings.link_url}\" target=\"_blank\" rel=\"noopener\" style=\"color:#0042ff;font-weight:bold;text-decoration:underline;\">${strings.link_url}</a>`);
    if (!modalMode) {
        $('.loadingresult').css('display', 'grid');
        setTimeout(function() {
            $('.result-correct')[0]?.offsetHeight;
            $('.result-passing')[0]?.offsetHeight;
            $('.result_page').addClass('result_page_show');
        }, 1000);
    }
};

});
