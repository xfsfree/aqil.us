document.addEventListener("contextmenu", (e) => {
  if (e.target.tagName === "IMG") {
    e.preventDefault()
    return false
  }
})

document.addEventListener(
  "touchstart",
  (e) => {
    if (e.target.tagName === "IMG") {
      e.preventDefault()
    }
  },
  { passive: false },
)

document.addEventListener(
  "touchend",
  (e) => {
    if (e.target.tagName === "IMG") {
      e.preventDefault()
    }
  },
  { passive: false },
)

document.addEventListener(
  "touchmove",
  (e) => {
    if (e.target.tagName === "IMG") {
      e.preventDefault()
    }
  },
  { passive: false },
)

document.querySelectorAll(".image-link").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault()
    const href = this.getAttribute("data-href")
    if (href && href !== "#") {
      window.location.href = href
    }
  })
})

document.querySelectorAll(".portfolio-item").forEach((item) => {
  item.addEventListener("click", () => {
    const frame = item.querySelector(".image-frame")
    frame.style.animation = "pulse 0.5s ease"
    setTimeout(() => {
      frame.style.animation = ""
    }, 500)
  })
})
