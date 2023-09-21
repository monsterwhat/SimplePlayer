// Function to set a cookie with a specific name, value, and expiration time (in days)
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

// Function to get the value of a cookie by its name
function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
            return cookieValue;
        }
    }
    return null;
}

// Map to keep track of seen videos and their play status
const seenVideos = new Map();
const videoOrder = [];

// Function to update the video list
function updateVideoList() {
    // Clear the video list
    videoList.innerHTML = '';

    const files = videoInput.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const videoURL = URL.createObjectURL(file);

        // Create list item with video link
        const listItem = document.createElement('li');
        const videoLink = document.createElement('a');
        videoLink.href = videoURL;
        videoLink.textContent = file.name;

        // Add "✅" or "☑️" icon based on whether it's seen or not
        const seenIcon = document.createElement('span');
        seenIcon.textContent = seenVideos.has(file.name) ? '✅' : '☑️';
        seenIcon.style.marginRight = '5px'; // Add some spacing
        videoLink.insertBefore(seenIcon, videoLink.firstChild);

        listItem.appendChild(videoLink);

        // Add list item to the video list
        videoList.appendChild(listItem);

        // Event listener for video link click
        videoLink.addEventListener('click', function(event) {
            event.preventDefault();
            playVideo(file.name);
            markVideoAsWatched(file.name); // Mark the video as watched
        });

        // Add the video to the play order
        videoOrder.push(file.name);
    }
}

// Function to mark a video as watched
function markVideoAsWatched(videoName) {
    seenVideos.set(videoName, true);
    // Save the updated seenVideos map to a cookie
    saveSeenVideosToCookie();
    // Update the video list to reflect the change
    updateVideoList();
}

// Function to save the seenVideos map to a cookie
function saveSeenVideosToCookie() {
    const seenVideosArray = Array.from(seenVideos);
    const seenVideosJSON = JSON.stringify(seenVideosArray);
    setCookie('seenVideos', seenVideosJSON, 30); // Store for 30 days
}

// Function to load the seenVideos map from a cookie
function loadSeenVideosFromCookie() {
    const seenVideosJSON = getCookie('seenVideos');
    if (seenVideosJSON) {
        const seenVideosArray = JSON.parse(seenVideosJSON);
        seenVideos.clear();
        for (const [videoName, watched] of seenVideosArray) {
            seenVideos.set(videoName, watched);
        }
    }
}

// Function to play a video by its name
function playVideo(videoName) {
    const videoIndex = videoOrder.indexOf(videoName);
    if (videoIndex !== -1) {
        const videoURL = URL.createObjectURL(videoInput.files[videoIndex]);
        videoPlayer.src = videoURL;
		
		// Retrieve the current play time for this video from the cookie
        const savedPlayTime = parseFloat(getCookie(`currentPlayTime_${videoName}`));
        if (!isNaN(savedPlayTime)) {
            videoPlayer.currentTime = savedPlayTime;
        } else {
            videoPlayer.currentTime = 0; // Default to 0 if no saved time
        }
		
        // Update the currently playing video's name
        currentVideoName.textContent = `Currently Playing: ${videoName}`;
        // Mark the video as seen
        seenVideos.set(videoName, true);
        // Save the updated seenVideos map to a cookie
        saveSeenVideosToCookie();
        // Update the video list to reflect the change
        updateVideoList();
        // Show the "Skip Intro" button when a new video starts playing
        skipIntroButton.style.display = 'inline-block';
        // Add an event listener to autoplay the next video when this video ends
        videoPlayer.addEventListener('ended', playNextVideo);
        
        // Save the current video as the last played video in a cookie
        setCookie('lastPlayedVideo', videoName, 30); // Store for 30 days
    }
}


// Function to autoplay the next video
function playNextVideo() {
    const currentIndex = videoOrder.indexOf(currentVideoName.textContent.substring(18));
    if (currentIndex !== -1 && currentIndex < videoOrder.length - 1) {
        const nextVideoName = videoOrder[currentIndex + 1];
        playVideo(nextVideoName);
    }
}

// Retrieve the current play time from the cookie and resume playback
const savedPlayTime = parseFloat(getCookie('currentPlayTime'));
if (!isNaN(savedPlayTime)) {
    videoPlayer.currentTime = savedPlayTime;
}

// Add an event listener to call autoSelectLastPlayedVideo when the page is ready
document.addEventListener('DOMContentLoaded', function() {
    autoSelectLastPlayedVideo();
});

// Function to auto-select the last played video
function autoSelectLastPlayedVideo() {
    const lastPlayedVideo = getCookie('lastPlayedVideo');
    if (lastPlayedVideo) {
        const savedPlayTime = parseFloat(getCookie('currentPlayTime'));
        if (!isNaN(savedPlayTime)) {
            videoPlayer.currentTime = savedPlayTime;
        }

        // Set the video source and play
        const videoIndex = videoOrder.indexOf(lastPlayedVideo);
        if (videoIndex !== -1) {
            const videoURL = URL.createObjectURL(videoInput.files[videoIndex]);
            videoPlayer.src = videoURL;

            // Add an event listener to start playback once the source is loaded
            videoPlayer.addEventListener('loadedmetadata', function() {
                videoPlayer.play();
            });
        }
    }
}

// Event listener for file input change
videoInput.addEventListener('change', function() {
    // Reset the play order and seen videos when new videos are added
    videoOrder.length = 0;
    seenVideos.clear();
    updateVideoList();
});

// Add an event listener for the "Skip Intro" button
skipIntroButton.addEventListener('click', function() {
    // Get the skip time from the input field
    const skipTime = parseInt(skipTimeInput.value, 10) || 0;
    videoPlayer.currentTime += skipTime;
    // Hide the "Skip Intro" button after it's pressed
    skipIntroButton.style.display = 'none';
});

// Add an event listener to continuously update and save the current play time
videoPlayer.addEventListener('timeupdate', function() {
    setCookie('currentPlayTime', videoPlayer.currentTime.toString(), 30); // Update the cookie every few seconds
});

// Get references to the previous and next buttons
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');

// Event listener for the previous button
prevButton.addEventListener('click', function() {
    playPreviousVideo();
});

// Event listener for the next button
nextButton.addEventListener('click', function() {
    playNextVideo();
});

// Function to play the previous video
function playPreviousVideo() {
    const currentVideoIndex = videoOrder.indexOf(currentVideoName.textContent.substring(18));
    if (currentVideoIndex !== -1 && currentVideoIndex > 0) {
        const previousVideoName = videoOrder[currentVideoIndex - 1];
        playVideo(previousVideoName);
    }
}

// Function to play the next video
function playNextVideo() {
    const currentVideoIndex = videoOrder.indexOf(currentVideoName.textContent.substring(18));
    if (currentVideoIndex !== -1 && currentVideoIndex < videoOrder.length - 1) {
        const nextVideoName = videoOrder[currentVideoIndex + 1];
        playVideo(nextVideoName);
    }
}


// Load the seenVideos map from the cookie when the page loads
loadSeenVideosFromCookie();

// Auto-select the last played video when the page loads
autoSelectLastPlayedVideo();

// Initial update of the video list
updateVideoList();
