function showresult()
{
    $('.loadingresult').css('display', 'grid');

    setTimeout(function()
    {
        $('.result_page').addClass('result_page_show');

    },1000)
};

        
        
// Load questions from JSON and render quiz dynamically
let questions = [];
let userAnswers = [];


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
    if (lang === 'ja') file = 'assets/js/questions_ja.json';
    $.getJSON(file, function(data) {
        // Shuffle and take 10 questions (or all if less than 10)
        const shuffled = shuffleArray(data.slice());
        questions = shuffled.slice(0, 10);
        renderQuiz();
    });
}

function renderQuiz() {
    // Add modal HTML if not present
    if (!document.getElementById('hintModalOverlay')) {
        const modalHtml = `
            <div id="hintModalOverlay" style="display:none;">
                <div id="hintModal">
                    <div id="hintModalHeader">
                        Hint
                        <button id="hintModalClose" aria-label="Close">&times;</button>
                    </div>
                    <div id="hintModalBody"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    // Add floating hint button styles if not already present
    const quizContainer = $('.show-section.wrapper');
    quizContainer.empty();

    // Update total question count in step-number-inner (dynamic)
    $("#totalQuestions").text(questions.length);
    $("#activeStep").text(1);

    // Update step-bar to match number of questions
    const barContainer = $(".step-bar");
    barContainer.empty();
    for (let i = 0; i < questions.length; i++) {
        barContainer.append('<div class="bar"><div class="fill"></div></div>');
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
        // Only show hint button if not the last question
        let hintBtn = '';
        if (q.hint_text && stepNum < questions.length) {
            hintBtn = `<button type="button" class="hint-btn" data-hint-text="${q.hint_text.replace(/"/g, '&quot;')}" title="Show hint"><i class="fa-solid fa-lightbulb"></i> Hint</button>`;
        }
        quizContainer.append(`
            <section class="steps">
                <form id="step${stepNum}" method="post" novalidate>
                    <h2 class="q-heading">${q.question}</h2>
                    ${hintBtn}
                    <div class="form-inner">${answersHtml}</div>
                    <div class="next-prev">
                        ${stepNum > 1 ? `<button type="button" class="prev"><i class="fa-solid fa-arrow-left"></i>last question</button>` : ''}
                        ${stepNum < questions.length ? `<button type="button" class="next" id="step${stepNum}btn">next question<i class="fa-solid fa-arrow-right"></i></button>` : `<button type="button" class="apply" id="sub">Submit<i class="fa-solid fa-arrow-right"></i></button>`}
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
                /* Align with bottom of .step-number (67px height + 16px margin) */
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
    userAnswers = [];
    questions.forEach((q, idx) => {
        const stepNum = idx + 1;
        const val = $(`#step${stepNum} .radio-field input:checked`).val();
        userAnswers.push(val);
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
    if(correctprcnt >=80)
    {
        $('.pass_check').html('<i class="fa-solid fa-check"></i> You Passed!');
        $('.result_msg').html('You passed the test!');
    } else {
        $('.pass_check').html('<i class="fa-solid fa-xmark"></i>You did not Pass');
        $('.result_msg').html('Better Luck Next Time!');
    }
}

// Call loadQuestions on page load

$(document).ready(function() {

    // Hint modal open/close logic
    $(document).on('click', '.hint-btn', function() {
        var text = $(this).attr('data-hint-text') || '';
        // Remove the word "Hint:" (case-insensitive, with or without space or colon) from the start
        text = text.replace(/^\s*hint\s*:?\s*/i, '');
        $('#hintModalBody').text(text);
        $('#hintModalOverlay').show();
    });
    $(document).on('click', '#hintModalClose', function() {
        $('#hintModalOverlay').hide();
        $('#hintModalBody').text('');
    });
    // Optional: close modal when clicking outside
    $(document).on('click', '#hintModalOverlay', function(e) {
        if (e.target === this) {
            $('#hintModalOverlay').hide();
            $('#hintModalBody').text('');
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

    $(document).on('click', '.next', function() {
        const currentSection = $(this).closest('section');
        const nextSection = currentSection.next('section');
        if(nextSection.length) {
            currentSection.hide();
            nextSection.show();
            // Update step number
            const idx = nextSection.index();
            $('#activeStep').text(idx + 1);
            updateStepBar(idx);
        }
    });
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
        showresult();
        countresult();
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
        section.find('.radio-field').each(function() {
            const input = $(this).find('input');
            const iconSpan = $(this).find('.answer-icon');
            if (input.is(':checked')) {
                if (input.val() === q.correct) {
                    iconSpan.html('<i class="fa-solid fa-check" style="color:green"></i>');
                } else {
                    iconSpan.html('<i class="fa-solid fa-xmark" style="color:red"></i>');
                    $(this).addClass('incorrect');
                }
            }
        });
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
});
