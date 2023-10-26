function changePage(pageNumber) {
    // Hide all pages
    document.querySelectorAll('.form-page').forEach(page => page.style.display = 'none');

    // Show the desired page
    document.getElementById(`page-${pageNumber}`).style.display = 'block';

    // If on the last page, change the Next button to Submit
    if (pageNumber === 3) {
        document.getElementById('next-button').innerText = 'Submit';
        document.getElementById('next-button').setAttribute('onclick', 'submitForm()');
    }
}

function submitForm() {
    // Get all input values
    const answers = [];
    for (let i = 1; i <= 10; i++) {
        answers.push(document.querySelector(`input[name=q${i}]`).value);
    }

    // Store answers in the hidden form and submit
    answers.forEach((answer, index) => {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = `q${index + 1}`;
        hiddenInput.value = answer;
        document.getElementById('submit-form').appendChild(hiddenInput);
    });

    document.getElementById('submit-form').submit();
}
