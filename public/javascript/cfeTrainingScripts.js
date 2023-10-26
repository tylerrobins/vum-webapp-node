document.addEventListener("DOMContentLoaded", function() {
    // Elements
    const videoElement = document.getElementById('cfeTrainingVideo');
    const continueButton = document.getElementById('videoCompletedButton');
    const closeModal = document.getElementById('closeModal');
    const modal = document.getElementById('customModal');
    const modalButton = document.getElementById('modalButton');

    // Event Listeners
    videoElement.addEventListener('ended', videoEndedHandler);
    closeModal.addEventListener('click', closeModalHandler);
    modalButton.addEventListener('click', modalButtonHandler);
    document.getElementById('cfeTrainingVideo').addEventListener('play', orientationCheck);
    window.addEventListener("click", fullscreen, { once: true });
    window.addEventListener('orientationchange', orientationChangeHandler);
    adjustVideoSize();

    // Handlers
    function videoEndedHandler() {
        continueButton.style.display = 'block';  // Show the Continue button
        adjustVideoSize();  // Adjust video size
        modal.style.display = 'block';  // Show the modal
    }

    function closeModalHandler() {
        modal.style.display = 'none';  // Hide the modal when close button is clicked
    }

    function modalButtonHandler() {
        modal.style.display = 'none';  // Hide the modal when modal's continue button is clicked
        // Add any further action you want to take after clicking the modal's continue button here.
    }

    function orientationCheck() {
        if (window.innerHeight > window.innerWidth) {
            this.pause();
            alert('Please rotate your phone to landscape mode to watch the video.');
        }
    }

    function orientationChangeHandler() {
        if (window.innerWidth <= window.innerHeight) {
            videoElement.pause();
        }
    }
    // Fullscreen function  
    function fullscreen() {
        var element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }

    // Adjust size for continue button
    function adjustVideoSize() {
        const video = document.getElementById('cfeTrainingVideo');
        const button = document.getElementById('videoCompletedButton');
    
        // Check if both video and button elements exist
        if (!video || !button) return;
    
        // Check if the button is displayed or not
        const isButtonDisplayed = window.getComputedStyle(button).display !== 'none';
    
        if (isButtonDisplayed) {
            video.style.maxHeight = '85vh';  // Adjusted for visible button
        } else {
            video.style.maxHeight = '98vh';  // Adjusted for hidden button
        }
    }
});


