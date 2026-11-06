/**
 * Kira WhatsApp Web Helper Script
 * Injected into WhatsApp Web to collapse multi-step DOM operations into single fast calls.
 * Exposes window.__kira API.
 */
(() => {
  if (window.__kira) return;

  window.__kira = {
    // 1. Status Check
    status() {
      const qrCode = document.querySelector('[data-testid="link-device-qr-code"], [aria-label*="Scan this QR code" i]');
      if (qrCode) {
        return {
          loggedIn: false,
          page: 'whatsapp',
          reason: 'QR code login required'
        };
      }

      const searchInput = document.querySelector('[data-testid="chat-list-search"], [contenteditable="true"][data-tab="3"], div[role="textbox"]');
      const cells = document.querySelectorAll('[data-testid="cell-frame-container"], div[role="listitem"]');

      return {
        loggedIn: !!searchInput || cells.length > 0,
        page: 'whatsapp',
        chatCount: cells.length,
        hasSearch: !!searchInput
      };
    },

    // 2. Extract Unread Chats
    getUnread() {
      const unreadList = [];
      const cells = document.querySelectorAll('[data-testid="cell-frame-container"], div[role="listitem"]');

      cells.forEach(cell => {
        // Look for unread indicator
        const badge = cell.querySelector('[data-testid="icon-unread-count"]') ||
                      cell.querySelector('span[aria-label*="unread" i]') ||
                      cell.querySelector('span[aria-label*="Unread" i]');

        if (badge) {
          const nameEl = cell.querySelector('[data-testid="cell-frame-title"], span[title]') ||
                         cell.querySelector('div[role="gridcell"] span');
          const previewEl = cell.querySelector('[data-testid="last-msg-status"], [data-testid="cell-frame-secondary"]') ||
                            cell.querySelector('span[dir="ltr"]');
          const timeEl = cell.querySelector('[data-testid="cell-frame-secondary"] ~ div') ||
                            cell.querySelector('span[dir="auto"]');

          const name = nameEl?.textContent?.trim() || nameEl?.getAttribute('title') || 'Unknown';
          const preview = previewEl?.textContent?.trim() || '';
          const time = timeEl?.textContent?.trim() || '';
          const count = parseInt(badge.textContent?.trim() || '1', 10) || 1;

          unreadList.push({ name, preview, time, unreadCount: count });
        }
      });

      return unreadList;
    },

    // 3. Open Chat by Contact Name
    async openChat(contactName) {
      if (!contactName) return { success: false, error: 'Contact name required' };

      // Check if already visible in sidebar
      const cells = document.querySelectorAll('[data-testid="cell-frame-container"], div[role="listitem"]');
      for (const cell of cells) {
        const title = cell.querySelector('[data-testid="cell-frame-title"], span[title]')?.textContent?.trim();
        if (title && title.toLowerCase() === contactName.toLowerCase()) {
          cell.click();
          await this._wait(600);
          return { success: true, method: 'direct_click', contact: title };
        }
      }

      // Use search box
      const searchBox = document.querySelector('[data-testid="chat-list-search"]') ||
                        document.querySelector('[contenteditable="true"][data-tab="3"]') ||
                        document.querySelector('div[role="textbox"]');

      if (!searchBox) return { success: false, error: 'Search box not found' };

      searchBox.focus();
      searchBox.click();
      await this._wait(200);

      // Set input text
      const inputEl = document.querySelector('[data-testid="search-input"]') || searchBox;
      if (inputEl.tagName === 'INPUT') {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        setter?.call(inputEl, contactName);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, contactName);
      }

      await this._wait(1200);

      // Select first search result
      const results = document.querySelectorAll('[data-testid="cell-frame-container"], div[role="listitem"]');
      if (results.length > 0) {
        results[0].click();
        await this._wait(800);
        return { success: true, method: 'search', contact: contactName };
      }

      return { success: false, error: 'Contact not found in search results' };
    },

    // 4. Read Messages in Active Chat
    getMessages(limit = 15) {
      const msgContainers = document.querySelectorAll('[data-testid="msg-container"], div.message-in, div.message-out');
      const messages = [];

      const start = Math.max(0, msgContainers.length - limit);
      for (let i = start; i < msgContainers.length; i++) {
        const el = msgContainers[i];
        const isMe = !!el.querySelector('[data-testid="msg-dblcheck"]') ||
                     el.classList.contains('message-out') ||
                     el.getAttribute('data-id')?.startsWith('true_');

        const textEl = el.querySelector('.selectable-text, [data-testid="balloon-text"], span[dir="ltr"]');
        const text = textEl?.textContent?.trim() || '';

        const metaEl = el.querySelector('[data-testid="msg-meta"], span[data-testid="timestamp"]');
        const time = metaEl?.textContent?.trim() || '';

        if (text) {
          messages.push({
            fromMe: isMe,
            text: text.slice(0, 1000),
            time
          });
        }
      }

      return messages;
    },

    // 5. Send Message to Active Chat
    async sendMessage(messageText) {
      if (!messageText?.trim()) return { success: false, error: 'Empty message text' };

      const composeBox = document.querySelector('[data-testid="conversation-compose-box-input"]') ||
                         document.querySelector('[contenteditable="true"][data-tab="10"]') ||
                         document.querySelector('footer [contenteditable="true"]');

      if (!composeBox) return { success: false, error: 'Compose box not found' };

      composeBox.focus();
      await this._wait(150);

      // Clear any draft and insert text
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, messageText);
      await this._wait(300);

      // Click send button
      const sendBtn = document.querySelector('[data-testid="send"]') ||
                      document.querySelector('span[data-testid="send"]') ||
                      document.querySelector('button[aria-label*="Send" i]');

      if (sendBtn) {
        sendBtn.click();
        await this._wait(300);
        return { success: true };
      }

      // Fallback: dispatch Enter key
      const enterDown = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true });
      composeBox.dispatchEvent(enterDown);
      await this._wait(300);

      return { success: true, method: 'enter_key' };
    },

    _wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  };
})();
