document.addEventListener('DOMContentLoaded', () => {
    // === 1. Load Data ===
    const data = window.dictionaryData;
    const tableBody = document.getElementById('table-body');
    const searchInput = document.getElementById('search-input');
    
    // Function to render table
    function renderTable(items) {
        tableBody.innerHTML = '';
        if (items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Kata tidak ditemukan</td></tr>';
            return;
        }
        
        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="gaul-word">${item.word}</td>
                <td>${item.meaning}</td>
                <td><em>"${item.sentence}"</em></td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Initial render
    renderTable(data);

    // === 2. Search Feature ===
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = data.filter(item => 
            item.word.toLowerCase().includes(keyword) || 
            item.meaning.toLowerCase().includes(keyword)
        );
        renderTable(filtered);
    });

    // === 3. Chatbot Logic ===
    const chatTrigger = document.getElementById('chatbot-trigger');
    const chatContainer = document.getElementById('chatbot-container');
    const chatClose = document.getElementById('chat-close');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    // Toggle Chat
    chatTrigger.addEventListener('click', () => {
        chatContainer.classList.add('active');
        if (chatMessages.children.length === 0) {
            addBotMessage("hai saya MNH ini adalah tugas UAS bahasa Indonesia yg saya kerjakan dan saya akan menjawab pertanyaan anda");
        }
    });

    chatClose.addEventListener('click', () => {
        chatContainer.classList.remove('active');
    });

    // Send Message
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        addUserMessage(text);
        chatInput.value = '';

        // Set or reset clear timer (12 minutes)
        resetChatClearTimer();

        // Get bot response (Local Dictionary or Gemini AI)
        try {
            const localResponse = findLocalMeaning(text);
            if (localResponse) {
                setTimeout(() => addBotMessage(localResponse), 500);
            } else {
                // Use Gemini AI for natural conversation
                const aiResponse = await getAiResponse(text);
                addBotMessage(aiResponse);
            }
        } catch (error) {
            console.error("Chat error:", error);
            addBotMessage("Maaf, sepertinya koneksi otak robot saya sedang terganggu.");
        }
    }

    async function getAiResponse(message) {
        // Create conversation if not exists
        let conversationId = localStorage.getItem('chat_ai_conv_id');
        if (!conversationId) {
            try {
                const res = await fetch('/api/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: 'UAS Bahasa Indonesia' })
                });
                const conv = await res.json();
                conversationId = conv.id;
                localStorage.setItem('chat_ai_conv_id', conversationId);
            } catch (e) {
                console.error("Failed to create conversation:", e);
                return "Maaf, saya tidak bisa memulai percakapan baru.";
            }
        }

        try {
            const res = await fetch(`/api/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message })
            });

            if (!res.ok) throw new Error("API error");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = "";
            let botMsgDiv = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");
                
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.content) {
                                fullContent += data.content;
                                if (!botMsgDiv) {
                                    botMsgDiv = document.createElement('div');
                                    botMsgDiv.className = 'message bot-message';
                                    chatMessages.appendChild(botMsgDiv);
                                }
                                botMsgDiv.textContent = fullContent;
                                scrollToBottom();
                            }
                        } catch (e) {}
                    }
                }
            }
            return fullContent;
        } catch (e) {
            console.error("AI fetch error:", e);
            return "Maaf, terjadi kesalahan saat menghubungi AI.";
        }
    }

    // Timer logic to clear chat after 12 minutes of inactivity
    let chatClearTimer;
    function resetChatClearTimer() {
        if (chatClearTimer) clearTimeout(chatClearTimer);
        chatClearTimer = setTimeout(() => {
            clearChatHistory();
        }, 12 * 60 * 1000); // 12 minutes in milliseconds
    }

    function clearChatHistory() {
        chatMessages.innerHTML = '';
        addBotMessage("Riwayat percakapan telah dibersihkan otomatis (12 menit). Ada lagi yang bisa saya bantu?");
    }

    function addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'message user-message';
        div.textContent = text;
        chatMessages.appendChild(div);
        scrollToBottom();
    }

    function addBotMessage(text) {
        const div = document.createElement('div');
        div.className = 'message bot-message';
        div.textContent = text;
        chatMessages.appendChild(div);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function findLocalMeaning(keyword) {
        keyword = keyword.toLowerCase().trim();

        // Cek pertanyaan tentang identitas
        if (keyword.includes("siapa kamu") || keyword.includes("siapa anda") || (keyword.includes("siapa") && keyword.includes("kamu"))) {
            return "aku MNH, ini adalah tugas UAS bahasa Indonesia dan aku siap menjawab seluruh pertanyaan anda";
        }
        
        // Pembersihan input dari kata tanya umum (natural language processing sederhana)
        const stopWords = ["apa", "itu", "arti", "adalah", "maksud", "dari", "kata", "dong", "sih", "tahu", "kasih", "berikan"];
        let cleanKeyword = keyword;
        
        stopWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            cleanKeyword = cleanKeyword.replace(regex, '');
        });
        
        cleanKeyword = cleanKeyword.replace(/[?!.]/g, '').trim();

        // Cari di data kamus
        const match = data.find(item => 
            item.word.toLowerCase() === cleanKeyword ||
            keyword.includes(item.word.toLowerCase())
        );

        if (match) {
            return `${match.word} artinya: ${match.meaning}. Contoh: "${match.sentence}"`;
        }

        // Cek jika user menanyakan kata kunci yang ada di tengah kalimat
        for (const item of data) {
            if (keyword.includes(item.word.toLowerCase())) {
                return `${item.word} artinya: ${item.meaning}. Contoh: "${item.sentence}"`;
            }
        }

        return null;
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // === 4. Canvas Animation (Bubble Background) ===
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');

    let width, height;
    let bubbles = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Bubble {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height + height; // Start from bottom or random
            this.radius = Math.random() * 20 + 5;
            this.speed = Math.random() * 1 + 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.y -= this.speed;
            if (this.y + this.radius < 0) {
                this.y = height + this.radius;
                this.x = Math.random() * width;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.fill();
            ctx.closePath();
        }
    }

    function initBubbles() {
        bubbles = [];
        const count = Math.floor(width / 20); // Responsive count
        for (let i = 0; i < count; i++) {
            bubbles.push(new Bubble());
            // Randomize initial Y so they don't all start at bottom
            bubbles[i].y = Math.random() * height; 
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        bubbles.forEach(bubble => {
            bubble.update();
            bubble.draw();
        });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        resize();
        initBubbles();
    });

    resize();
    initBubbles();
    animate();
});
