document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('myForm');
  const loadingSpinner = document.getElementById('loadingSpinner');

  form.addEventListener('submit', async (event) => {
    // Prevent the default form submission behavior
    event.preventDefault();
    // Retrieve the form data
    const formData = new FormData(form);
    const xBinuDid = formData.get('x-binu-did');
    const businessActivity = formData.get('businessActivity');
    const number = formData.get('number');
    
    // Show the spinner
    loadingSpinner.style.display = 'flex';

    // Construct the URL with the x-binu-did parameter
    const url = `/updateBusinessActivity/${xBinuDid}`;
    try {
      // Send the POST request using the fetch API
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessActivity, number}),
      });

      // Handle the response from the server
      if (response.ok) {
        const data = await response.json();
        console.log('Success:', data);
        // Redirect to another page or update the UI as needed
        window.location.href = 'moya://27700008020';
      } else {
        console.error('Error:', response.statusText);
        // Handle the error response and update the UI as needed
      }
    } catch (error) {
      console.error('Error:', error);
      // Handle network errors and update the UI as needed
    } finally {
      // Hide the spinner
      loadingSpinner.style.display = 'none';
    }
  });
});

// Scrolls to the bottom of the page when an activity is selected
document.getElementById('businessActivity').addEventListener('change', function () {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth'
  });
});


  
  
  