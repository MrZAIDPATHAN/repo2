// Dummy posts
let posts = [
  { user: "Alex", desc: "Spotted a Ferrari!", img: "images/ferrari.jpg", lat: 19.076, lng: 72.877 },
  { user: "Sam", desc: "Lambo in the city!", img: "images/lamborghini.jpg", lat: 28.704, lng: 77.102 },
  { user: "Mia", desc: "Bugatti sighting!", img: "images/bugatti.jpg", lat: 12.971, lng: 77.594 }
];

let garage = [];
let compareList = [];

// Switch tabs
function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
}

// Render posts
function renderPosts() {
  const postsEl = document.getElementById('posts');
  postsEl.innerHTML = '';
  posts.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${p.user}</h3>
      <p>${p.desc}</p>
      <img src="${p.img}" width="100%">
    `;
    postsEl.appendChild(card);
  });
}

// Garage
function renderGarage() {
  const gEl = document.getElementById('garageList');
  gEl.innerHTML = garage.map(c => `<div class="card">${c}</div>`).join('');
}
function addToGarage() {
  const car = prompt("Enter car name:");
  if(car) { garage.push(car); renderGarage(); }
}

// Comparison
function renderCompareList() {
  const cEl = document.getElementById('compareList');
  cEl.innerHTML = garage.map(c => 
    `<label><input type="checkbox" value="${c}"> ${c}</label><br>`
  ).join('');
}
function compareCars() {
  const checked = Array.from(document.querySelectorAll('#compareList input:checked')).map(i=>i.value);
  alert("Comparing: " + checked.join(" vs "));
}

// Map
let map = L.map('map').setView([20.5937,78.9629],5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
function refreshMapMarkers() {
  posts.forEach(p => {
    L.marker([p.lat, p.lng]).addTo(map).bindPopup(`<b>${p.user}</b><br>${p.desc}`);
  });
}

// Init
renderPosts();
renderGarage();
renderCompareList();
refreshMapMarkers();
