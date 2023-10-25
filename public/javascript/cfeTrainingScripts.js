document.addEventListener("DOMContentLoaded", function() {
    const videoElement = document.getElementById('cfeTrainingVideo');
    const continueButton = document.getElementById('videoCompletedButton');
    const closeModal = document.getElementById('closeModal');
    const modal = document.getElementById('customModal');
    const modalButton = document.getElementById('modalButton');
    
    videoElement.addEventListener('ended', function() {
        continueButton.style.display = 'block';  // Show the Continue button
        modal.style.display = 'block';  // Show the modal
    });

    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';  // Hide the modal when close button is clicked
    });

    modalButton.addEventListener('click', function() {
        modal.style.display = 'none';  // Hide the modal when modal's continue button is clicked
        // Add any further action you want to take after clicking the modal's continue button here.
    });
});

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

// Check for orientation and prevent video from playing in portrait mode
document.getElementById('cfeTrainingVideo').addEventListener('play', function() {
    if (window.innerHeight > window.innerWidth) {
        this.pause();
        alert('Please rotate your phone to landscape mode to watch the video.');
    }
});

// Add fullscreen event listener
window.addEventListener("click", fullscreen, { once: true });

// Check for orientation change
window.addEventListener('orientationchange', function() {
    const videoElement = document.getElementById('cfeTrainingVideo');
    if (window.innerWidth > window.innerHeight) {
        // If the device is in landscape mode, play the video
        videoElement.play();
    }
    else {
        videoElement.pause();
    }
});
