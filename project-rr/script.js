let currentSlide = 1
const totalSlides = 15
let isAnimating = false

function updateSlideCounter() {
  document.getElementById("current-slide").textContent = currentSlide
  document.getElementById("total-slides").textContent = totalSlides
}

function updateProgress() {
  const progress = (currentSlide / totalSlides) * 100
  document.getElementById("progress").style.width = progress + "%"
}

function changeSlide(direction) {
  if (isAnimating) return
  isAnimating = true

  const slides = document.querySelectorAll(".slide")
  const currentSlideElement = slides[currentSlide - 1]

  currentSlideElement.classList.remove("active")
  currentSlideElement.classList.add("prev")

  currentSlide += direction

  if (currentSlide > totalSlides) {
    currentSlide = 1
  } else if (currentSlide < 1) {
    currentSlide = totalSlides
  }

  const nextSlideElement = slides[currentSlide - 1]
  nextSlideElement.classList.remove("prev")
  nextSlideElement.classList.add("active")

  updateSlideCounter()
  updateProgress()

  setTimeout(() => {
    isAnimating = false
  }, 1200)
}

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === " ") {
    e.preventDefault()
    changeSlide(1)
  } else if (e.key === "ArrowLeft") {
    e.preventDefault()
    changeSlide(-1)
  }
})

// Touch swipe support
let touchStartX = 0
let touchEndX = 0

document.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX
})

document.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX
  handleSwipe()
})

function handleSwipe() {
  if (touchEndX < touchStartX - 50) {
    changeSlide(1)
  }
  if (touchEndX > touchStartX + 50) {
    changeSlide(-1)
  }
}

// Initialize
updateSlideCounter()
updateProgress()
