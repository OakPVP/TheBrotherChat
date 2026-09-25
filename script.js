let savedName = "", brotherName = "Brother", offlineTimeout = null, isDnd = false, brotherDnd = false;
let messageHistory = [];
let unreadCount = 0;

const localPingAudio = new Audio('Ping.mp3');

function playCyberPing() {
    try {
        localPingAudio.currentTime = 0;
        localPingAudio.play().catch(() => {});
    } catch(e) {}
}

const channel = new BroadcastChannel('local_chat_channel');
const setupScreen = document.getElementById('setupScreen');
const nameSetupInput = document.getElementById('nameSetupInput');
const saveBtn = document.getElementById('saveBtn');
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const statusText = document.getElementById('statusText');
const statusIndicator = document.getElementById('statusIndicator');
const chatTitle = document.getElementById('chatTitle');
const dndBtn = document.getElementById('dndBtn');
const dlBtn = document.getElementById('dlBtn');
const clrBtn = document.getElementById('clrBtn');
const tabTitle = document.getElementById('tabTitle');

function broadcastCurrentState(typeStr = 'heartbeat') {
    if (savedName !== "") {
        channel.postMessage({ type: typeStr, name: savedName, dnd: isDnd });
    }
}

function appendMessage(s, t, y) { 
    const m = document.createElement('div'); 
    m.className = `msg ${y}`; 
    if (y !== 'system') {
        m.innerHTML = `<span class="sender-name">${s}</span>`;
    }
    m.appendChild(document.createTextNode(t));
    chatBox.appendChild(m); 
    chatBox.scrollTop = chatBox.scrollHeight;
    if (y !== 'system') {
        const timestamp = new Date().toLocaleTimeString();
        messageHistory.push(`[${timestamp}] ${s}: ${t}`);
    }
}

function setTerminalOffline() {
    statusText.innerText = "OFFLINE"; 
    statusIndicator.className = "status-dot"; 
}

function updateStatusState() {
    if (brotherDnd) { 
        statusText.innerText = "DND"; 
        statusIndicator.className = "status-dot dnd"; 
    } else { 
        statusText.innerText = "ONLINE"; 
        statusIndicator.className = "status-dot online"; 
    }
    clearTimeout(offlineTimeout);
    offlineTimeout = setTimeout(() => { 
        setTerminalOffline();
    }, 3000);
}

function processSubmission() { 
    const n = nameSetupInput.value.trim(); 
    if(n==="") return; 
    savedName = n; 
    setupScreen.style.opacity = '0'; 
    setTimeout(() => setupScreen.remove(), 60); 
    chatTitle.innerText = `LINKED: ${brotherName.toUpperCase()}`; 
    appendMessage('System', 'Connected to channel stream.', 'system'); 
    
    broadcastCurrentState('ping');
    setInterval(() => { broadcastCurrentState('heartbeat'); }, 1000); 
}

function sendMessage() { 
    const t = messageInput.value.trim(); 
    if(t==="") return; 
    channel.postMessage({ type: 'chat', name: savedName, text: t }); 
    appendMessage("Me", t, 'sent'); 
    messageInput.value = ""; 
    broadcastCurrentState('heartbeat'); 
}

saveBtn.onclick = processSubmission;
nameSetupInput.onkeydown = (e) => { if(e.key==='Enter') processSubmission(); };
sendBtn.onclick = sendMessage;
messageInput.onkeydown = (e) => { if(e.key==='Enter') sendMessage(); };

dndBtn.onclick = () => { 
    isDnd = !isDnd; 
    dndBtn.classList.toggle('active', isDnd); 
    broadcastCurrentState('status_change'); 
};

clrBtn.onclick = () => {
    chatBox.innerHTML = "";
    messageHistory = [];
    const flashMsg = document.createElement('div');
    flashMsg.className = 'msg system clear-flash';
    flashMsg.appendChild(document.createTextNode('Local visual feed cleared.'));
    chatBox.appendChild(flashMsg);
    setTimeout(() => { 
        if (flashMsg.parentNode) flashMsg.remove(); 
        appendMessage('System', 'Connected to channel stream.', 'system');
    }, 3000);
};

dlBtn.onclick = () => {
    if(messageHistory.length === 0) return alert("Data stream log empty.");
    const textBlob = new Blob([messageHistory.join('\r\n')], { type: 'text/plain' });
    const downloadLink = document.createElement('a');
    downloadLink.download = `brother_chat_stream_${Date.now()}.txt`;
    downloadLink.href = window.URL.createObjectURL(textBlob);
    downloadLink.click();
    window.URL.revokeObjectURL(downloadLink.href);
};

channel.onmessage = (e) => {
    const d = e.data;
    if (d.type === 'disconnect') {
        clearTimeout(offlineTimeout);
        setTerminalOffline();
        return;
    }
    if (d.type === 'ping') { 
        brotherName = d.name; 
        brotherDnd = d.dnd; 
        chatTitle.innerText = `LINKED: ${brotherName.toUpperCase()}`; 
        channel.postMessage({ type: 'pong', name: savedName, dnd: isDnd }); 
        updateStatusState(); 
    }
    else if (d.type === 'pong' || d.type === 'heartbeat' || d.type === 'status_change') { 
        brotherName = d.name; 
        brotherDnd = d.dnd; 
        chatTitle.innerText = `LINKED: ${brotherName.toUpperCase()}`; 
        updateStatusState(); 
    }
    else if (d.type === 'chat') { 
        appendMessage(d.name, d.text, 'received'); 
        if(!isDnd) { playCyberPing(); } 
        if (document.hidden) {
            unreadCount++;
            tabTitle.innerText = `(${unreadCount}) The Brother Chat`;
        }
    }
};

window.addEventListener('beforeunload', () => {
    broadcastCurrentState('disconnect');
});

window.addEventListener('focus', () => { 
    if (savedName === "") return; 
    broadcastCurrentState('ping');
    unreadCount = 0;
    tabTitle.innerText = "The Brother Chat";
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        if (savedName === "") return; 
        broadcastCurrentState('ping');
        unreadCount = 0;
        tabTitle.innerText = "The Brother Chat";
    }
});
