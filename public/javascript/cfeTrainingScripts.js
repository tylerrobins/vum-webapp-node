document.addEventListener("DOMContentLoaded", function() {
    // Elements
    const videoElement = document.getElementById('cfeTrainingVideo');
    const continueButton = document.getElementById('videoCompletedButton');
    const closeModal = document.getElementById('closeModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const modal = document.getElementById('customModal');
    const quizButton = document.getElementById('goToQuiz');
    const cfeVideo = document.getElementById('cfeTrainingVideo');

    // Event Listeners
    videoElement.addEventListener('ended', videoEndedHandler);
    closeModal.addEventListener('click', closeModalHandler);
    closeModalButton.addEventListener('click', closeModalHandler);
    quizButton.addEventListener('click', goToQuiz);
    continueButton.addEventListener('click', goToQuiz);
    cfeVideo.addEventListener('play', orientationCheck);
    cfeVideo.addEventListener('ended', exitFullscreen);
    document.getElementById('redirectToQuestions').addEventListener('click', function() {
        window.location.href = '/cfeTrainingQuestions';
    });
    
    // window.addEventListener("click", fullscreen, { once: true });
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

    function orientationCheck() {
        if (window.innerHeight > window.innerWidth) {
            this.pause();
            alert('Please rotate your phone to landscape mode to watch the video.');
        }
    }

    function exitFullscreen() {
        if (document.fullscreenElement) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    function orientationChangeHandler() {
        if (window.innerWidth <= window.innerHeight) {
            videoElement.pause();
        }
    }

    function goToQuiz() {
        window.location.href = '/cfeTrainingQuestions';
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
            video.style.maxHeight = '84vh';  // Adjusted for visible button
        } else {
            video.style.maxHeight = '98vh';  // Adjusted for hidden button
        }
    }
});


