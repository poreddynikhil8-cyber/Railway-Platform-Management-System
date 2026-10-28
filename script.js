/* ==========================================
   RAILWAY PLATFORM MANAGEMENT SYSTEM
   ========================================== */

// Number of platforms available at the station
const TOTAL_PLATFORMS = 4;

// Get HTML elements
const trainForm = document.getElementById("trainForm");
const trainList = document.getElementById("trainList");
const platformsContainer = document.getElementById("platforms");
const message = document.getElementById("message");

// Load saved trains from browser storage
let trains = [];

try {
  const savedTrains = JSON.parse(
    localStorage.getItem("railwayTrains") || "[]"
  );

  if (Array.isArray(savedTrains)) {
    trains = savedTrains.filter(
      train =>
        train &&
        typeof train.name === "string" &&
        typeof train.number === "string" &&
        typeof train.arrival === "string" &&
        typeof train.departure === "string" &&
        Number.isInteger(train.platform) &&
        train.platform >= 1 &&
        train.platform <= TOTAL_PLATFORMS
    );
  }
} catch (error) {
  trains = [];
}

// Save train data in the browser
function saveTrains() {
  try {
    localStorage.setItem("railwayTrains", JSON.stringify(trains));
  } catch (error) {
    showMessage("Could not save data in this browser.", true);
  }
}

// Display status messages
function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#b91c1c" : "#15803d";
}

// Convert HH:MM into minutes after midnight
function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Check whether two train time intervals overlap
function timesOverlap(arrival1, departure1, arrival2, departure2) {
  let start1 = toMinutes(arrival1);
  let end1 = toMinutes(departure1);
  let start2 = toMinutes(arrival2);
  let end2 = toMinutes(departure2);

  // Support trains that depart after midnight
  if (end1 <= start1) end1 += 1440;
  if (end2 <= start2) end2 += 1440;

  // Check the intervals across a 24-hour cycle
  for (const shift of [-1440, 0, 1440]) {
    if (start1 < end2 + shift && start2 + shift < end1) {
      return true;
    }
  }

  return false;
}

// Check whether a platform is free during the requested time
function isPlatformAvailable(platformNumber, arrival, departure) {
  return !trains.some(train =>
    train.platform === platformNumber &&
    timesOverlap(
      arrival,
      departure,
      train.arrival,
      train.departure
    )
  );
}

// Find the first available platform
function findAvailablePlatform(arrival, departure) {
  for (let platform = 1; platform <= TOTAL_PLATFORMS; platform++) {
    if (isPlatformAvailable(platform, arrival, departure)) {
      return platform;
    }
  }

  return null;
}

// Render platform cards
function renderPlatforms() {
  platformsContainer.replaceChildren();

  for (let number = 1; number <= TOTAL_PLATFORMS; number++) {
    const activeTrains = trains.filter(
      train => train.platform === number
    );

    const card = document.createElement("div");
    card.className = "platform";

    if (activeTrains.length > 0) {
      card.classList.add("occupied");
    } else {
      card.classList.add("available");
    }

    const heading = document.createElement("h3");
    heading.textContent = `Platform ${number}`;

    const status = document.createElement("p");
    status.textContent = activeTrains.length
      ? `${activeTrains.length} train(s) scheduled`
      : "Available";

    card.append(heading, status);

    activeTrains.forEach(train => {
      const detail = document.createElement("p");
      detail.textContent =
        `${train.name}: ${train.arrival}–${train.departure}`;
      card.appendChild(detail);
    });

    platformsContainer.appendChild(card);
  }
}

// Render train schedule
function renderTrains() {
  trainList.replaceChildren();

  if (trains.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 6;
    cell.textContent = "No trains scheduled yet.";
    row.appendChild(cell);
    trainList.appendChild(row);
    return;
  }

  const sortedTrains = [...trains].sort(
    (a, b) => toMinutes(a.arrival) - toMinutes(b.arrival)
  );

  sortedTrains.forEach(train => {
    const row = document.createElement("tr");

    const values = [
      train.number,
      train.name,
      train.arrival,
      train.departure,
      `Platform ${train.platform}`,
      "Scheduled"
    ];

    values.forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    trainList.appendChild(row);
  });
}

// Handle the Add Train form
trainForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const name = document.getElementById("trainName").value.trim();
  const number = document.getElementById("trainNumber").value.trim();
  const arrival = document.getElementById("arrival").value;
  const departure = document.getElementById("departure").value;

  if (!name || !number || !arrival || !departure) {
    showMessage("Please fill in all fields.", true);
    return;
  }

  if (arrival === departure) {
    showMessage("Arrival and departure times cannot be identical.", true);
    return;
  }

  if (trains.some(train => train.number === number)) {
    showMessage("This train number already exists.", true);
    return;
  }

  const platform = findAvailablePlatform(arrival, departure);

  if (platform === null) {
    showMessage(
      "No platform is available during this time. Please try another time.",
      true
    );
    return;
  }

  trains.push({
    name,
    number,
    arrival,
    departure,
    platform
  });

  saveTrains();
  renderTrains();
  renderPlatforms();

  showMessage(
    `${name} has been assigned to Platform ${platform}.`
  );

  trainForm.reset();
});

// Initial display
renderTrains();
renderPlatforms();
