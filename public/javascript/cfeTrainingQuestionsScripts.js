document.addEventListener('DOMContentLoaded', () => {
    let currentQuestion = 1; // This is in the scope of the DOMContentLoaded callback

    const next_btn = document.getElementById('next_btn');
    const prev_btn = document.getElementById('prev_btn');
    
    // Use a closure to access and update currentQuestion
    next_btn.addEventListener('click', () => {
        let answered = hasAnswerBeenGiven(currentQuestion);
        if(answered){
            currentQuestion = nextQuestion(currentQuestion); // Update the currentQuestion with the new value returned by the function
        }
        console.log(currentQuestion);
    });

    prev_btn.addEventListener('click', () => {
        currentQuestion = prevQuestion(currentQuestion); // Same for prevQuestion if you have it
        console.log(currentQuestion);
    });

    // Add event listeners to the dropdowns
    document.getElementById('q8option1').addEventListener('change', () => updateDropdowns('q8option1'));
    document.getElementById('q8option2').addEventListener('change', () => updateDropdowns('q8option2'));  
});

function nextQuestion(current) {
    if(current == 9){
        changeNextBtn('page10');
    } else if(current == 1){
        changeNextBtn('page2-9');
    }
    current++;
    document.getElementById('question' + current).style.display = 'block';
    document.getElementById('question' + (current - 1)).style.display = 'none';
    return current; // Return the updated value
}

function prevQuestion(current) {
    if(current == 10){
        changeNextBtn('page2-9');
    } else if(current == 2){
        changeNextBtn('page1');
    }
    if (current > 1) { // Prevent going below the first question
        current--;
        document.getElementById('question' + current).style.display = 'block';
        document.getElementById('question' + (current + 1)).style.display = 'none';
    }
    return current; // Return the updated value
}

function changeNextBtn(status){
    if(status == 'page1'){
        document.getElementById('submit_btn').style.display = 'none';
        document.getElementById('prev_btn').style.display = 'none';
        document.getElementById('next_btn').style.display = 'block';
    } else if(status == 'page2-9'){
        document.getElementById('submit_btn').style.display = 'none';
        document.getElementById('prev_btn').style.display = 'block';
        document.getElementById('next_btn').style.display = 'block';  
    } else if(status == 'page10'){
        document.getElementById('submit_btn').style.display = 'block';
        document.getElementById('prev_btn').style.display = 'block';
        document.getElementById('next_btn').style.display = 'none';
    } 
}

function hasAnswerBeenGiven(questionNumber) {
    let answered = false;
    switch(questionNumber) {
        case 1: 
        case 3: 
        case 7: 
        case 9: 
        case 10:
            // Ensure that the user has selected an answer from the dropdown select list
            const selectElement = document.getElementById('question' + questionNumber).querySelector('select').value;
            if (selectElement && selectElement !== "")
                answered = true;
            break;
        case 2:
            var checkboxes = document.querySelectorAll('input[name="category[]"]');
            var checkedCount = 0;
            // Loop through the NodeList and count the checked boxes
            checkboxes.forEach(function(checkbox) {
                if (checkbox.checked) {
                  checkedCount++;
                }
            });
            // Check if exactly three checkboxes were checked
            if (checkedCount < 3) {
                alert("Please select 3 options");
                return false; 
            } 
            else if (checkedCount > 3) {
                alert("Please only select 3 options");
                return false;
            } 
            else {
                return true; 
            }
        case 4:
        case 5: 
        case 6:
            var radios = document.getElementById('question' + questionNumber).querySelectorAll('input[type="radio"]');
            for (var i = 0; i < radios.length; i++) {
                if (radios[i].checked) {
                    answered = true;
                    break; // Stop the loop as we found a checked radio
                }
            } break;
        case 8:
            // Get all select elements with the class 'order-select'
            var selects = document.querySelectorAll('.order-select');
            answered = true;
            // Loop through the NodeList and check each select
            for (var i = 0; i < selects.length; i++) {
                console.log(`Select ${i} value: ${selects[i].value}`)  
                if (selects[i].value === "" || selects[i].value === null) {
                    answered = false;
                    break; // Stop the loop as we found a non-selected dropdown
              }
            }
        break;
    }

    if (!answered) {
      alert("Please answer the question before proceeding.");
    }
    return answered;
}

function updateDropdowns(selectedDropdown) {
    var q8option1 = document.getElementById('q8option1');
    var q8option2 = document.getElementById('q8option2');
    var q8option3 = document.getElementById('q8option3');
  
    // Only update the options for the dropdowns that come after the one that was changed
    if (selectedDropdown === 'q8option1') {
        recreateOptions(q8option2, [q8option1.value], q8option2.value);
        recreateOptions(q8option3, [q8option1.value, q8option2.value], q8option3.value);
    } else if (selectedDropdown === 'q8option2') {
        recreateOptions(q8option3, [q8option1.value, q8option2.value], q8option3.value);
    }    
  }
  
function recreateOptions(dropdown, excludeValues, selectedValue) {
    // Define the options available
    var options = [
      { value: "budget_big_costs", text: "Budget for big costs" },
      { value: "id_list_expenses", text: "Identify and list all expenses" },
      { value: "calc_revenue", text: "Calculate revenue" }
    ];
  
    // Filter out options that should be excluded
    var filteredOptions = options.filter(function(opt) {
      return !excludeValues.includes(opt.value);
    });
  
    // Clear existing options
    dropdown.innerHTML = '';
  
    // Add the default placeholder option
    var placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.text = "SELECT OPTION";
    placeholderOption.disabled = true;
    placeholderOption.hidden = true;
    dropdown.appendChild(placeholderOption);
  
    // Add new options, excluding any that are in the excludeValues array
    filteredOptions.forEach(function(opt) {
      var newOption = document.createElement("option");
      newOption.value = opt.value;
      newOption.text = opt.text;
      dropdown.appendChild(newOption);
    });
  
    // If there is only one option left, select it by default, unless it was already selected before
    if (filteredOptions.length === 1 && !selectedValue) {
      dropdown.value = filteredOptions[0].value;
    } else {
      // Otherwise, set the value to the previous selection or leave it at the placeholder
      dropdown.value = excludeValues.includes(selectedValue) ? "" : selectedValue;
    }
  }
  