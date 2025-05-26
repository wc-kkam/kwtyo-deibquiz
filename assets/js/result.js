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

function loadQuestions() {
    $.getJSON('assets/js/questions.json', function(data) {
        // Shuffle and take 10 questions (or all if less than 10)
        const shuffled = shuffleArray(data.slice());
        questions = shuffled.slice(0, 10);
        renderQuiz();
    });
}

function renderQuiz() {
    const quizContainer = $('.show-section.wrapper');
    quizContainer.empty();

    // Update total question count in step-number-inner
    $("#activeStep").parent().html(`Question <span id="activeStep">1</span>/${questions.length}`);

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
        quizContainer.append(`
            <section class="steps">
                <form id="step${stepNum}" method="post" novalidate>
                    <h2 class="q-heading">${q.question}</h2>
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
    loadQuestions();

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
