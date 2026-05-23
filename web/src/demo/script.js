'use strict';

// ─── DOM References ─────────────────────────────────────
const fileInput     = document.getElementById('fileInput');
const uploadBtn     = document.getElementById('uploadBtn');
const previewZone   = document.getElementById('uploadPreviewZone');
const msgTextarea   = document.getElementById('msgTextarea');
const sendBtn       = document.getElementById('sendBtn');
const menuToggle    = document.querySelector('.menu-toggle');
const sidebar       = document.querySelector('.sidebar');

// ─── Menu Toggle (Mobile) ──────────────────────────────
if (menuToggle && sidebar) {
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        !sidebar.contains(e.target) &&
        !menuToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// ─── File Upload with LIVE Thumbnail Preview ───────────
// Uses FileReader API. Thumbnail is inserted ABOVE the textarea
// inside the input container, exactly as the spec requires.

if (fileInput && previewZone) {

  // Click the hidden input when the upload button is pressed
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });
  }

  // Handle file selection
  fileInput.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);

    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();

      reader.onload = (ev) => {
        // Create thumbnail container
        const container = document.createElement('div');
        container.className = 'thumb-container';

        const img = document.createElement('img');
        img.src = ev.target.result;
        img.alt = file.name;
        img.title = file.name;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'thumb-remove';
        removeBtn.innerHTML = '✕';
        removeBtn.setAttribute('aria-label', 'Remove image');

        // Remove thumbnail on click
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          container.remove();
          // Deactivate zone if no thumbnails remain
          if (previewZone.children.length === 0) {
            previewZone.classList.remove('active');
          }
          fileInput.value = '';
        });

        container.appendChild(img);
        container.appendChild(removeBtn);
        previewZone.appendChild(container);

        // Activate the preview zone so it gets padding and min-height
        previewZone.classList.add('active');
      };

      reader.readAsDataURL(file);
    });

    // Reset so the same file can be re-selected
    fileInput.value = '';
  });
}

// ─── Send Message (simulated) ──────────────────────────
if (sendBtn && msgTextarea) {
  function handleSend() {
    const text = msgTextarea.value.trim();
    if (!text) return;

    // Build a new sent-message bubble
    const thread = document.querySelector('.message-thread');
    if (!thread) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const msgItem = document.createElement('div');
    msgItem.className = 'message-item sent';

    msgItem.innerHTML = `
      <div class="msg-avatar">HA</div>
      <div class="msg-content">
        <div class="msg-meta">
          <span class="msg-author">You</span>
          <span class="msg-time">${timeStr}</span>
        </div>
        <div class="msg-text">${escapeHtml(text)}</div>
      </div>
    `;

    thread.appendChild(msgItem);

    // Scroll to bottom
    thread.scrollTop = thread.scrollHeight;

    // Clear input
    msgTextarea.value = '';
    msgTextarea.style.height = 'auto';
  }

  // Click send
  sendBtn.addEventListener('click', handleSend);

  // Enter to send, Shift+Enter for newline
  msgTextarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Auto-resize textarea
  msgTextarea.addEventListener('input', () => {
    msgTextarea.style.height = 'auto';
    msgTextarea.style.height = Math.min(msgTextarea.scrollHeight, 120) + 'px';
  });
}

// ─── Utility ────────────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
