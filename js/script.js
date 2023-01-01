const wrapper = document.querySelector(".wrapper"),
  musicImg = wrapper.querySelector(".img-area img"),
  musicName = wrapper.querySelector(".song-details .name"),
  musicArtist = wrapper.querySelector(".song-details .artist"),
  playPauseBtn = wrapper.querySelector(".play-pause"),
  prevBtn = wrapper.querySelector("#prev"),
  nextBtn = wrapper.querySelector("#next"),
  mainAudio = wrapper.querySelector("#main-audio"),
  progressArea = wrapper.querySelector(".progress-area"),
  progressBar = progressArea.querySelector(".progress-bar"),
  favoriteMusicBtn = wrapper.querySelector("#favorite")

const localStorageKeys = {
  favorites: "favorites",
  playMode: "playMode",
  currentSong: "currentSong",
}

let favorites = []
const initFavorites = () => {
  try {
    // Wrap in a try/catch in case someone's browser does not support local storage
    favorites =
      JSON.parse(localStorage.getItem(localStorageKeys.favorites)) ?? []
  } catch (err) {
    console.error("Error trying to load favorites from localStorage.", err)
  }
}
initFavorites()

const getStartSongIndex = () => {
  const randomIndex = Math.floor(Math.random() * allMusic.length + 1)
  try {
    const saved = JSON.parse(localStorage.getItem(localStorageKeys.currentSong))
    if (saved === undefined) return randomIndex
    const hit = allMusic.findIndex((haystack) => haystack.name === saved.name)
    return hit > -1 ? hit : randomIndex
  } catch (err) {
    return randomIndex
  }
}
let musicIndex = getStartSongIndex()
isMusicPaused = true

window.addEventListener("load", () => loadMusic(musicIndex))

const nowPlayingSong = () => allMusic[musicIndex]

const saveCurrentSong = (song) => {
  try {
    localStorage.setItem(localStorageKeys.currentSong, JSON.stringify(song))
  } catch (err) {
    console.error("Error saving", err)
  }
}
const loadMusic = (indexNumb) => {
  if (indexNumb < 0) indexNumb = allMusic.length - 1

  if (indexNumb > allMusic.length - 1) indexNumb = 0

  musicIndex = indexNumb
  const song = allMusic[indexNumb]
  musicName.innerText = song.name
  if (song.original) {
    musicName.href = song.original
    musicName.title = "Original source"
  } else {
    musicName.removeAttribute("href")
    musicName.title = "A Music of a People Original"
  }

  musicArtist.innerText = song.artist
  musicImg.src = `images/${song.img}.jpg`
  mainAudio.src = `songs/${song.src}.mp3`
  updateFavorite(song)
  saveCurrentSong(song)
}

const updateFavorite = (song) =>
  (favoriteMusicBtn.innerText = isFavorite(song)
    ? "favorite"
    : "thumbs_up_down")

function playMusic() {
  wrapper.classList.add("paused")
  playPauseBtn.querySelector("i").innerText = "pause"
  mainAudio.play()
}

function pauseMusic() {
  wrapper.classList.remove("paused")
  playPauseBtn.querySelector("i").innerText = "play_arrow"
  mainAudio.pause()
}

function prevMusic() {
  musicIndex--
  // todo: handle favorites play mode
  loadMusic(musicIndex)
  playMusic()
}

function nextMusic() {
  musicIndex++
  if (getCurrentPlayMode() === "stars")
    musicIndex = getNextFavorite(nowPlayingSong())

  loadMusic(musicIndex)
  playMusic()
}

const toggleMusic = () => {
  const isMusicPlay = wrapper.classList.contains("paused")
  //if isPlayMusic is true then call pauseMusic else call playMusic
  isMusicPlay ? pauseMusic() : playMusic()
}

const isFavorite = (song) =>
  favorites.some((haystack) => haystack.name === song.name)
const toggleFavorite = (song) => {
  if (isFavorite(song))
    favorites = favorites.filter((someSong) => someSong.name !== song.name)
  else favorites.push(song)
  saveFavorites()
  updateFavorite(song)
}
const getNextFavorite = (song = nowPlayingSong()) => {
  if (!favorites.length)
    // If there are no favorites yet, play first song.
    return 0
  let nextSong
  if (!isFavorite(song))
    // If current song is not a favorite, play first favorite
    nextSong = favorites[0]
  // Play the next favorite after current
  else
    nextSong =
      favorites[
        favorites.findIndex((haystack) => haystack.name === song.name) + 1
      ]
  if (!nextSong)
    // If this is the last favorite, play the first favorite
    nextSong = favorites[0]
  return allMusic.findIndex((haystack) => haystack.name === nextSong.name) || 0 // Now return the index from the catalog, or play the first song.
}
const saveFavorites = () => {
  try {
    localStorage.setItem(localStorageKeys.favorites, JSON.stringify(favorites))
  } catch (err) {
    console.error("Error saving favorites", err)
  }
}

playPauseBtn.addEventListener("click", () => toggleMusic())
prevBtn.addEventListener("click", () => prevMusic())
nextBtn.addEventListener("click", () => nextMusic())
favoriteMusicBtn.addEventListener("click", () =>
  toggleFavorite(nowPlayingSong())
)

Mousetrap.bind("space", () => toggleMusic())
Mousetrap.bind("left", () => prevMusic())
Mousetrap.bind("right", () => nextMusic())
Mousetrap.bind("f", () => toggleFavorite(nowPlayingSong()))

// update progress bar width according to music current time
mainAudio.addEventListener("timeupdate", (e) => {
  const currentTime = e.target.currentTime //getting playing song currentTime
  const duration = e.target.duration //getting playing song total duration
  let progressWidth = (currentTime / duration) * 100
  progressBar.style.width = `${progressWidth}%`

  let musicCurrentTime = wrapper.querySelector(".current-time"),
    musicDuartion = wrapper.querySelector(".max-duration")
  mainAudio.addEventListener("loadeddata", () => {
    // update song total duration
    let mainAdDuration = mainAudio.duration
    let totalMin = Math.floor(mainAdDuration / 60)
    let totalSec = Math.floor(mainAdDuration % 60)
    if (totalSec < 10) {
      //if sec is less than 10 then add 0 before it
      totalSec = `0${totalSec}`
    }
    musicDuartion.innerText = `${totalMin}:${totalSec}`
  })
  // update playing song current time
  let currentMin = Math.floor(currentTime / 60)
  let currentSec = Math.floor(currentTime % 60)
  if (currentSec < 10) {
    //if sec is less than 10 then add 0 before it
    currentSec = `0${currentSec}`
  }
  musicCurrentTime.innerText = `${currentMin}:${currentSec}`
})

// update playing song currentTime on according to the progress bar width
progressArea.addEventListener("click", (e) => {
  let progressWidth = progressArea.clientWidth //getting width of progress bar
  let clickedOffsetX = e.offsetX //getting offset x value
  let songDuration = mainAudio.duration //getting song total duration

  mainAudio.currentTime = (clickedOffsetX / progressWidth) * songDuration
  playMusic() //calling playMusic function
})

const repeatBtn = wrapper.querySelector("#repeat-plist")
const playModes = {
  repeat_one: "Playing one song on repeat",
  shuffle: "Playing all shuffled",
  repeat: "Playing all",
  stars: "Playing favorites only",
}
const savePlayMode = (playMode) => {
  try {
    localStorage.setItem(localStorageKeys.playMode, playMode)
  } catch (err) {
    console.error("Error saving play mode", err)
  }
}
const setPlayMode = (playMode) => {
  repeatBtn.innerText = playMode
  repeatBtn.setAttribute("title", playModes[playMode])
  savePlayMode(playMode)
}
const initPlayMode = () => {
  const playMode = localStorage.getItem(localStorageKeys.playMode)
  if (playMode) setPlayMode(playMode)
}
initPlayMode()
const getCurrentPlayMode = () => repeatBtn.innerText

//change loop, shuffle, repeat icon onclick
repeatBtn.addEventListener("click", () => {
  const modes = Object.keys(playModes)
  const index = modes.indexOf(getCurrentPlayMode())
  const nextPlayMode = modes[index + 1] || modes[0]
  setPlayMode(nextPlayMode)
})

const endOfSong = () => {
  // we'll do according to the icon means if user has set icon to
  // loop song then we'll repeat the current song and will do accordingly
  let getText = getCurrentPlayMode() //getting this tag innerText
  switch (getText) {
    case "repeat":
      nextMusic() //calling nextMusic function
      break
    case "repeat_one":
      mainAudio.currentTime = 0 //setting audio current time to 0
      loadMusic(musicIndex) //calling loadMusic function with argument, in the argument there is a index of current song
      playMusic() //calling playMusic function
      break
    case "stars":
      musicIndex = getNextFavorite(nowPlayingSong())
      loadMusic(musicIndex)
      playMusic()
      break
    case "shuffle":
      let randIndex = Math.floor(Math.random() * allMusic.length + 1) //genereting random index/numb with max range of array length
      do {
        randIndex = Math.floor(Math.random() * allMusic.length + 1)
      } while (musicIndex == randIndex) //this loop run until the next random number won't be the same of current musicIndex
      musicIndex = randIndex //passing randomIndex to musicIndex
      loadMusic(musicIndex)
      playMusic()
      break
  }
}

//code for what to do after song ended
mainAudio.addEventListener("ended", () => endOfSong())
