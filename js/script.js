console.log("let's go with JS!!!!!!!..");

let currentSong = new Audio();
let songs = [];
let currFolder;

function secondsToTimeFormat(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00"; // ✅
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

async function getSongs(folder) {
  currFolder = folder;
  let res = await fetch(`http://127.0.0.1:5500/${folder}/`);
  let html = await res.text();

  let parser = new DOMParser();
  let doc = parser.parseFromString(html, "text/html");

  let anchors = doc.getElementsByTagName("a");

  let links = [];
  let fullUrls = [];

  for (let i = 0; i < anchors.length; i++) {
    let href = anchors[i].getAttribute("href");
    if (href && href.endsWith(".mp3")) {
      let fileName = href.split(`/${folder}/`).pop();
      links.push(fileName);
      fullUrls.push(`http://127.0.0.1:5500/${folder}/${fileName}`);
    }
  }

  songs = links;

  // Show songs in playlist
  let songUL = document.querySelector(".songList ul");
  songUL.innerHTML = "";

  for (const song of songs) {
    songUL.innerHTML += `
      <li>
        <img class="invert" src="./img/music.svg" alt="">
        <div class="info">
          <div>${decodeURIComponent(song)}</div>
          <div>Atif</div>
        </div>
        <div class="playnow">
          <span>Play now</span>
          <img class="invert" src="./img/playNow.svg" alt="">
        </div>
      </li>`;
  }

  // Add click listeners to play a song
  Array.from(document.querySelectorAll(".songList li")).forEach((li) => {
    li.addEventListener("click", () => {
      let trackName = li.querySelector(".info div").innerText.trim();
      playMusic(trackName);
    });
  });

  return songs;
}

const playMusic = (track, pause = false) => {
  currentSong.src = `/${currFolder}/${track}`;
  if (!pause) {
    currentSong.play();
    document.querySelector("#play").src = "./img/pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
  try {
    let res = await fetch(`http://127.0.0.1:5500/songs/`);
    if (!res.ok) throw new Error("Failed to load songs directory");

    let html = await res.text();
    let div = document.createElement("div");
    div.innerHTML = html;

    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    for (let e of anchors) {
      let href = e.getAttribute("href").replace(/\/$/, "");

      // Skip empty, parent folder, or the root songs folder itself
      if (!href || href === ".." || href === "songs") continue;

      // Ensure it’s inside /songs/
      if (!href.includes("songs")) continue;

      let folder = href.split("/").pop();
      // let folderPath = `${href}/info.json`;

      // let metaRes = await fetch(folderPath);
      let metaRes = await fetch(`${href}/info.json`);

      if (!metaRes.ok) {
        continue;
      }

      let meta = await metaRes.json();

      cardContainer.innerHTML += `
        <div data-folder="${folder}" class="card">
          <div class="play">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                style="width: 100%; height: 100%; color: black;">
              <path
                d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                stroke="currentColor" stroke-width="1.5" fill="#000" stroke-linejoin="round">
              </path>
            </svg>
          </div>
          <img src="${href}/cover.jpeg" alt="">
          <h2>${meta.title}</h2>
          <p>${meta.Description}</p>
        </div>`;
    }
  } catch (err) {
    console.error("Error in displayAlbums:", err);
  }
}

// Load playlist when clicking a card
document.addEventListener("click", async (event) => {
  if (event.target.closest(".card")) {
    let card = event.target.closest(".card");
    await getSongs(`songs/${card.dataset.folder}`);
    playMusic(songs[0]);
  }
});

async function main() {
  let playBtn = document.querySelector("#play");
  let prevBtn = document.querySelector("#previous");
  let nextBtn = document.querySelector("#next");

  await getSongs("songs/ncs");
  playMusic(songs[0], true);

  // Display all albums
  await displayAlbums();

  // Play/pause
  playBtn.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      playBtn.src = "./img/pause.svg";
    } else {
      currentSong.pause();
      playBtn.src = "./img/play.svg";
    }
  });

  // Update time & progress
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondsToTimeFormat(
      currentSong.currentTime
    )} / ${secondsToTimeFormat(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  // Seekbar
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // Hamburger menu
  document.querySelector(".hamBurger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Previous
  prevBtn.addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").pop());
    if (index > 0) playMusic(songs[index - 1]);
  });

  // Next
  nextBtn.addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").pop());
    if (index < songs.length - 1) playMusic(songs[index + 1]);
  });

  // Volume
  document.querySelector(".range input").addEventListener("change", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
  });
  //Add the event Listner mute the track
  document.querySelector(".volume>img").addEventListener("click", (e) => {
    // console.log(e.target);
    // console.log("changing", e.target.src);
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document
        .querySelector(".range")
        .getElementsByTagName("input")[0].value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.1;
      document
        .querySelector(".range")
        .getElementsByTagName("input")[0].value = 50;
    }
  });
}

main();
