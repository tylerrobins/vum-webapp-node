document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded! 🚀');
    // CFE FORM
    const cfeForm = document.getElementById('cfeForm');
      cfeForm.addEventListener('submit', async (event) => {
      // Prevent the default form submission behavior
      event.preventDefault();
      console.log('Form submitted')
      // Retrieve the form data
      const formData = new FormData(cfeForm);

      // Check if all fields are filled
      if (!allFieldsFilled(formData)) {
        alert('Please fill in all fields in order to complete your registration.');
        return false;
      }
      const didNumber = formData.get('x-binu-did');
      const phoneNumber = formData.get('phoneNumber');
      const businessOwner = formData.get('businessOwner');
      const businessType = formData.get('businessType');
      const businessName = formData.get('businessName');
      const nameSurname = formData.get('nameSurname');
      const businessTurnover = formData.get('businessTurnover');

      // Construct the URL with the x-binu-did parameter
      const url = '/api/cfe';
      try {
        // Send the POST request using the fetch API
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({phoneNumber, didNumber, businessOwner, businessType, businessName, nameSurname, businessTurnover}),
        });
      
        // Handle the response from the server
        if (response.ok) {
          const data = await response.json();
          console.log('Success:', data);
          //Redirect to CFE registered page
          window.location.href = `/cfe?x-binu-did=${didNumber}`;
          return true;
        } else {
          console.error('Error:', response.statusText);
          // Handle the error response and update the UI as needed
        }
      } catch (error) {
        console.error('Error:', error);
      }
    });
    document.getElementById('businessOwner').addEventListener('change', function() {
      const businessOwnersAddQs = document.getElementById('businessOwnersAddQs');
      const startingBusinessAddQs = document.getElementById('startingBusinessAddQs');
      const startBusinessLabelElements = document.getElementsByClassName('startingBusinessLabel');
      const hasBusinessLabelElements = document.getElementsByClassName('hasBusinessLabel');
      const tradingNameDiv = document.getElementById('tradingNameDiv');
      if (this.value == 'Yes') {
        businessOwnersAddQs.style.display = 'block';
        startingBusinessAddQs.style.display = 'none';
        tradingNameDiv.style.display = 'block';
        for(let i = 0; i < startBusinessLabelElements.length; i++) {
          startBusinessLabelElements[i].style.display = 'none';
        }
        for(let i = 0; i < hasBusinessLabelElements.length; i++) {
          hasBusinessLabelElements[i].style.display = 'block';
        }
      }
      else {
        businessOwnersAddQs.style.display = 'none';
        startingBusinessAddQs.style.display = 'block';
        tradingNameDiv.style.display = 'none';
        document.getElementById('businessName').value = 'NA';
        for(let i = 0; i < hasBusinessLabelElements.length; i++) {
          hasBusinessLabelElements[i].style.display = 'none';
        }
        for(let i = 0; i < startBusinessLabelElements.length; i++) {
          startBusinessLabelElements[i].style.display = 'block';
        }
      }
    });
    document.getElementById('startBusiness').addEventListener('change', function() {
      const businessOwnersAddQs = document.getElementById('businessOwnersAddQs');
      const businessOwnerIntialQ = document.getElementById('businessOwnerIntialQ');
      const cfeForm = document.getElementById('cfeForm');
      const restrictedCFEpara = document.getElementById('restrictedCFEpara');
      if (this.value == 'Yes') {
        businessOwnersAddQs.style.display = 'block';
        businessOwnerIntialQ.style.display = 'none';
      }
      else {
        cfeForm.style.display = 'none';
        restrictedCFEpara.style.display = 'block';
      }
    });
});

function allFieldsFilled(formData) {
  const fields = ['phoneNumber', 'businessOwner', 'businessType', 'businessName', 'nameSurname', 'businessTurnover'];
  for (let field of fields) {
      if (!formData.get(field)) {
          return false;
      }
  }
  return true;
}
