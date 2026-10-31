console.log("let's go with JS!!!!!!!..");

let currentSong = new Audio();
let songs = [];
let currFolder;

function secondsToTimeFormat(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
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

  for (let i = 0; i < anchors.length; i++) {
    let href = anchors[i].getAttribute("href");
    if (href && href.endsWith(".mp3")) {
      let fileName = href.split(`/${folder}/`).pop();
      links.push(fileName);
    }
  }

  songs = links;

  // Show songs in playlist
  let songUL = document.querySelector(".songList ul");
  songUL.innerHTML = "";
  for (const song of songs) {
    songUL.innerHTML += `
      <li>
        <img class="invert" src="music.svg" alt="">
        <div class="info">
          <div>${decodeURIComponent(song)}</div>
          <div>Atif</div>
        </div>
        <div class="playnow">
          <span>Play now</span>
          <img class="invert" src="playNow.svg" alt="">
        </div>
      </li>`;
  }

  // Click to play song
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
    document.querySelector("#play").src = "pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = decodeURIComponent(track);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
  let res = await fetch(`http://127.0.0.1:5500/songs/`);
  let html = await res.text();

  let div = document.createElement("div");
  div.innerHTML = html;
  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".cardContainer");

  Array.from(anchors).forEach(async (e) => {
    if (e.href.includes("/songs")) {
      let folder = e.href.split("/").slice(-1)[0];
      try {
        let res = await fetch(
          `http://127.0.0.1:5500/songs/${folder}/info.json`
        );
        let meta = await res.json();
        cardContainer.innerHTML += `
          <div data-folder="${folder}" class="card">
            <div class="play">
              ▶
            </div>
            <img src="/songs/${folder}/cover.jpeg" alt="">
            <h2>${meta.title}</h2>
            <p>${meta.Description}</p>
          </div>`;
      } catch {
        console.warn(`No info.json in folder ${folder}`);
      }
    }
  });

  // Load playlist when card clicked
  document.addEventListener("click", async (e) => {
    if (e.target.closest(".card")) {
      let folder = e.target.closest(".card").dataset.folder;
      await getSongs(`songs/${folder}`);
    }
  });
}

async function main() {
  let playBtn = document.querySelector("#play");
  let prevBtn = document.querySelector("#previous");
  let nextBtn = document.querySelector("#next");

  await getSongs("songs/ncs");
  playMusic(songs[0], true);
  displayAlbums();

  // Play/pause
  playBtn.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      playBtn.src = "pause.svg";
    } else {
      currentSong.pause();
      playBtn.src = "play.svg";
    }
  });

  // Update time
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

  // Hamburger
  document.querySelector(".hamBurger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Prev/next
  prevBtn.addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").pop());
    if (index > 0) playMusic(songs[index - 1]);
  });
  nextBtn.addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").pop());
    if (index < songs.length - 1) playMusic(songs[index + 1]);
  });

  // Volume
  document.querySelector(".range input").addEventListener("change", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
  });
}

main();
