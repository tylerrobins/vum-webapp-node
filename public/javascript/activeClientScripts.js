const locationSelect = document.getElementById('location_loss');
const locationInputContainer = document.getElementById('locationInputContainer');
const personalAccidentCheckbox = document.getElementById('personal_accident');
const lossReasonSelect = document.getElementById('loss_reason');
const otherOption = lossReasonSelect.querySelector('option[value="other"]');

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded! 🚀');
  // CLAIMS FORM
  const claimsForm = document.getElementById('claimsForm');
  claimsForm.addEventListener('submit', async (event) => {
    const checkboxes = document.querySelectorAll('.claimCheckbox');
    let checkedOne = Array.prototype.slice.call(checkboxes).some(x => x.checked);
    if (!checkedOne) {
      alert('Please select at least one Claim Type');
      return false;
    }
    // Prevent the default form submission behavior
    event.preventDefault();
    // Retrieve the form data
    const formData = new FormData(claimsForm);
    const ClientNumber = formData.get('number');
    const PolicyNumber = formData.get('policyNumber');
    const DateTimeOfLoss = formData.get('date_time_loss');
    const LocationOfLoss = formData.get('location_loss');
    const LossAddress = formData.get('location_input');
    const ClaimReason = formData.get('loss_reason');
    const DescOfLoss = formData.get('description_loss');

    // Construct the URL with the x-binu-did parameter
    const url = '/api/logclaim';
    try {
      // Send the POST request using the fetch API
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ClientNumber, PolicyNumber, DateTimeOfLoss, LocationOfLoss, LossAddress, ClaimReason, DescOfLoss}),
      });

      // Handle the response from the server
      if (response.ok) {
        const data = await response.json();
        console.log('Success:', data);
        alert('Thank you for submitting your claim. We will be in touch shortly.');
      } else {
        console.error('Error:', response.statusText);
        // Handle the error response and update the UI as needed
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
  // QUESTION FORM
  const questionForm = document.getElementById('questionForm');
  questionForm.addEventListener('submit', async (event) => {
    // Prevent the default form submission behavior
    event.preventDefault();
    // Retrieve the form data
    const formData = new FormData(questionForm);
    const ClientNumber = formData.get('number');
    const PolicyNumber = formData.get('policyNumber');
    const Question = formData.get('question');

    // Construct the URL with the x-binu-did parameter
    const url = '/api/askquestion';
    try {
      // Send the POST request using the fetch API
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ClientNumber, PolicyNumber, Question}),
      });
    
      // Handle the response from the server
      if (response.ok) {
        const data = await response.json();
        console.log('Success:', data);
        alert('Thank you for submitting your question. We will be in touch shortly.');
        closeForm();
        return true;
      } else {
        console.error('Error:', response.statusText);
        // Handle the error response and update the UI as needed
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
  // CANCELLATION FORM
  const cancellationForm = document.getElementById('cancellationForm');
  cancellationForm.addEventListener('submit', async (event) => {
    // Prevent the default form submission behavior
    event.preventDefault();
    // Retrieve the form data
    const formData = new FormData(cancellationForm);
    const ClientNumber = formData.get('number');
    const PolicyNumber = formData.get('policyNumber');
    const CancellationReason = formData.get('cancellation_reason');
    const CancellationDate = formData.get('todaysDate');

    // Construct the URL with the x-binu-did parameter
    const url = '/api/cancelpolicy';
    try {
      // Send the POST request using the fetch API
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ClientNumber, PolicyNumber, CancellationReason, CancellationDate}),
      });

      // Handle the response from the server
      if (response.ok) {
        const data = await response.json();
        console.log('Success:', data);
        alert('Thank you for submitting your cancellation request. Your policy has been cancelled.');
        window.location.href = 'https://moya.me/net.azurewebsites.vum-webapp-node';
        return true;
      } else {
        console.error('Error:', response.statusText);
        // Handle the error response and update the UI as needed
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });

  locationSelect.addEventListener('change', function() {
    const selectedOption = this.value;
    if (selectedOption === 'off premises') {
      locationInputContainer.style.display = 'block';
    } else {
      locationInputContainer.style.display = 'none';
    }
  });

  personalAccidentCheckbox.addEventListener('change', function() {
    const selectedOptions = ['Permanent Disability', 'Death'];
  
    if (this.checked) {
      selectedOptions.forEach(option => {
        const newOption = document.createElement('option');
        newOption.value = option.toLowerCase().replace(' ', '_');
        newOption.textContent = option;
        lossReasonSelect.insertBefore(newOption, otherOption);
      });
    } else {
      selectedOptions.forEach(option => {
        const value = option.toLowerCase().replace(' ', '_');
        const optionToRemove = lossReasonSelect.querySelector(`option[value="${value}"]`);
        if (optionToRemove) {
          optionToRemove.remove();
        }
      });
    }
  });
});

// FUNCTIONS
// HOME PAGE FUNCTIONS
function openForm(formId) {
    const overlay = document.getElementById('overlay');
    const form = document.getElementById(formId);
    overlay.style.display = 'block';
    form.style.display = 'block';
};

function closeForm() {
    const overlay = document.getElementById('overlay');
    const forms = document.getElementsByClassName('form-container');
    overlay.style.display = 'none';
    Array.from(forms).forEach(form => {
        form.style.display = 'none';
    });
};
