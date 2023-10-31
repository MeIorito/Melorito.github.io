// Constants
const clientId = 'b9a4a0c074d24ae4bbc211be3a3b9e9c';
const redirectUri = 'https://meiorito.github.io/Melorito.github.io/';

// Generate a random code verifier
let codeVerifier = generateRandomString(128);

// Check if there is an authentication code in the URL parameters
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
  // If authentication code is present, exchange it for an access token
  const storedCodeVerifier = localStorage.getItem('code_verifier');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: storedCodeVerifier
  });

  authenticateUser(body);
} else {
  // If no authentication code, initiate authentication flow
  initiateAuthenticationFlow();
}

// Authentication function
function authenticateUser(body) {
  fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  })
  .then(handleResponse)
  .then(data => {
    localStorage.setItem('access_token', data.access_token);
    getUser();
    getArtists('short_term');
    getSongs('short_term');
    getArtists('medium_term');
    getSongs('medium_term');
    getArtists('long_term');
    getSongs('long_term');
  })
  .catch(handleError);
}

// Initiating authentication flow
function initiateAuthenticationFlow() {
  generateCodeChallenge(codeVerifier)
    .then(codeChallenge => {
      const state = generateRandomString(16);
      const scope = 'user-read-private user-top-read user-read-private user-read-email';

      localStorage.setItem('code_verifier', codeVerifier);

      const args = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: scope,
        redirect_uri: redirectUri,
        state: state,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge
      });

      const authorizationUrl = 'https://accounts.spotify.com/authorize?' + args;
      console.log(authorizationUrl);
      window.location = authorizationUrl;
    });
}

// Fetch user data from Spotify API
function getUser() {
  fetchSpotifyAPI('https://api.spotify.com/v1/me')
    .then(handleResponse)
    .then(data => {
      populateUIUser(data);
    })
    .catch(handleError);
}

// Fetch top artists from Spotify API
function getArtists(timeRange) {
  fetchSpotifyAPI(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=5&offset=0`)
    .then(handleResponse)
    .then(data => {
      populateUIArtists(data, timeRange);
    })
    .catch(handleError);
}

// Fetch top songs from Spotify API
function getSongs(timeRange) {
  fetchSpotifyAPI(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=5&offset=0`)
    .then(handleResponse)
    .then(data => {
      populateUISongs(data, timeRange);
    })
    .catch(handleError);
}

// Generic function to fetch data from Spotify API
function fetchSpotifyAPI(url) {
  return fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    }
  });
}

// Handle fetch response
function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

// Handle errors
function handleError(error) {
  console.error('Error:', error);
}

// Function to populate UI with user data
function populateUIUser(data) {
  const name = data.display_name;
  const profileImage = data.images[0].url;
  document.getElementById('welcomeWithName').textContent = `Hi ${name}! Welcome to sreeaf!`;
  var imgElement = document.querySelector('.profilePic');
  imgElement.src = profileImage;
}

// Function to populate UI with artists' data
function populateUIArtists(data, timeRange) {
  const artists = data.items.map(item => item.name);
  const images = data.items.map(item => item.images[1].url);
  const genres = data.items.map(item => item.genres);
  const artistUrls = data.items.map(item => item.external_urls.spotify);
  populateUIList(artists, images, `artists_${timeRange}`, artistUrls);
  populateGenre(genres, `genres_${timeRange}`);
}

// Function to populate UI with songs' data
function populateUISongs(data, timeRange) {
  const songs = data.items.map(item => item.name);
  const images = data.items.map(item => item.album.images[0].url);
  const songUrls = data.items.map(item => item.external_urls.spotify);
  populateUIList(songs, images, `songs_${timeRange}`, songUrls);
}

// Common function to populate UI list with data
function populateUIList(names, images, listId, urls) {
  const list = document.getElementById(listId);
  images.forEach((image, index) => {
    const listItem = document.createElement('li');
    const linkElement = document.createElement('a');
    linkElement.href = urls ? urls[index] : '#';
    linkElement.target = '_blank'; // add target attribute to open link in new tab
    const imageElement = new Image(250, 250);
    imageElement.src = image;
    linkElement.appendChild(imageElement);
    const itemName = document.createElement('p');
    itemName.textContent = truncateText(names[index], 25);
    listItem.appendChild(linkElement);
    listItem.appendChild(itemName);
    list.appendChild(listItem);
  });
}

function populateGenre(twoDGenresArray, listId) {
  const genresSingle = deleteDuplicates(twoDGenresArray.flat());
  const genresSingleCut = cutArray(genresSingle, 5);
  console.log(genresSingleCut);
  const list = document.getElementById(listId);
  genresSingleCut.forEach((genre) => {
    const listItem = document.createElement('li');
    const genreName = document.createElement('p');
    genreName.textContent = truncateText(genre, 25);
    listItem.appendChild(genreName);
    list.appendChild(listItem);
  });
}

// Function to truncate text if too long
function truncateText(text, maxLength) {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
}

// Function to delete duplicates in an array
function deleteDuplicates(array) {
  return array.filter((item, index) => array.indexOf(item) === index);
}

// Function to cut array to a certain length
function cutArray(array, maxLength) {
  if (array.length > maxLength) {
    return array.slice(0, maxLength);
  }
  return array;
}

// Function to generate a random string
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Function to generate code challenge
async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);

  return base64encode(digest);

  function base64encode(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const binaryString = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    return btoa(binaryString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
